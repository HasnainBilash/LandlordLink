"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/format";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

export async function deleteBuilding(
  id: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const building = await prisma.building.findFirst({
    where: { id, ownerId: session.user.id, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!building) {
    return {
      success: false,
      message: "Building not found.",
      errors: {},
    };
  }

  // Deleting a building with tenants in it would leave their leases (and
  // rent) attached to flats that no longer exist.
  const activeLeases = await prisma.lease.count({
    where: { status: "ACTIVE", flat: { floor: { buildingId: id } } },
  });

  if (activeLeases > 0) {
    return {
      success: false,
      message: `This building still has ${pluralize(activeLeases, "active lease")}. End them before deleting the building.`,
      errors: {},
    };
  }

  // Soft delete: rows stay for rent and payment history. Floors and flats
  // go with the building, and anyone still waiting on a request is
  // turned down so it doesn't stay pending forever.
  const deletedAt = new Date();

  await prisma.$transaction([
    prisma.joinRequest.updateMany({
      where: { buildingId: id, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    prisma.flat.updateMany({
      where: { deletedAt: null, floor: { buildingId: id } },
      data: { deletedAt },
    }),
    prisma.floor.updateMany({
      where: { deletedAt: null, buildingId: id },
      data: { deletedAt },
    }),
    prisma.building.update({
      where: { id },
      data: { deletedAt },
    }),
  ]);

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Building",
    entityId: id,
    buildingId: id,
    description: `Deleted building "${building.name}".`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Deleted ${building.name}.`,
    errors: {},
  };
}
