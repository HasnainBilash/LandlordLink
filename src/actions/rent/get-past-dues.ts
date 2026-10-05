"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";
import {
  computePaymentStatus,
  remainingBalance,
  sumPayments,
} from "@/lib/payment-status";

import type { BillingRow } from "@/components/billing/billing-table";

// Former tenants (ended leases) who still owe rent or utility bills.
export async function getPastDues() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  const leases = await prisma.lease.findMany({
    where: {
      status: { not: "ACTIVE" },
      flat: { floor: { building: { ownerId: session.user.id } } },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      tenant: { select: { user: { select: { name: true, email: true } } } },
      flat: {
        select: {
          id: true,
          flatNumber: true,
          deletedAt: true,
          floor: {
            select: {
              name: true,
              floorNumber: true,
              building: { select: { id: true, name: true } },
            },
          },
        },
      },
      rents: {
        where: { status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
        orderBy: [{ year: "asc" }, { month: "asc" }],
        include: { payments: { select: { amount: true } } },
      },
      utilityBills: {
        where: { writtenOffAt: null },
        orderBy: [{ year: "asc" }, { month: "asc" }],
        include: { payments: { select: { amount: true } } },
      },
    },
  });

  const now = new Date();

  return leases
    .map((lease) => {
      const rentRows: BillingRow[] = lease.rents
        .filter((rent) => remainingBalance(rent) > 0)
        .map((rent) => ({
          id: rent.id,
          label: `Rent — ${MONTH_NAMES[rent.month - 1]} ${rent.year}`,
          amount: Number(rent.amount),
          paidTotal: sumPayments(rent.payments),
          dueDate: rent.dueDate,
          // Rent of an ended lease is never "pending" any more — it's late.
          status: rent.status === "PARTIAL" ? "PARTIAL" : "OVERDUE",
          target: { type: "RENT", id: rent.id },
        }));

      const billRows: BillingRow[] = lease.utilityBills
        .filter((bill) => remainingBalance(bill) > 0)
        .map((bill) => {
          const paidTotal = sumPayments(bill.payments);

          return {
            id: bill.id,
            label: `${UTILITY_TYPE_LABELS[bill.type]} — ${MONTH_NAMES[bill.month - 1]} ${bill.year}`,
            amount: Number(bill.amount),
            paidTotal,
            dueDate: bill.dueDate,
            status: computePaymentStatus({
              amount: Number(bill.amount),
              paidTotal,
              dueDate: bill.dueDate,
              now,
            }),
            target: { type: "UTILITY_BILL", id: bill.id },
          };
        });

      const rows = [...rentRows, ...billRows];

      return {
        leaseId: lease.id,
        tenantName: lease.tenant.user.name,
        tenantEmail: lease.tenant.user.email,
        flat: lease.flat,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rows,
        total: rows.reduce((sum, row) => sum + (row.amount - row.paidTotal), 0),
      };
    })
    .filter((lease) => lease.total > 0)
    .sort((a, b) => b.total - a.total);
}
