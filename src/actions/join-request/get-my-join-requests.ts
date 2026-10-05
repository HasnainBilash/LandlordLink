"use server";

import type { JoinRequestStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUSES: JoinRequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "ENDED"];

export async function getMyJoinRequests(status?: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return [];
  }

  const statusFilter = STATUSES.find((value) => value === status);

  return prisma.joinRequest.findMany({
    where: {
      tenant: { userId: session.user.id },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      flatId: true,
      status: true,
      message: true,
      createdAt: true,
      building: { select: { id: true, name: true } },
      flat: {
        select: {
          flatNumber: true,
          floor: { select: { floorNumber: true, name: true } },
        },
      },
    },
  });
}
