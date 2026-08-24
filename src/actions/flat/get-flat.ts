"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getFlat(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.flat.findFirst({
    where: {
      id,
      deletedAt: null,
      floor: {
        building: {
          ownerId: session.user.id,
        },
      },
    },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
      joinRequests: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          tenant: {
            include: {
              user: true,
            },
          },
        },
      },
      leases: {
        where: {
          status: "ACTIVE",
        },
        take: 1,
      },
    },
  });
}