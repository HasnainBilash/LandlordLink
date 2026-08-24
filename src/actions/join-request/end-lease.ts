"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function endLease(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const joinRequest = await prisma.joinRequest.findFirst({
    where: {
      id,
      status: "APPROVED",
      building: {
        ownerId: session.user.id,
      },
    },
  });

  if (!joinRequest) {
    return {
      success: false,
      message: "Active tenancy not found.",
      errors: {},
    };
  }

  const activeLease = await prisma.lease.findFirst({
    where: {
      tenantId: joinRequest.tenantId,
      flatId: joinRequest.flatId,
      status: "ACTIVE",
    },
  });

  await prisma.$transaction([
    prisma.joinRequest.update({
      where: { id },
      data: { status: "ENDED" },
    }),
    prisma.flat.update({
      where: { id: joinRequest.flatId },
      data: { status: "VACANT" },
    }),
    ...(activeLease
      ? [
          prisma.lease.update({
            where: { id: activeLease.id },
            data: { status: "ENDED", endDate: new Date() },
          }),
        ]
      : []),
  ]);

  await logActivity({
    userId: session.user.id,
    action: "END",
    entity: "Lease",
    entityId: activeLease?.id,
    buildingId: joinRequest.buildingId,
    description: "Ended lease.",
  });

  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/buildings/${joinRequest.buildingId}/requests`);

  return {
    success: true,
    message: "Lease ended. The flat is now marked vacant.",
    errors: {},
  };
}
