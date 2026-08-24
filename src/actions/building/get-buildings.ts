"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getBuildings(status?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.building.findMany({
    where: {
      ownerId: session.user.id,
      deletedAt: null,
      ...(status
        ? {
            status: status as "ACTIVE" | "INACTIVE",
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}