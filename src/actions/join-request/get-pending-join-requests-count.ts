"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getPendingJoinRequestsCount() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return 0;
  }

  return prisma.joinRequest.count({
    where: {
      status: "PENDING",
      building: {
        ownerId: session.user.id,
      },
    },
  });
}