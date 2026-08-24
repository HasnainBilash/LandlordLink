"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { ActionResult } from "@/types/action-result";

export async function approveJoinRequest(id: string): Promise<ActionResult> {
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
      status: "PENDING",
      building: {
        ownerId: session.user.id,
      },
    },
  });

  if (!joinRequest) {
    return {
      success: false,
      message: "Request not found or already resolved.",
      errors: {},
    };
  }

  await prisma.$transaction([
    prisma.joinRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    prisma.flat.update({
      where: { id: joinRequest.flatId },
      data: { status: "OCCUPIED" },
    }),
    prisma.joinRequest.updateMany({
      where: {
        flatId: joinRequest.flatId,
        status: "PENDING",
        NOT: { id },
      },
      data: { status: "REJECTED" },
    }),
  ]);

  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/buildings/${joinRequest.buildingId}/requests`);

  return {
    success: true,
    message:
      "Request approved. The flat is now marked occupied, and any other pending requests for it were automatically rejected.",
    errors: {},
  };
}
