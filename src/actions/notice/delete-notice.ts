"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

import { ActionResult } from "@/types/action-result";

export async function deleteNotice(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized.",
      errors: {},
    };
  }

  const notice = await prisma.notice.findFirst({
    where: {
      id,
      building: {
        ownerId: session.user.id,
      },
    },
  });

  if (!notice) {
    return {
      success: false,
      message: "Notice not found.",
      errors: {},
    };
  }

  // Notice has no deletedAt column in the schema, unlike Building/Floor/
  // Flat — there's nothing to soft-delete into, so this is a hard delete.
  await prisma.notice.delete({
    where: { id },
  });

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entity: "Notice",
    entityId: id,
    buildingId: notice.buildingId,
    description: `Deleted notice "${notice.title}".`,
  });

  revalidatePath(`/dashboard/buildings/${notice.buildingId}/notices`);

  return {
    success: true,
    message: "Notice deleted.",
    errors: {},
  };
}
