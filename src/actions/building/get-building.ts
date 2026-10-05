"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/generate-access-code";

export async function getBuilding(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const building = await prisma.building.findFirst({
    where: {
      id,
      ownerId: session.user.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          floors: { where: { deletedAt: null } },
          notices: true,
        },
      },
    },
  });

  // Buildings created before access codes existed get one on first view,
  // so tenants can always request flats in them.
  if (building && !building.accessCode) {
    building.accessCode = await assignAccessCode(building.id);
  }

  return building;
}

async function assignAccessCode(buildingId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateAccessCode();

    try {
      await prisma.building.update({
        where: { id: buildingId },
        data: { accessCode },
      });

      return accessCode;
    } catch {
      // Unique collision — try another code.
    }
  }

  return null;
}
