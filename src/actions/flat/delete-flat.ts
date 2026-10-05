"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";
import { tombstoneFlatNumber } from "@/lib/tombstone";

import { ActionResult } from "@/types/action-result";

export async function deleteFlat(id: string): Promise<ActionResult> {
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
        building: {
          ownerId: session.user.id,
        },
      },
    },
    include: {
      floor: true,
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

  if (flat.leases.length > 0) {
    return {
      success: false,
      message: "Someone is living in this flat. End the lease before deleting it.",
      errors: {},
    };
  }

  // Soft delete (rent history stays) and free the flat number so a new
  // flat can reuse it. Pending requests for it are turned down.
  await prisma.$transaction([
    prisma.joinRequest.updateMany({
      where: { flatId: id, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    prisma.flat.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        flatNumber: tombstoneFlatNumber(flat.flatNumber, flat.id),
      },
    }),
  ]);

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Flat",
    entityId: id,
    buildingId: flat.floor.buildingId,
    description: `Deleted flat ${flat.flatNumber}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Deleted flat ${flat.flatNumber}.`,
    errors: {},
  };
}
