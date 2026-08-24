"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { ActionResult } from "@/types/action-result";

export async function markRentPaid(rentId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const rent = await prisma.rent.findFirst({
    where: {
      id: rentId,
      lease: {
        flat: {
          floor: {
            building: {
              ownerId: session.user.id,
            },
          },
        },
      },
    },
    include: {
      lease: {
        include: {
          flat: {
            include: {
              floor: true,
            },
          },
        },
      },
    },
  });

  if (!rent) {
    return {
      success: false,
      message: "Rent record not found.",
      errors: {},
    };
  }

  await prisma.rent.update({
    where: { id: rentId },
    data: { status: "PAID" },
  });

  revalidatePath(
    `/dashboard/buildings/${rent.lease.flat.floor.buildingId}/floors/${rent.lease.flat.floorId}/flats/${rent.lease.flatId}`
  );

  return {
    success: true,
    message: "Rent marked as paid.",
    errors: {},
  };
}
