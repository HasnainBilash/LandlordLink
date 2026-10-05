"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createFlatSchema } from "@/lib/validations/flat";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function createFlat(
  floorId: string,
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

  const floor = await prisma.floor.findFirst({
    where: {
      id: floorId,
      deletedAt: null,
      building: {
        ownerId: session.user.id,
        deletedAt: null,
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

  const values = {
    flatNumber: formData.get("flatNumber"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    monthlyRent: formData.get("monthlyRent"),
    status: formData.get("status") || undefined,
  };

  const parsed = createFlatSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  let flat;

  try {
    flat = await prisma.flat.create({
      data: {
        flatNumber: parsed.data.flatNumber,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        monthlyRent: parsed.data.monthlyRent,
        status: parsed.data.status,
        floorId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A flat with this number already exists on this floor.",
        errors: {
          flatNumber: ["This flat number is already in use on this floor."],
        },
      };
    }

    throw error;
  }

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "Flat",
    entityId: flat.id,
    buildingId: floor.buildingId,
    description: `Created flat ${flat.flatNumber}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Added flat ${flat.flatNumber}.`,
    errors: {},
  };
}
