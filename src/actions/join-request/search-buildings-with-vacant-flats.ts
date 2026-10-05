"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Buildings a tenant can request a flat in. Only public fields are
// selected — the access code must never reach a tenant who wasn't given it.
export async function searchBuildingsWithVacantFlats(query?: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  const buildings = await prisma.building.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      floors: {
        some: {
          deletedAt: null,
          flats: {
            some: {
              deletedAt: null,
              status: "VACANT",
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 50,
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      floors: {
        where: { deletedAt: null },
        select: {
          flats: {
            where: { deletedAt: null, status: "VACANT" },
            select: { monthlyRent: true },
          },
        },
      },
    },
  });

  return buildings.map((building) => {
    const rents = building.floors.flatMap((floor) =>
      floor.flats.map((flat) => Number(flat.monthlyRent))
    );

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      city: building.city,
      vacantFlats: rents.length,
      lowestRent: rents.length ? Math.min(...rents) : null,
    };
  });
}
