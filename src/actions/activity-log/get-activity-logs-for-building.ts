"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getActivityLogsForBuilding(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.activityLog.findMany({
    where: {
      buildingId,
      building: {
        ownerId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  });
}
