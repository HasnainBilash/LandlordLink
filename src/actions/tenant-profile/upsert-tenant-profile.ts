"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { tenantProfileSchema } from "@/lib/validations/tenant-profile";

import { ActionResult } from "@/types/action-result";

export async function upsertTenantProfile(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const values = {
    occupation: formData.get("occupation"),
    nationalId: formData.get("nationalId"),
    emergencyContact: formData.get("emergencyContact"),
  };

  const parsed = tenantProfileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.tenantProfile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        occupation: parsed.data.occupation || null,
        nationalId: parsed.data.nationalId || null,
        emergencyContact: parsed.data.emergencyContact || null,
      },
      create: {
        userId: session.user.id,
        occupation: parsed.data.occupation || null,
        nationalId: parsed.data.nationalId || null,
        emergencyContact: parsed.data.emergencyContact || null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "This National ID is already associated with another account.",
        errors: {
          nationalId: ["This National ID is already in use."],
        },
      };
    }

    throw error;
  }

  redirect("/tenant/profile");
}