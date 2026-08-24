import { prisma } from "@/lib/prisma";

type LogActivityInput = {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  buildingId?: string;
  description?: string;
};

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  buildingId,
  description,
}: LogActivityInput) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      buildingId: buildingId ?? null,
      description: description ?? null,
    },
  });
}
