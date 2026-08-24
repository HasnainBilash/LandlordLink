"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getFlats(floorId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.flat.findMany({
    where: {
      floorId,
      deletedAt: null,
      floor: {
        building: {
          ownerId: session.user.id,
        },
      },
    },
    orderBy: {
      flatNumber: "asc",
    },
    include: {
      leases: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { monthlyRent: true },
      },
    },
  });
}
