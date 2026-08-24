"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { createNoticeSchema } from "@/lib/validations/notice";

import { ActionResult } from "@/types/action-result";

export async function createNotice(
  buildingId: string,
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
    title: formData.get("title"),
    content: formData.get("content"),
    audience: formData.get("audience") || "ALL",
    expiresAt: formData.get("expiresAt"),
  };

  const parsed = createNoticeSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.notice.create({
    data: {
      buildingId,
      title: parsed.data.title,
      content: parsed.data.content,
      audience: parsed.data.audience,
      expiresAt: parsed.data.expiresAt ?? null,
    },
  });

  redirect(`/dashboard/buildings/${buildingId}/notices`);
}
