"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compareFlatNumbers } from "@/lib/format";

export async function getVacantFlatsForBuilding(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  const flats = await prisma.flat.findMany({
    where: {
      status: "VACANT",
      deletedAt: null,
      floor: {
        buildingId,
        deletedAt: null,
        building: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
    },
    select: {
      id: true,
      flatNumber: true,
      bedrooms: true,
      bathrooms: true,
      monthlyRent: true,
      floor: { select: { floorNumber: true, name: true } },
    },
  });

  return flats
    .map((flat) => ({ ...flat, monthlyRent: Number(flat.monthlyRent) }))
    .sort(
      (a, b) =>
        a.floor.floorNumber - b.floor.floorNumber ||
        compareFlatNumbers(a.flatNumber, b.flatNumber)
    );
}
