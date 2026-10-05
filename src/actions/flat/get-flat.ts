"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Only the tenant fields the flat page shows. Never load the whole user
// row here: this data is passed to client components, and the user row
// holds the password hash.
const tenantSelect = {
  id: true,
  occupation: true,
  emergencyContact: true,
  user: { select: { name: true, email: true, phone: true } },
} as const;

export async function getFlat(id: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return null;
  }

  return prisma.flat.findFirst({
    where: {
      id,
      deletedAt: null,
      floor: {
        deletedAt: null,
        building: {
          ownerId: session.user.id,
          deletedAt: null,
        },
      },
    },
    include: {
      floor: {
        include: {
          building: { select: { id: true, name: true } },
        },
      },
      joinRequests: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          message: true,
          createdAt: true,
          tenant: { select: tenantSelect },
        },
      },
      leases: {
        where: {
          status: "ACTIVE",
        },
        take: 1,
        include: {
          tenant: { select: tenantSelect },
        },
      },
    },
  });
}
