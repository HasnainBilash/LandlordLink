"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getMyJoinRequests(status?: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!tenantProfile) {
    return [];
  }

  return prisma.joinRequest.findMany({
    where: {
      tenantId: tenantProfile.id,
      ...(status
        ? {
            status: status as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "ENDED",
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      building: true,
      flat: {
        include: {
          floor: true,
        },
      },
    },
  });
}