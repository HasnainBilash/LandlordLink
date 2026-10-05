"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Every building the landlord owns, with the counts shown on its card.
export async function getBuildings() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  const buildings = await prisma.building.findMany({
    where: {
      ownerId: session.user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      status: true,
      floors: {
        where: { deletedAt: null },
        select: {
          flats: { where: { deletedAt: null }, select: { status: true } },
        },
      },
      _count: {
        select: { joinRequests: { where: { status: "PENDING" } } },
      },
    },
  });

  return buildings.map((building) => {
    const flats = building.floors.flatMap((floor) => floor.flats);

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      city: building.city,
      status: building.status,
      floorCount: building.floors.length,
      totalFlats: flats.length,
      occupied: flats.filter((flat) => flat.status === "OCCUPIED").length,
      vacant: flats.filter((flat) => flat.status === "VACANT").length,
      pendingRequests: building._count.joinRequests,
    };
  });
}
