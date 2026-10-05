"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compareFlatNumbers } from "@/lib/format";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";
import { getRentDueDate } from "@/lib/rent";

// Floors and their flats for the building page, with the current
// tenant's name and whether they're behind on rent.
export async function getBuildingUnits(buildingId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  await reconcileRentForOwner(session.user.id);

  const floors = await prisma.floor.findMany({
    where: {
      buildingId,
      deletedAt: null,
      building: { ownerId: session.user.id, deletedAt: null },
    },
    orderBy: { floorNumber: "asc" },
    select: {
      id: true,
      floorNumber: true,
      name: true,
      flats: {
        where: { deletedAt: null },
        select: {
          id: true,
          flatNumber: true,
          bedrooms: true,
          bathrooms: true,
          monthlyRent: true,
          status: true,
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              id: true,
              monthlyRent: true,
              tenant: { select: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  const leaseIds = floors.flatMap((floor) =>
    floor.flats.flatMap((flat) => flat.leases.map((lease) => lease.id))
  );

  const now = new Date();
  const startOfThisMonth = getRentDueDate(
    now.getUTCMonth() + 1,
    now.getUTCFullYear()
  );

  const overdueRent = leaseIds.length
    ? await prisma.rent.findMany({
        where: {
          leaseId: { in: leaseIds },
          OR: [
            { status: "OVERDUE" },
            { status: "PARTIAL", dueDate: { lt: startOfThisMonth } },
          ],
        },
        select: { leaseId: true },
        distinct: ["leaseId"],
      })
    : [];

  const overdueLeaseIds = new Set(overdueRent.map((rent) => rent.leaseId));

  return floors.map((floor) => ({
    id: floor.id,
    floorNumber: floor.floorNumber,
    name: floor.name,
    flats: floor.flats
      .sort((a, b) => compareFlatNumbers(a.flatNumber, b.flatNumber))
      .map((flat) => {
        const lease = flat.leases[0];

        return {
          id: flat.id,
          flatNumber: flat.flatNumber,
          bedrooms: flat.bedrooms,
          bathrooms: flat.bathrooms,
          status: flat.status,
          rent: Number(lease?.monthlyRent ?? flat.monthlyRent),
          tenantName: lease?.tenant.user.name ?? null,
          isOverdue: lease ? overdueLeaseIds.has(lease.id) : false,
        };
      }),
  }));
}
