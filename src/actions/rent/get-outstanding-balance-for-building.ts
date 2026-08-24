"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLease } from "@/lib/reconcile-rent";

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

  await Promise.all(
    activeLeases.map((lease) => reconcileRentForLease(lease.id))
  );

  const unpaidRent = await prisma.rent.findMany({
    where: {
      leaseId: { in: activeLeases.map((lease) => lease.id) },
      status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
    },
    select: { amount: true, leaseId: true },
  });

  const totalOutstanding = unpaidRent.reduce(
    (sum, rent) => sum + Number(rent.amount),
    0
  );

  const flatsWithOutstandingRent = new Set(
    unpaidRent.map(
      (rent) =>
        activeLeases.find((lease) => lease.id === rent.leaseId)?.flatId
    )
  ).size;

  return { totalOutstanding, flatsWithOutstandingRent };
}
