"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOutstandingByLease } from "@/lib/lease-balance";
import { reconcileRentForLeases } from "@/lib/reconcile-rent";

// Everything the tenant Home page shows: current homes with what is
// owed, notices from those buildings, and how many requests are pending.
export async function getTenantHome() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  const profile = await prisma.tenantProfile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
    select: { id: true, lastNoticesViewedAt: true },
  });

  const [leases, pendingRequests] = await Promise.all([
    prisma.lease.findMany({
      where: { tenantId: profile.id, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        startDate: true,
        monthlyRent: true,
        flat: {
          select: {
            id: true,
            flatNumber: true,
            bedrooms: true,
            bathrooms: true,
            floor: {
              select: {
                floorNumber: true,
                name: true,
                building: {
                  select: { id: true, name: true, address: true, city: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.joinRequest.count({
      where: { tenantId: profile.id, status: "PENDING" },
    }),
  ]);

  const leaseIds = leases.map((lease) => lease.id);

  await reconcileRentForLeases(leaseIds);

  const buildingIds = [
    ...new Set(leases.map((lease) => lease.flat.floor.building.id)),
  ];

  const [outstanding, notices] = await Promise.all([
    getOutstandingByLease(leaseIds),
    buildingIds.length
      ? prisma.notice.findMany({
          where: {
            buildingId: { in: buildingIds },
            audience: { in: ["ALL", "TENANTS"] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            expiresAt: true,
            building: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const lastViewed = profile.lastNoticesViewedAt ?? new Date(0);

  return {
    homes: leases.map((lease) => ({
      leaseId: lease.id,
      startDate: lease.startDate,
      monthlyRent: Number(lease.monthlyRent),
      owed: outstanding.get(lease.id) ?? 0,
      flat: lease.flat,
    })),
    notices: notices.map((notice) => ({
      ...notice,
      isNew: notice.createdAt > lastViewed,
    })),
    pendingRequests,
  };
}
