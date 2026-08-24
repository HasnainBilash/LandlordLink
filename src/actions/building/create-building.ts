"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createBuildingSchema } from "@/lib/validations/building";
import { generateAccessCode } from "@/lib/generate-access-code";

import { ActionResult } from "@/types/action-result";

const MAX_ACCESS_CODE_ATTEMPTS = 5;

export async function createBuilding(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const values = {
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    postcode: formData.get("postcode"),
    country: formData.get("country"),
    description: formData.get("description"),
  };

  const parsed = createBuildingSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  let building = null;

  for (let attempt = 0; attempt < MAX_ACCESS_CODE_ATTEMPTS; attempt++) {
    try {
      building = await prisma.building.create({
        data: {
          name: parsed.data.name,
          address: parsed.data.address,
          city: parsed.data.city,
          postcode: parsed.data.postcode || null,
          country: parsed.data.country,
          description: parsed.data.description || null,
          ownerId: session.user.id,
          accessCode: generateAccessCode(),
        },
      });

      break;
    } catch (error) {
      const isCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("accessCode");

      if (!isCodeCollision) {
        throw error;
      }
    }
  }

  if (!building) {
    return {
      success: false,
      message: "Could not generate a unique access code. Please try again.",
      errors: {},
    };
  }

  redirect(`/dashboard/buildings/${building.id}`);
}