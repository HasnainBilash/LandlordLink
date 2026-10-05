"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Called once the tenant actually sees their notices (Home page). It
// deliberately doesn't revalidate: the "New" labels stay visible for this
// visit, and the nav badge clears on the next page load.
export async function markNoticesViewed() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return;
  }

  await prisma.tenantProfile.updateMany({
    where: {
      userId: session.user.id,
    },
    data: {
      lastNoticesViewedAt: new Date(),
    },
  });
}
