"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function rejectJoinRequest(id: string): Promise<ActionResult> {
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

  await prisma.joinRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "REJECT",
    entity: "JoinRequest",
    entityId: id,
    buildingId: joinRequest.buildingId,
    description: "Rejected join request.",
  });

  revalidatePath("/dashboard/requests");

  return {
    success: true,
    message: "Request rejected.",
    errors: {},
  };
}
