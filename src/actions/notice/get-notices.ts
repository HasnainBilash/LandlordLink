"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getNotices(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.notice.findMany({
    where: {
      buildingId,
      building: {
        ownerId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
