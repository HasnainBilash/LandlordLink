"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { approveJoinRequestSchema } from "@/lib/validations/lease";

import { ActionResult } from "@/types/action-result";

export async function approveJoinRequest(
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

  const values = {
    startDate: formData.get("startDate"),
    monthlyRent: formData.get("monthlyRent"),
    deposit: formData.get("deposit"),
  };

  const parsed = approveJoinRequestSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: Object.values(fieldErrors).flat()[0] ?? "Validation failed.",
      errors: fieldErrors,
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
    prisma.lease.create({
      data: {
        tenantId: joinRequest.tenantId,
        flatId: joinRequest.flatId,
        startDate: parsed.data.startDate,
        monthlyRent: parsed.data.monthlyRent,
        deposit: parsed.data.deposit ? Number(parsed.data.deposit) : null,
      },
    }),
  ]);

  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/buildings/${joinRequest.buildingId}/requests`);

  return {
    success: true,
    message:
      "Request approved and lease created. The flat is now marked occupied, and any other pending requests for it were automatically rejected.",
    errors: {},
  };
}
