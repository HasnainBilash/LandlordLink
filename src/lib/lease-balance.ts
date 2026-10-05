import { prisma } from "@/lib/prisma";
import { remainingBalance } from "@/lib/payment-status";

const UNPAID_RENT_STATUSES = ["PENDING", "OVERDUE", "PARTIAL"] as const;

// What each lease still owes (rent + utility bills), excluding anything
// paid or written off. Leases that owe nothing are left out of the map.
export async function getOutstandingByLease(leaseIds: string[]) {
  const outstanding = new Map<string, number>();

  if (leaseIds.length === 0) return outstanding;

  const [rents, bills] = await Promise.all([
    prisma.rent.findMany({
      where: { leaseId: { in: leaseIds }, status: { in: [...UNPAID_RENT_STATUSES] } },
      select: { leaseId: true, amount: true, status: true, payments: { select: { amount: true } } },
    }),
    prisma.utilityBill.findMany({
      where: { leaseId: { in: leaseIds }, writtenOffAt: null },
      select: { leaseId: true, amount: true, writtenOffAt: true, payments: { select: { amount: true } } },
    }),
  ]);

  for (const bill of [...rents, ...bills]) {
    const remaining = remainingBalance(bill);

    if (remaining > 0) {
      outstanding.set(bill.leaseId, (outstanding.get(bill.leaseId) ?? 0) + remaining);
    }
  }

  return outstanding;
}
