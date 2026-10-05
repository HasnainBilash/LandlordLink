"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatFloor, pluralize } from "@/lib/format";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";
import { tombstoneFloorNumber } from "@/lib/tombstone";

import { ActionResult } from "@/types/action-result";

export async function deleteFloor(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const floor = await prisma.floor.findFirst({
    where: {
      id,
      deletedAt: null,
      building: {
        ownerId: session.user.id,
      },
    },
  });

  if (!floor) {
    return {
      success: false,
      message: "Floor not found.",
      errors: {},
    };
  }

  const activeLeases = await prisma.lease.count({
    where: { status: "ACTIVE", flat: { floorId: id } },
  });

  if (activeLeases > 0) {
    return {
      success: false,
      message: `This floor still has ${pluralize(activeLeases, "active lease")}. End them before deleting the floor.`,
      errors: {},
    };
  }

  const deletedAt = new Date();

  // Soft delete (history stays), taking the floor's flats with it, and
  // free the floor number so a new floor can reuse it. The tombstone is
  // random, so retry on the (very unlikely) chance it collides.
  for (let attempt = 0; ; attempt++) {
    try {
      await prisma.$transaction([
        prisma.joinRequest.updateMany({
          where: { flat: { floorId: id }, status: "PENDING" },
          data: { status: "REJECTED" },
        }),
        prisma.flat.updateMany({
          where: { floorId: id, deletedAt: null },
          data: { deletedAt },
        }),
        prisma.floor.update({
          where: { id },
          data: { deletedAt, floorNumber: tombstoneFloorNumber() },
        }),
      ]);

      break;
    } catch (error) {
      const isCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isCollision || attempt >= 4) throw error;
    }
  }

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Floor",
    entityId: id,
    buildingId: floor.buildingId,
    description: `Deleted ${formatFloor(floor)}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Deleted ${formatFloor(floor)}.`,
    errors: {},
  };
}
