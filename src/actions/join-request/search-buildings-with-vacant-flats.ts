"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function searchBuildingsWithVacantFlats(query?: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  return prisma.building.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
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
  });
}