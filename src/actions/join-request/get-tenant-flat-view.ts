"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLease } from "@/lib/reconcile-rent";

export async function getTenantFlatView(flatId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "TENANT") {
    return null;
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!tenantProfile) {
    return null;
  }

  const myRequests = await prisma.joinRequest.findMany({
    where: {
      tenantId: tenantProfile.id,
      flatId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Only expose this flat's details to a tenant who has actually
  // interacted with it (requested it at some point). Prevents
  // URL-guessing into flats they have no relationship to.
  if (myRequests.length === 0) {
    return null;
  }

  const flat = await prisma.flat.findFirst({
    where: {
      id: flatId,
      deletedAt: null,
    },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!flat) {
    return null;
  }

  const activeLease = await prisma.lease.findFirst({
    where: {
      tenantId: tenantProfile.id,
      flatId,
      status: "ACTIVE",
    },
  });

  let rents: Awaited<
    ReturnType<typeof prisma.rent.findMany<{ include: { payments: true } }>>
  > = [];
  let utilityBills: Awaited<
    ReturnType<
      typeof prisma.utilityBill.findMany<{ include: { payments: true } }>
    >
  > = [];

  if (activeLease) {
    await reconcileRentForLease(activeLease.id);

    [rents, utilityBills] = await Promise.all([
      prisma.rent.findMany({
        where: { leaseId: activeLease.id },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: { payments: true },
      }),
      prisma.utilityBill.findMany({
        where: { leaseId: activeLease.id },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: { payments: true },
      }),
    ]);
  }

  return { flat, myRequests, activeLease, rents, utilityBills };
}