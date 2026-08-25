"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getNeedsAttention() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return { pendingRequests: 0, overdueFlats: [] };
  }

  const [pendingRequests, overdueRent] = await Promise.all([
    prisma.joinRequest.count({
      where: {
        status: "PENDING",
        building: { ownerId: session.user.id },
      },
    }),
    prisma.rent.findMany({
      where: {
        status: "OVERDUE",
        lease: {
          flat: { floor: { building: { ownerId: session.user.id } } },
        },
      },
      select: {
        amount: true,
        payments: { select: { amount: true } },
        lease: {
          select: {
            flat: {
              select: {
                id: true,
                flatNumber: true,
                floorId: true,
                floor: {
                  select: {
                    buildingId: true,
                    building: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const overdueByFlat = new Map<
    string,
    {
      flatId: string;
      flatNumber: string;
      floorId: string;
      buildingId: string;
      buildingName: string;
      amount: number;
    }
  >();

  for (const rent of overdueRent) {
    const flat = rent.lease.flat;
    const paid = rent.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const remaining = Number(rent.amount) - paid;

    if (remaining <= 0) continue;

    const existing = overdueByFlat.get(flat.id);

    if (existing) {
      existing.amount += remaining;
    } else {
      overdueByFlat.set(flat.id, {
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        floorId: flat.floorId,
        buildingId: flat.floor.buildingId,
        buildingName: flat.floor.building.name,
        amount: remaining,
      });
    }
  }

  return {
    pendingRequests,
    overdueFlats: [...overdueByFlat.values()].sort(
      (a, b) => b.amount - a.amount
    ),
  };
}
