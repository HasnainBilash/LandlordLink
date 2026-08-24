"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLease } from "@/lib/reconcile-rent";

export async function getRentsForLease(leaseId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      flat: {
        floor: {
          building: {
            ownerId: session.user.id,
          },
        },
      },
    },
  });

  if (!lease) {
    return [];
  }

  await reconcileRentForLease(leaseId);

  return prisma.rent.findMany({
    where: { leaseId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}
