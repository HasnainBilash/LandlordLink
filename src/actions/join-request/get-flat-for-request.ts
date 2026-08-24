"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getFlatForRequest(flatId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  return prisma.flat.findFirst({
    where: {
      id: flatId,
      deletedAt: null,
      status: "VACANT",
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
