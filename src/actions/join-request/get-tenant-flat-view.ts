"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getTenantFlatView(flatId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!tenantProfile) {
    return null;
  }

  const myRequests = await prisma.joinRequest.findMany({
    where: {
      tenantId: tenantProfile.id,
      flatId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Only expose this flat's details to a tenant who has actually
  // interacted with it (requested it at some point). Prevents
  // URL-guessing into flats they have no relationship to.
  if (myRequests.length === 0) {
    return null;
  }

  const flat = await prisma.flat.findFirst({
    where: {
      id: flatId,
      deletedAt: null,
    },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!flat) {
    return null;
  }

  return { flat, myRequests };
}