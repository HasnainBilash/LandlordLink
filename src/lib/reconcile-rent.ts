import { prisma } from "@/lib/prisma";
import {
  getFirstBillableMonth,
  getMonthsBetween,
  getRentDueDate,
} from "@/lib/rent";

// Brings Rent rows up to date for many leases at once: creates any
// missing monthly rows and flips past-month PENDING rows to OVERDUE.
//
// Runs a fixed number of queries no matter how many leases are passed
// (previously it was 3 queries per lease, on every page view). When all
// rows already exist — the normal case — no insert is attempted.
export async function reconcileRentForLeases(leaseIds: string[]) {
  if (leaseIds.length === 0) {
    return;
  }

  const [leases, existing] = await Promise.all([
    prisma.lease.findMany({
      where: { id: { in: leaseIds }, status: "ACTIVE" },
      select: { id: true, startDate: true, monthlyRent: true },
    }),
    prisma.rent.groupBy({
      by: ["leaseId"],
      where: { leaseId: { in: leaseIds } },
      _count: { _all: true },
    }),
  ]);

  if (leases.length === 0) {
    return;
  }

  const existingCount = new Map(
    existing.map((row) => [row.leaseId, row._count._all])
  );

  const now = new Date();

  const missing = leases.flatMap((lease) => {
    const { month, year } = getFirstBillableMonth(lease.startDate);
    const periods = getMonthsBetween(getRentDueDate(month, year), now);

    if ((existingCount.get(lease.id) ?? 0) >= periods.length) {
      return [];
    }

    return periods.map((period) => ({
      leaseId: lease.id,
      month: period.month,
      year: period.year,
      amount: lease.monthlyRent,
      dueDate: getRentDueDate(period.month, period.year),
    }));
  });

  if (missing.length > 0) {
    await prisma.rent.createMany({ data: missing, skipDuplicates: true });
  }

  const startOfThisMonth = getRentDueDate(
    now.getUTCMonth() + 1,
    now.getUTCFullYear()
  );

  await prisma.rent.updateMany({
    where: {
      leaseId: { in: leases.map((lease) => lease.id) },
      status: "PENDING",
      dueDate: { lt: startOfThisMonth },
    },
    data: {
      status: "OVERDUE",
    },
  });
}

export async function reconcileRentForLease(leaseId: string) {
  await reconcileRentForLeases([leaseId]);
}
