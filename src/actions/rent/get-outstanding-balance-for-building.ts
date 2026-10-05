"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { remainingBalance } from "@/lib/payment-status";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";

export async function getOutstandingBalanceForBuilding(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return { totalOutstanding: 0, flatsWithOutstandingRent: 0 };
  }

  await reconcileRentForOwner(session.user.id);

  const unpaidRent = await prisma.rent.findMany({
    where: {
      status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
      lease: {
        status: "ACTIVE",
        flat: {
          floor: {
            buildingId,
            building: { ownerId: session.user.id },
          },
        },
      },
    },
    select: {
      amount: true,
      status: true,
      payments: { select: { amount: true } },
      lease: { select: { flatId: true } },
    },
  });

  let totalOutstanding = 0;
  const flatsWithOutstandingRent = new Set<string>();

  for (const rent of unpaidRent) {
    const remaining = remainingBalance(rent);

    if (remaining <= 0) continue;

    totalOutstanding += remaining;
    flatsWithOutstandingRent.add(rent.lease.flatId);
  }

  return {
    totalOutstanding,
    flatsWithOutstandingRent: flatsWithOutstandingRent.size,
  };
}
