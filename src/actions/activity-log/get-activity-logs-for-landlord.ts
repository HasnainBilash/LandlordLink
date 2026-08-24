"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Combines two kinds of activity: things this landlord personally did
// (including events with no building, like Login/Register) and
// anything that happened in a building they own, regardless of who
// did it (e.g. a tenant's join request). Together these cover both
// "User Activity" and "Building Activity" from the roadmap in one feed.
export async function getActivityLogsForLandlord() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  return prisma.activityLog.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { building: { ownerId: session.user.id } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
      building: {
        select: { name: true },
      },
    },
  });
}
