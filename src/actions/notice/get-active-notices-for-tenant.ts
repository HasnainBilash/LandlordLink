"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantActiveBuildingIds } from "@/lib/get-tenant-active-building-ids";

export async function getActiveNoticesForTenant() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!tenantProfile) {
    return [];
  }

  const buildingIds = await getTenantActiveBuildingIds(tenantProfile.id);

  if (buildingIds.length === 0) {
    return [];
  }

  return prisma.notice.findMany({
    where: {
      buildingId: { in: buildingIds },
      audience: { in: ["ALL", "TENANTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      building: true,
    },
  });
}
