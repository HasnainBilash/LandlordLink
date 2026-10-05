"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/format";

import { quickSetupSchema } from "@/lib/validations/quick-setup";
import { logActivity } from "@/lib/log-activity";
import { revalidateApp } from "@/lib/revalidate";

import { ActionResult } from "@/types/action-result";

const MAX_FLOORS = 100;
const MAX_TOTAL_FLATS = 500;

export async function quickSetupBuilding(
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
    flatsPerFloor: formData.get("flatsPerFloor"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    monthlyRent: formData.get("monthlyRent"),
    status: formData.get("status") || undefined,
  };

  const parsed = quickSetupSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    fromFloor,
    toFloor,
    flatsPerFloor,
    bedrooms,
    bathrooms,
    monthlyRent,
    status,
  } = parsed.data;

  const floorCount = toFloor - fromFloor + 1;

  if (floorCount > MAX_FLOORS) {
    return {
      success: false,
      message: `You can generate at most ${MAX_FLOORS} floors at once.`,
      errors: {
        toFloor: ["This range is too large."],
      },
    };
  }

  if (floorCount * flatsPerFloor > MAX_TOTAL_FLATS) {
    return {
      success: false,
      message: `This would create ${
        floorCount * flatsPerFloor
      } flats, above the ${MAX_TOTAL_FLATS} limit for a single Quick Setup. Try a smaller floor range or fewer flats per floor.`,
      errors: {
        flatsPerFloor: ["Too many flats would be generated."],
      },
    };
  }

  const floorNumbers = Array.from(
    { length: floorCount },
    (_, index) => fromFloor + index
  );

  // A fixed number of queries no matter how big the building is:
  // create missing floors, read them back, create missing flats.
  const result = await prisma.$transaction(async (tx) => {
    const floorsCreated = await tx.floor.createMany({
      data: floorNumbers.map((floorNumber) => ({ buildingId, floorNumber })),
      skipDuplicates: true,
    });

    const floors = await tx.floor.findMany({
      where: {
        buildingId,
        deletedAt: null,
        floorNumber: { in: floorNumbers },
      },
      select: { id: true, floorNumber: true },
    });

    const flatsCreated = await tx.flat.createMany({
      data: floors.flatMap((floor) =>
        Array.from({ length: flatsPerFloor }, (_, index) => ({
          // Floor 3 with 8 flats becomes 301–308.
          flatNumber: String(floor.floorNumber * 100 + index + 1),
          bedrooms,
          bathrooms,
          monthlyRent,
          status,
          floorId: floor.id,
        }))
      ),
      skipDuplicates: true,
    });

    return { floors: floorsCreated.count, flats: flatsCreated.count };
  });

  if (result.floors === 0 && result.flats === 0) {
    return {
      success: false,
      message: "Those floors and flats already exist — nothing new was created.",
      errors: {},
    };
  }

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "Building",
    entityId: buildingId,
    buildingId,
    description: `Quick setup created ${pluralize(result.floors, "floor")} and ${pluralize(result.flats, "flat")}.`,
  });

  revalidateApp();

  return {
    success: true,
    message: `Created ${pluralize(result.floors, "floor")} and ${pluralize(result.flats, "flat")}.`,
    errors: {},
  };
}
