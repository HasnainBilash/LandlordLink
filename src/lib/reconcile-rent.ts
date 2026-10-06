import type { Prisma } from "@prisma/client";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  getFirstBillableMonth,
  getMonthsBetween,
  getRentDueDate,
} from "@/lib/rent";

// Billing rent means: create any missing monthly Rent rows and flip unpaid
// (PENDING) rows of past months to OVERDUE. It happens
//   - when a lease starts (approving a request),
//   - every night, for every active lease (/api/cron/bill-rent),
//   - and as a safety net wherever rent is shown. There it is one round of
//     read queries that normally finds nothing to do; it only writes when
//     the nightly job hasn't caught up yet (e.g. just after a month starts).
//
// A fixed number of queries no matter how many leases are covered.

export type BillingResult = { created: number; markedOverdue: number };

async function billRent(leases: Prisma.LeaseWhereInput): Promise<BillingResult> {
  const active: Prisma.LeaseWhereInput = { ...leases, status: "ACTIVE" };

  const now = new Date();
  const startOfThisMonth = getRentDueDate(now.getUTCMonth() + 1, now.getUTCFullYear());
  const overdue: Prisma.RentWhereInput = {
    lease: active,
    status: "PENDING",
    dueDate: { lt: startOfThisMonth },
  };

  const [found, existing, overdueCount] = await Promise.all([
    prisma.lease.findMany({
      where: active,
      select: { id: true, startDate: true, monthlyRent: true },
    }),
    prisma.rent.groupBy({
      by: ["leaseId"],
      where: { lease: active },
      _count: { _all: true },
    }),
    prisma.rent.count({ where: overdue }),
  ]);

  const existingCount = new Map(
    existing.map((row) => [row.leaseId, row._count._all])
  );

  const missing = found.flatMap((lease) => {
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

  // Nothing to do — the normal case.
  if (missing.length === 0 && overdueCount === 0) {
    return { created: 0, markedOverdue: 0 };
  }

  // skipDuplicates: two requests billing at the same moment can't create
  // a month twice (unique leaseId + month + year).
  const created =
    missing.length > 0
      ? await prisma.rent.createMany({ data: missing, skipDuplicates: true })
      : { count: 0 };

  // Rows just created for past months start as PENDING too.
  const markedOverdue = await prisma.rent.updateMany({
    where: overdue,
    data: { status: "OVERDUE" },
  });

  return { created: created.count, markedOverdue: markedOverdue.count };
}

export async function reconcileRentForLeases(leaseIds: string[]) {
  if (leaseIds.length === 0) {
    return { created: 0, markedOverdue: 0 };
  }

  return billRent({ id: { in: leaseIds } });
}

export async function reconcileRentForLease(leaseId: string) {
  return reconcileRentForLeases([leaseId]);
}

// Every active lease of one landlord. Wrapped in cache() so pages that need
// it from several places (e.g. Home shows both "needs attention" and the
// report numbers) only run it once per request.
export const reconcileRentForOwner = cache(async (ownerId: string) => {
  return billRent({ flat: { floor: { building: { ownerId } } } });
});

// The nightly job: every active lease, a batch at a time so a large
// database never loads all of them at once.
export async function billRentForAllLeases(batchSize = 500) {
  const total = { leases: 0, created: 0, markedOverdue: 0 };
  let after = "";

  for (;;) {
    const batch = await prisma.lease.findMany({
      where: { status: "ACTIVE", id: { gt: after } },
      select: { id: true },
      orderBy: { id: "asc" },
      take: batchSize,
    });

    if (batch.length === 0) {
      return total;
    }

    const result = await reconcileRentForLeases(batch.map((lease) => lease.id));

    total.leases += batch.length;
    total.created += result.created;
    total.markedOverdue += result.markedOverdue;
    after = batch[batch.length - 1].id;
  }
}
