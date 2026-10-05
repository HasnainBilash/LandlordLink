"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/format";

import { createFloorsBulkSchema } from "@/lib/validations/floor";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

const MAX_BULK_FLOORS = 100;

export async function createFloorsBulk(
  buildingId: string,
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

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      ownerId: session.user.id,
      deletedAt: null,
    },
  });

  if (!building) {
    return {
      success: false,
      message: "Building not found.",
      errors: {},
    };
  }

  const values = {
    fromFloor: formData.get("fromFloor"),
    toFloor: formData.get("toFloor"),
  };

  const parsed = createFloorsBulkSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fromFloor, toFloor } = parsed.data;
  const floorCount = toFloor - fromFloor + 1;

  if (floorCount > MAX_BULK_FLOORS) {
    return {
      success: false,
      message: `You can create at most ${MAX_BULK_FLOORS} floors at once.`,
      errors: {
        toFloor: ["This range is too large."],
      },
    };
  }

  const floorNumbers = Array.from(
    { length: floorCount },
    (_, index) => fromFloor + index
  );

  const { count } = await prisma.floor.createMany({
    data: floorNumbers.map((floorNumber) => ({
      floorNumber,
      buildingId,
    })),
    skipDuplicates: true,
  });

  if (count === 0) {
    return {
      success: false,
      message: "All of those floors already exist.",
      errors: {},
    };
  }

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "Floor",
    buildingId,
    description: `Created ${pluralize(count, "floor")} (${fromFloor} to ${toFloor}).`,
  });

  revalidateApp();

  const skipped = floorCount - count;

  return {
    success: true,
    message: `Added ${pluralize(count, "floor")}${
      skipped > 0 ? ` (${skipped} already existed)` : ""
    }.`,
    errors: {},
  };
}
