"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createJoinRequestSchema } from "@/lib/validations/join-request";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function createJoinRequest(
  flatId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  // Every profile field is optional, so there is nothing to "complete"
  // first — make sure the profile row exists and carry on.
  const tenantProfile = await prisma.tenantProfile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  const flat = await prisma.flat.findFirst({
    where: {
      id: flatId,
      deletedAt: null,
      status: "VACANT",
      floor: {
        deletedAt: null,
        building: { deletedAt: null, status: "ACTIVE" },
      },
    },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!flat) {
    return {
      success: false,
      message: "This flat is no longer available.",
      errors: {},
    };
  }

  const existingRequest = await prisma.joinRequest.findFirst({
    where: {
      tenantId: tenantProfile.id,
      flatId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    return {
      success: false,
      message: "You already have a pending request for this flat.",
      errors: {},
    };
  }

  const values = {
    accessCode: formData.get("accessCode"),
    message: formData.get("message"),
  };

  const parsed = createJoinRequestSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!flat.floor.building.accessCode) {
    return {
      success: false,
      message:
        "This building isn't accepting requests yet. Please contact the owner directly.",
      errors: {},
    };
  }

  if (
    parsed.data.accessCode.toUpperCase() !==
    flat.floor.building.accessCode.toUpperCase()
  ) {
    return {
      success: false,
      message: "Incorrect access code. Ask the building owner for the correct code.",
      errors: {
        accessCode: ["This code doesn't match."],
      },
    };
  }

  const joinRequest = await prisma.joinRequest.create({
    data: {
      tenantId: tenantProfile.id,
      buildingId: flat.floor.buildingId,
      flatId,
      message: parsed.data.message || null,
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "JoinRequest",
    entityId: joinRequest.id,
    buildingId: flat.floor.buildingId,
    description: `Requested flat ${flat.flatNumber}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Request sent for flat ${flat.flatNumber}. The landlord will review it.`,
    errors: {},
  };
}