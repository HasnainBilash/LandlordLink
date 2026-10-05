"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatFloor } from "@/lib/format";

import { createFloorSchema } from "@/lib/validations/floor";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function createFloor(
  buildingId: string,
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

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      ownerId: session.user.id,
      deletedAt: null,
    },
  });

  if (!building) {
    return {
      success: false,
      message: "Building not found.",
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

  let floor;

  try {
    floor = await prisma.floor.create({
      data: {
        floorNumber: parsed.data.floorNumber,
        name: parsed.data.name || null,
        buildingId,
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
    action: "CREATE",
    entity: "Floor",
    entityId: floor.id,
    buildingId,
    description: `Created ${formatFloor(floor)}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Added ${formatFloor(floor)}.`,
    errors: {},
  };
}
