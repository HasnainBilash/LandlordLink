"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getVacantFlatsForBuilding(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  return prisma.flat.findMany({
    where: {
      status: "VACANT",
      deletedAt: null,
      floor: {
        buildingId,
        deletedAt: null,
        building: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
    },
    orderBy: {
      monthlyRent: "asc",
    },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  });
}