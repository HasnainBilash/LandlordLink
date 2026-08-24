"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createUtilityBillSchema } from "@/lib/validations/utility-bill";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function createUtilityBill(
  leaseId: string,
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

  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      status: "ACTIVE",
      flat: {
        floor: {
          building: {
            ownerId: session.user.id,
          },
        },
      },
    },
    include: {
      flat: {
        include: {
          floor: true,
        },
      },
    },
  });

  if (!lease) {
    return {
      success: false,
      message: "Active lease not found.",
      errors: {},
    };
  }

  const values = {
    type: formData.get("type"),
    period: formData.get("period"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
  };

  const parsed = createUtilityBillSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: Object.values(fieldErrors).flat()[0] ?? "Validation failed.",
      errors: fieldErrors,
    };
  }

  let bill;

  try {
    bill = await prisma.utilityBill.create({
      data: {
        leaseId,
        type: parsed.data.type,
        month: parsed.data.month,
        year: parsed.data.year,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A bill of this type already exists for that month.",
        errors: {
          type: ["Already billed for this month."],
        },
      };
    }

    throw error;
  }

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entity: "UtilityBill",
    entityId: bill.id,
    buildingId: lease.flat.floor.buildingId,
    description: `Added ${parsed.data.type} bill for ${parsed.data.month}/${parsed.data.year}.`,
  });

  revalidatePath(
    `/dashboard/buildings/${lease.flat.floor.buildingId}/floors/${lease.flat.floorId}/flats/${lease.flatId}`
  );

  return {
    success: true,
    message: "Utility bill added.",
    errors: {},
  };
}
