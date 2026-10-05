"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatFlatNumber, formatMoney } from "@/lib/format";
import { logActivity } from "@/lib/log-activity";
import { remainingBalance } from "@/lib/payment-status";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

// Gives up on whatever a former tenant still owes: unpaid rent becomes
// WRITTEN_OFF and unpaid utility bills get writtenOffAt. Nothing is
// deleted, so the history (and any partial payments) stays visible.
export async function writeOffLeaseBalance(
  leaseId: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      flat: { floor: { building: { ownerId: session.user.id } } },
    },
    include: {
      tenant: { select: { user: { select: { name: true } } } },
      flat: { select: { flatNumber: true, floor: { select: { buildingId: true } } } },
      rents: {
        where: { status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
        include: { payments: { select: { amount: true } } },
      },
      utilityBills: {
        where: { writtenOffAt: null },
        include: { payments: { select: { amount: true } } },
      },
    },
  });

  if (!lease) {
    return {
      success: false,
      message: "Lease not found.",
      errors: {},
    };
  }

  if (lease.status === "ACTIVE") {
    return {
      success: false,
      message: "This lease is still active. End it before writing off what's owed.",
      errors: {},
    };
  }

  const unpaidRents = lease.rents.filter((rent) => remainingBalance(rent) > 0);
  const unpaidBills = lease.utilityBills.filter(
    (bill) => remainingBalance(bill) > 0
  );

  const owed = [...unpaidRents, ...unpaidBills].reduce(
    (sum, bill) => sum + remainingBalance(bill),
    0
  );

  if (owed <= 0) {
    return {
      success: false,
      message: "Nothing is owed on this lease.",
      errors: {},
    };
  }

  await prisma.$transaction([
    prisma.rent.updateMany({
      where: { id: { in: unpaidRents.map((rent) => rent.id) } },
      data: { status: "WRITTEN_OFF" },
    }),
    prisma.utilityBill.updateMany({
      where: { id: { in: unpaidBills.map((bill) => bill.id) } },
      data: { writtenOffAt: new Date() },
    }),
  ]);

  const flatNumber = formatFlatNumber(lease.flat.flatNumber);

  await logActivity({
    userId: session.user.id,
    action: "WRITE_OFF",
    entity: "Lease",
    entityId: lease.id,
    buildingId: lease.flat.floor.buildingId,
    description: `Wrote off ${formatMoney(owed)} owed by ${lease.tenant.user.name} (flat ${flatNumber}).`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Wrote off ${formatMoney(owed)} owed by ${lease.tenant.user.name}.`,
    errors: {},
  };
}
