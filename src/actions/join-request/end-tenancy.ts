"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { ActionResult } from "@/types/action-result";

export async function endTenancy(id: string): Promise<ActionResult> {
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

  await prisma.$transaction([
    prisma.joinRequest.update({
      where: { id },
      data: { status: "ENDED" },
    }),
    prisma.flat.update({
      where: { id: joinRequest.flatId },
      data: { status: "VACANT" },
    }),
  ]);

  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/buildings/${joinRequest.buildingId}/requests`);

  return {
    success: true,
    message: "Tenancy ended. The flat is now marked vacant.",
    errors: {},
  };
}