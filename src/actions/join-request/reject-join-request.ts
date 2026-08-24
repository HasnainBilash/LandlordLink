"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const result = await prisma.joinRequest.updateMany({
    where: {
      id,
      status: "PENDING",
      building: {
        ownerId: session.user.id,
      },
    },
    data: {
      status: "REJECTED",
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "Request not found or already resolved.",
      errors: {},
    };
  }

  revalidatePath("/dashboard/requests");

  return {
    success: true,
    message: "Request rejected.",
    errors: {},
  };
}
