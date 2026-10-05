"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/format";

import { createFlatsBulkSchema } from "@/lib/validations/flat";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

const MAX_BULK_FLATS = 100;

export async function createFlatsBulk(
  floorId: string,
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

  const floor = await prisma.floor.findFirst({
    where: {
      id: floorId,
      deletedAt: null,
      building: {
        ownerId: session.user.id,
        deletedAt: null,
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

  const values = {
    fromFlatNumber: formData.get("fromFlatNumber"),
    toFlatNumber: formData.get("toFlatNumber"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    monthlyRent: formData.get("monthlyRent"),
    status: formData.get("status") || undefined,
  };

  const parsed = createFlatsBulkSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    fromFlatNumber,
    toFlatNumber,
    bedrooms,
    bathrooms,
    monthlyRent,
    status,
  } = parsed.data;

  const flatCount = toFlatNumber - fromFlatNumber + 1;

  if (flatCount > MAX_BULK_FLATS) {
    return {
      success: false,
      message: `You can create at most ${MAX_BULK_FLATS} flats at once.`,
      errors: {
        toFlatNumber: ["This range is too large."],
      },
    };
  }

  const flatNumbers = Array.from({ length: flatCount }, (_, index) =>
    String(fromFlatNumber + index)
  );

  const { count } = await prisma.flat.createMany({
    data: flatNumbers.map((flatNumber) => ({
      flatNumber,
      bedrooms,
      bathrooms,
      monthlyRent,
      status,
      floorId,
    })),
    skipDuplicates: true,
  });

  if (count === 0) {
    return {
      success: false,
      message: "All of those flat numbers already exist on this floor.",
      errors: {},
    };
  }

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "Flat",
    buildingId: floor.buildingId,
    description: `Created ${pluralize(count, "flat")} (${fromFlatNumber} to ${toFlatNumber}).`,
  });

  revalidateApp();

  const skipped = flatCount - count;

  return {
    success: true,
    message: `Added ${pluralize(count, "flat")}${
      skipped > 0 ? ` (${skipped} already existed)` : ""
    }.`,
    errors: {},
  };
}
