"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUtilityBillsForLease(leaseId: string) {
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

  return prisma.utilityBill.findMany({
    where: { leaseId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { payments: true },
  });
}
