"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markNoticesViewed() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return;
  }

  await prisma.tenantProfile.updateMany({
    where: {
      userId: session.user.id,
    },
    data: {
      lastNoticesViewedAt: new Date(),
    },
  });
}
