import { prisma } from "@/lib/prisma";
import {
  getFirstBillableMonth,
  getMonthsBetween,
  getRentDueDate,
} from "@/lib/rent";

export async function reconcileRentForLease(leaseId: string) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
  });

  if (!lease || lease.status !== "ACTIVE") {
    return;
  }

  const now = new Date();

  const { month: firstMonth, year: firstYear } = getFirstBillableMonth(
    lease.startDate
  );

  const periods = getMonthsBetween(getRentDueDate(firstMonth, firstYear), now);

  await prisma.rent.createMany({
    data: periods.map(({ month, year }) => ({
      leaseId,
      month,
      year,
      amount: lease.monthlyRent,
      dueDate: getRentDueDate(month, year),
    })),
    skipDuplicates: true,
  });

  const startOfThisMonth = getRentDueDate(
    now.getUTCMonth() + 1,
    now.getUTCFullYear()
  );

  await prisma.rent.updateMany({
    where: {
      leaseId,
      status: "PENDING",
      dueDate: { lt: startOfThisMonth },
    },
    data: {
      status: "OVERDUE",
    },
  });
}
