"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantActiveBuildingIds } from "@/lib/get-tenant-active-building-ids";

export async function getUnreadNoticeCount() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return 0;
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!tenantProfile) {
    return 0;
  }

  const buildingIds = await getTenantActiveBuildingIds(tenantProfile.id);

  if (buildingIds.length === 0) {
    return 0;
  }

  return prisma.notice.count({
    where: {
      buildingId: { in: buildingIds },
      audience: { in: ["ALL", "TENANTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      createdAt: { gt: tenantProfile.lastNoticesViewedAt ?? new Date(0) },
    },
  });
}
