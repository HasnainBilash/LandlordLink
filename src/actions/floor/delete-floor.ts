"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function deleteFloor(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const floor = await prisma.floor.findFirst({
    where: {
      id,
      deletedAt: null,
      building: {
        ownerId: session.user.id,
      },
    },
  });

  if (!floor) {
    return {
      success: false,
      message: "Floor not found.",
      errors: {},
    };
  }

  await prisma.floor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Floor",
    entityId: id,
    buildingId: floor.buildingId,
    description: `Deleted floor ${floor.floorNumber}.`,
  });

  return {
    success: true,
    message: "Floor deleted successfully.",
    errors: {},
  };
}
