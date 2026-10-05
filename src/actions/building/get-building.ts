"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/generate-access-code";

export async function getBuilding(id: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
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
          joinRequests: { where: { status: "PENDING" } },
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

// Flat counts by status for the building page header.
export async function getBuildingOccupancy(buildingId: string) {
  const session = await auth();

  const empty = { total: 0, occupied: 0, vacant: 0, maintenance: 0 };

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return empty;
  }

  const groups = await prisma.flat.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
      floor: {
        buildingId,
        deletedAt: null,
        building: { ownerId: session.user.id },
      },
    },
    _count: { _all: true },
  });

  const count = (status: string) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;

  return {
    total: groups.reduce((sum, group) => sum + group._count._all, 0),
    occupied: count("OCCUPIED"),
    vacant: count("VACANT"),
    maintenance: count("MAINTENANCE"),
  };
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
