"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getBuildingForTenant(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  return prisma.building.findFirst({
    where: {
      id: buildingId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}