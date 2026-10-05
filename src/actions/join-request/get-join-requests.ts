"use server";

import type { JoinRequestStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUSES: JoinRequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "ENDED"];

// Join requests across the landlord's buildings, or one building when
// buildingId is given. Monthly rent is returned as a plain number so the
// rows can go straight to client components.
export async function getJoinRequests({
  status,
  buildingId,
}: {
  status?: string;
  buildingId?: string;
} = {}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return [];
  }

  const statusFilter = STATUSES.find((value) => value === status);

  const requests = await prisma.joinRequest.findMany({
    where: {
      ...(buildingId ? { buildingId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      building: {
        ownerId: session.user.id,
        deletedAt: null,
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      status: true,
      message: true,
      createdAt: true,
      // Never the whole user row: it holds the password hash.
      tenant: {
        select: {
          occupation: true,
          user: { select: { name: true, email: true } },
        },
      },
      building: { select: { id: true, name: true } },
      flat: {
        select: {
          id: true,
          flatNumber: true,
          monthlyRent: true,
          deletedAt: true,
          floor: { select: { floorNumber: true, name: true } },
        },
      },
    },
  });

  return requests.map((request) => ({
    ...request,
    flat: { ...request.flat, monthlyRent: Number(request.flat.monthlyRent) },
  }));
}
