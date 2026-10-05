import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getTenantActiveBuildingIds } from "@/lib/get-tenant-active-building-ids";

// Badge counts for the navigation. Wrapped in cache() because the nav is
// rendered twice per page (desktop sidebar + mobile menu) — this keeps it
// to one query per request.

export const countPendingRequests = cache(async (ownerId: string) => {
  return prisma.joinRequest.count({
    where: {
      status: "PENDING",
      building: { ownerId, deletedAt: null },
    },
  });
});

export const countUnreadNotices = cache(async (userId: string) => {
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId },
    select: { id: true, lastNoticesViewedAt: true },
  });

  if (!tenantProfile) return 0;

  const buildingIds = await getTenantActiveBuildingIds(tenantProfile.id);

  if (buildingIds.length === 0) return 0;

  return prisma.notice.count({
    where: {
      buildingId: { in: buildingIds },
      audience: { in: ["ALL", "TENANTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      createdAt: { gt: tenantProfile.lastNoticesViewedAt ?? new Date(0) },
    },
  });
});
