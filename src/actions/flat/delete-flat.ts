"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function deleteFlat(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const flat = await prisma.flat.findFirst({
    where: {
      id,
      deletedAt: null,
      floor: {
        building: {
          ownerId: session.user.id,
        },
      },
    },
    include: {
      floor: true,
    },
  });

  if (!flat) {
    return {
      success: false,
      message: "Flat not found.",
      errors: {},
    };
  }

  await prisma.flat.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Flat",
    entityId: id,
    buildingId: flat.floor.buildingId,
    description: `Deleted flat ${flat.flatNumber}.`,
  });

  return {
    success: true,
    message: "Flat deleted successfully.",
    errors: {},
  };
}
