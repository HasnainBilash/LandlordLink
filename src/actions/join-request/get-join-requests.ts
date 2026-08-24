"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getJoinRequests(status?: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  return prisma.joinRequest.findMany({
    where: {
      building: {
        ownerId: session.user.id,
      },
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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      tenant: {
        include: {
          user: true,
        },
      },
      building: true,
      flat: {
        include: {
          floor: true,
        },
      },
    },
  });
}