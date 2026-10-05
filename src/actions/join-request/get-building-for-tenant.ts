"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getBuildingForTenant(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  return prisma.building.findFirst({
    where: {
      id: buildingId,
      deletedAt: null,
      status: "ACTIVE",
    },
    // Public fields only — never the access code.
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      description: true,
    },
  });
}

// "I have an access code" shortcut: finds the building the code belongs
// to. Returns only its id; the tenant still has to send the code with a
// request, where it is checked again.
export async function findBuildingByAccessCode(code: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  const normalized = code.trim().toUpperCase();

  if (!normalized) return null;

  return prisma.building.findFirst({
    where: {
      accessCode: normalized,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });
}
