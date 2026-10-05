"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLeases } from "@/lib/reconcile-rent";

export async function getOutstandingBalanceForBuilding(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { totalOutstanding: 0, flatsWithOutstandingRent: 0 };
  }

  const activeLeases = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
      flat: {
        floor: {
          buildingId,
          building: {
            ownerId: session.user.id,
          },
        },
      },
    },
    select: { id: true, flatId: true },
  });

  if (activeLeases.length === 0) {
    return { totalOutstanding: 0, flatsWithOutstandingRent: 0 };
  }

  await reconcileRentForLeases(activeLeases.map((lease) => lease.id));

  const unpaidRent = await prisma.rent.findMany({
    where: {
      leaseId: { in: activeLeases.map((lease) => lease.id) },
      status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
    },
    select: { amount: true, leaseId: true, payments: { select: { amount: true } } },
  });

  const totalOutstanding = unpaidRent.reduce((sum, rent) => {
    const paidSoFar = rent.payments.reduce(
      (paidSum, payment) => paidSum + Number(payment.amount),
      0
    );

    return sum + (Number(rent.amount) - paidSoFar);
  }, 0);

  const flatIdByLease = new Map(
    activeLeases.map((lease) => [lease.id, lease.flatId])
  );

  const flatsWithOutstandingRent = new Set(
    unpaidRent.map((rent) => flatIdByLease.get(rent.leaseId))
  ).size;

  return { totalOutstanding, flatsWithOutstandingRent };
}
