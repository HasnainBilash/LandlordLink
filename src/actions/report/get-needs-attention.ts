"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOutstandingByLease } from "@/lib/lease-balance";
import { remainingBalance } from "@/lib/payment-status";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";
import { getRentDueDate } from "@/lib/rent";

export async function getNeedsAttention() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      pendingRequests: 0,
      overdueFlats: [],
      pastDues: { tenants: 0, amount: 0 },
    };
  }

  const ownerId = session.user.id;

  // Rent rows only turn OVERDUE when reconciled, so bring them up to
  // date first.
  await reconcileRentForOwner(ownerId);

  const now = new Date();
  const startOfThisMonth = getRentDueDate(
    now.getUTCMonth() + 1,
    now.getUTCFullYear()
  );

  const [pendingRequests, overdueRent, endedLeases] = await Promise.all([
    prisma.joinRequest.count({
      where: {
        status: "PENDING",
        building: { ownerId, deletedAt: null },
      },
    }),
    // Current tenants who are behind: anything from a past month that
    // isn't fully paid (a partly-paid past month is overdue too).
    prisma.rent.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          { status: "PARTIAL", dueDate: { lt: startOfThisMonth } },
        ],
        lease: {
          status: "ACTIVE",
          flat: { floor: { building: { ownerId } } },
        },
      },
      select: {
        amount: true,
        status: true,
        payments: { select: { amount: true } },
        lease: {
          select: {
            tenant: { select: { user: { select: { name: true } } } },
            flat: {
              select: {
                id: true,
                flatNumber: true,
                floor: {
                  select: {
                    building: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    // Former tenants who left owing money are summarised separately —
    // they are handled under Reports → Past dues.
    prisma.lease.findMany({
      where: {
        status: { not: "ACTIVE" },
        flat: { floor: { building: { ownerId } } },
      },
      select: { id: true },
    }),
  ]);

  const overdueByFlat = new Map<
    string,
    {
      flatId: string;
      flatNumber: string;
      buildingId: string;
      buildingName: string;
      tenantName: string;
      amount: number;
    }
  >();

  for (const rent of overdueRent) {
    const remaining = remainingBalance(rent);

    if (remaining <= 0) continue;

    const flat = rent.lease.flat;
    const existing = overdueByFlat.get(flat.id);

    if (existing) {
      existing.amount += remaining;
    } else {
      overdueByFlat.set(flat.id, {
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        buildingId: flat.floor.building.id,
        buildingName: flat.floor.building.name,
        tenantName: rent.lease.tenant.user.name,
        amount: remaining,
      });
    }
  }

  const pastDueByLease = await getOutstandingByLease(
    endedLeases.map((lease) => lease.id)
  );

  return {
    pendingRequests,
    overdueFlats: [...overdueByFlat.values()].sort(
      (a, b) => b.amount - a.amount
    ),
    pastDues: {
      tenants: pastDueByLease.size,
      amount: [...pastDueByLease.values()].reduce((sum, value) => sum + value, 0),
    },
  };
}
