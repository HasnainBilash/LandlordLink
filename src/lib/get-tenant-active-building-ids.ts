import { prisma } from "@/lib/prisma";

export async function getTenantActiveBuildingIds(
  tenantId: string
): Promise<string[]> {
  const activeLeases = await prisma.lease.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
    },
    select: {
      flat: {
        select: {
          floor: {
            select: {
              buildingId: true,
            },
          },
        },
      },
    },
  });

  return [
    ...new Set(activeLeases.map((lease) => lease.flat.floor.buildingId)),
  ];
}
