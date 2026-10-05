"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { approveJoinRequestSchema } from "@/lib/validations/lease";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

// Thrown inside the transaction to roll it back with a friendly message.
class ApprovalConflict extends Error {}

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
    include: {
      flat: { select: { flatNumber: true, deletedAt: true } },
      tenant: { select: { user: { select: { name: true } } } },
    },
  });

  if (!joinRequest) {
    return {
      success: false,
      message: "Request not found or already resolved.",
      errors: {},
    };
  }

  if (joinRequest.flat.deletedAt) {
    return {
      success: false,
      message: "This flat has been deleted, so the request can't be approved.",
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
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { flatId, tenantId } = joinRequest;

  let lease;

  try {
    lease = await prisma.$transaction(async (tx) => {
      // Lock the flat so two approvals for the same flat can't both pass
      // the "no active lease" check below.
      await tx.$queryRaw`SELECT "id" FROM "Flat" WHERE "id" = ${flatId} FOR UPDATE`;

      const claimed = await tx.joinRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (claimed.count === 0) {
        throw new ApprovalConflict("This request was already handled.");
      }

      const existingLease = await tx.lease.findFirst({
        where: { flatId, status: "ACTIVE" },
        select: { id: true },
      });

      if (existingLease) {
        throw new ApprovalConflict(
          "This flat already has an active lease. End it before approving another tenant."
        );
      }

      await tx.flat.update({
        where: { id: flatId },
        data: { status: "OCCUPIED" },
      });

      // The flat is taken now, so anyone else waiting on it is turned down.
      await tx.joinRequest.updateMany({
        where: { flatId, status: "PENDING", NOT: { id } },
        data: { status: "REJECTED" },
      });

      return tx.lease.create({
        data: {
          tenantId,
          flatId,
          startDate: parsed.data.startDate,
          monthlyRent: parsed.data.monthlyRent,
          deposit: parsed.data.deposit ? Number(parsed.data.deposit) : null,
        },
      });
    });
  } catch (error) {
    if (error instanceof ApprovalConflict) {
      return {
        success: false,
        message: error.message,
        errors: {},
      };
    }

    throw error;
  }

  await logActivity({
    userId: session.user.id,
    action: "APPROVE",
    entity: "JoinRequest",
    entityId: id,
    buildingId: joinRequest.buildingId,
    description: `Approved ${joinRequest.tenant.user.name} for flat ${joinRequest.flat.flatNumber} and created lease ${lease.id}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Approved. ${joinRequest.tenant.user.name} now has a lease for flat ${joinRequest.flat.flatNumber}.`,
    errors: {},
  };
}
