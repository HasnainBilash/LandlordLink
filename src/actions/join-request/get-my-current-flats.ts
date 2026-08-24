"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getMyCurrentFlats() {
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

  const approvedRequests = await prisma.joinRequest.findMany({
    where: {
      tenantId: tenantProfile.id,
      status: "APPROVED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      building: true,
      flat: {
        include: {
          floor: true,
          leases: {
            where: {
              status: "ACTIVE",
            },
            take: 1,
          },
        },
      },
    },
  });

  return approvedRequests;
}