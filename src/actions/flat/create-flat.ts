"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createFlatSchema } from "@/lib/validations/flat";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function createFlat(
  buildingId: string,
  floorId: string,
  formData: FormData
): Promise<ActionResult> {
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
      id: floorId,
      deletedAt: null,
      building: {
        id: buildingId,
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

  const values = {
    flatNumber: formData.get("flatNumber"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    monthlyRent: formData.get("monthlyRent"),
    status: formData.get("status") || "VACANT",
  };

  const parsed = createFlatSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
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
          flatNumber: ["This flat number is already in use."],
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
    buildingId,
    description: `Created flat ${flat.flatNumber}.`,
  });

  redirect(
    `/dashboard/buildings/${buildingId}/floors/${floorId}/flats/${flat.id}`
  );
}
