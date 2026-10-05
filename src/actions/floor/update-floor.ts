"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createFloorSchema } from "@/lib/validations/floor";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function updateFloor(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const values = {
    floorNumber: formData.get("floorNumber"),
    name: formData.get("name"),
  };

  const parsed = createFloorSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const floor = await prisma.floor.findFirst({
    where: {
      id,
      deletedAt: null,
      building: { ownerId: session.user.id, deletedAt: null },
    },
  });

  if (!floor) {
    return {
      success: false,
      message: "Floor not found.",
      errors: {},
    };
  }

  try {
    await prisma.floor.update({
      where: { id },
      data: {
        floorNumber: parsed.data.floorNumber,
        name: parsed.data.name || null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A floor with this number already exists in this building.",
        errors: {
          floorNumber: ["This floor number is already in use."],
        },
      };
    }

    throw error;
  }

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Floor",
    entityId: id,
    buildingId: floor.buildingId,
    description: `Updated floor ${parsed.data.floorNumber}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: "Floor saved.",
    errors: {},
  };
}
