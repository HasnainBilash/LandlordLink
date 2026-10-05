"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createFlatSchema } from "@/lib/validations/flat";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function updateFlat(
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

  const flat = await prisma.flat.findFirst({
    where: {
      id,
      deletedAt: null,
      floor: {
        deletedAt: null,
        building: {
          ownerId: session.user.id,
          deletedAt: null,
        },
      },
    },
    include: {
      floor: { select: { buildingId: true } },
      leases: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
    },
  });

  if (!flat) {
    return {
      success: false,
      message: "Flat not found.",
      errors: {},
    };
  }

  const hasActiveLease = flat.leases.length > 0;

  const values = {
    flatNumber: formData.get("flatNumber"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    monthlyRent: formData.get("monthlyRent"),
    // A leased flat is always OCCUPIED; its status can't be edited.
    status: hasActiveLease ? undefined : formData.get("status") || undefined,
  };

  const parsed = createFlatSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.flat.update({
      where: { id },
      data: {
        flatNumber: parsed.data.flatNumber,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        monthlyRent: parsed.data.monthlyRent,
        status: hasActiveLease ? "OCCUPIED" : parsed.data.status,
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
    action: "UPDATE",
    entity: "Flat",
    entityId: id,
    buildingId: flat.floor.buildingId,
    description: `Updated flat ${parsed.data.flatNumber}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: "Flat saved.",
    errors: {},
  };
}
