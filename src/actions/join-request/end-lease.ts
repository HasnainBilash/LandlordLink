"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getOutstandingByLease } from "@/lib/lease-balance";
import { logActivity } from "@/lib/log-activity";
import { reconcileRentForLease } from "@/lib/reconcile-rent";
import { revalidateApp } from "@/lib/revalidate";

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

  // Make sure every month up to today is billed before the lease closes;
  // rent is only generated for active leases.
  if (activeLease) {
    await reconcileRentForLease(activeLease.id);
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

  revalidateApp();

  const owed = activeLease
    ? (await getOutstandingByLease([activeLease.id])).get(activeLease.id) ?? 0
    : 0;

  return {
    success: true,
    message:
      owed > 0
        ? `Lease ended. The tenant still owes ${formatMoney(owed)} — you'll find it under Reports → Past dues.`
        : "Lease ended. The flat is vacant again.",
    errors: {},
  };
}
