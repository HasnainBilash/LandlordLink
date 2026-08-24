"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getNotice(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.notice.findFirst({
    where: {
      id,
      building: {
        ownerId: session.user.id,
      },
    },
  });
}
