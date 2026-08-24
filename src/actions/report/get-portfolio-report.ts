"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLease } from "@/lib/reconcile-rent";
import { MONTH_NAMES } from "@/lib/rent";

const MONTHLY_HISTORY_LENGTH = 6;

export async function getPortfolioReport() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return null;
  }

  const buildings = await prisma.building.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const thisMonth = now.getUTCMonth();
  const thisYear = now.getUTCFullYear();

  const monthKeys = Array.from(
    { length: MONTHLY_HISTORY_LENGTH },
    (_, i) => {
      const offset = MONTHLY_HISTORY_LENGTH - 1 - i;
      const d = new Date(Date.UTC(thisYear, thisMonth - offset, 1));

      return {
        key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      };
    }
  );

  if (buildings.length === 0) {
    return {
      buildings: [],
      occupancy: { vacant: 0, occupied: 0, maintenance: 0, total: 0 },
      revenue: { allTime: 0, thisMonth: 0 },
      outstanding: { rent: 0, utilityBills: 0 },
      monthly: monthKeys.map(({ key, month, year }) => ({
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        key,
        due: 0,
        collected: 0,
      })),
    };
  }

  const buildingIds = buildings.map((b) => b.id);

  const flats = await prisma.flat.findMany({
    where: {
      deletedAt: null,
      floor: { deletedAt: null, buildingId: { in: buildingIds } },
    },
    select: { status: true, floor: { select: { buildingId: true } } },
  });

  const occupancyByBuilding = new Map<
    string,
    { vacant: number; occupied: number; maintenance: number }
  >(buildingIds.map((id) => [id, { vacant: 0, occupied: 0, maintenance: 0 }]));

  for (const flat of flats) {
    const bucket = occupancyByBuilding.get(flat.floor.buildingId);

    if (!bucket) continue;

    if (flat.status === "VACANT") bucket.vacant++;
    else if (flat.status === "OCCUPIED") bucket.occupied++;
    else bucket.maintenance++;
  }

  const activeLeases = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
      flat: { floor: { buildingId: { in: buildingIds } } },
    },
    select: {
      id: true,
      flat: { select: { floor: { select: { buildingId: true } } } },
    },
  });

  await Promise.all(
    activeLeases.map((lease) => reconcileRentForLease(lease.id))
  );

  const leaseBuildingMap = new Map(
    activeLeases.map((lease) => [lease.id, lease.flat.floor.buildingId])
  );
  const leaseIds = activeLeases.map((lease) => lease.id);

  const unpaidRent = leaseIds.length
    ? await prisma.rent.findMany({
        where: {
          leaseId: { in: leaseIds },
          status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
        },
        select: {
          amount: true,
          leaseId: true,
          payments: { select: { amount: true } },
        },
      })
    : [];

  let outstandingRentTotal = 0;
  const outstandingRentByBuilding = new Map<string, number>();

  for (const rent of unpaidRent) {
    const paid = rent.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const remaining = Number(rent.amount) - paid;

    outstandingRentTotal += remaining;

    const buildingId = leaseBuildingMap.get(rent.leaseId);

    if (buildingId) {
      outstandingRentByBuilding.set(
        buildingId,
        (outstandingRentByBuilding.get(buildingId) ?? 0) + remaining
      );
    }
  }

  const utilityBills = leaseIds.length
    ? await prisma.utilityBill.findMany({
        where: { leaseId: { in: leaseIds } },
        select: {
          amount: true,
          leaseId: true,
          payments: { select: { amount: true } },
        },
      })
    : [];

  let outstandingUtilityTotal = 0;
  const outstandingUtilityByBuilding = new Map<string, number>();

  for (const bill of utilityBills) {
    const paid = bill.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const remaining = Number(bill.amount) - paid;

    if (remaining <= 0) continue;

    outstandingUtilityTotal += remaining;

    const buildingId = leaseBuildingMap.get(bill.leaseId);

    if (buildingId) {
      outstandingUtilityByBuilding.set(
        buildingId,
        (outstandingUtilityByBuilding.get(buildingId) ?? 0) + remaining
      );
    }
  }

  const payments = await prisma.paymentHistory.findMany({
    where: {
      OR: [
        {
          rent: {
            lease: { flat: { floor: { buildingId: { in: buildingIds } } } },
          },
        },
        {
          utilityBill: {
            lease: { flat: { floor: { buildingId: { in: buildingIds } } } },
          },
        },
      ],
    },
    select: {
      amount: true,
      paidAt: true,
      rent: {
        select: {
          lease: { select: { flat: { select: { floor: true } } } },
        },
      },
      utilityBill: {
        select: {
          lease: { select: { flat: { select: { floor: true } } } },
        },
      },
    },
  });

  let revenueAllTime = 0;
  let revenueThisMonth = 0;
  const revenueByBuilding = new Map<string, number>();
  const monthlyRevenue = new Map<string, number>();

  for (const payment of payments) {
    const amount = Number(payment.amount);
    const buildingId =
      payment.rent?.lease.flat.floor.buildingId ??
      payment.utilityBill?.lease.flat.floor.buildingId;

    revenueAllTime += amount;

    if (buildingId) {
      revenueByBuilding.set(
        buildingId,
        (revenueByBuilding.get(buildingId) ?? 0) + amount
      );
    }

    const paidAt = new Date(payment.paidAt);

    if (
      paidAt.getUTCFullYear() === thisYear &&
      paidAt.getUTCMonth() === thisMonth
    ) {
      revenueThisMonth += amount;
    }

    const key = `${paidAt.getUTCFullYear()}-${String(
      paidAt.getUTCMonth() + 1
    ).padStart(2, "0")}`;

    monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + amount);
  }

  const rentDueRows = leaseIds.length
    ? await prisma.rent.findMany({
        where: {
          leaseId: { in: leaseIds },
          OR: monthKeys.map(({ month, year }) => ({ month, year })),
        },
        select: { amount: true, month: true, year: true },
      })
    : [];

  const rentDueByMonth = new Map<string, number>();

  for (const rent of rentDueRows) {
    const key = `${rent.year}-${String(rent.month).padStart(2, "0")}`;

    rentDueByMonth.set(
      key,
      (rentDueByMonth.get(key) ?? 0) + Number(rent.amount)
    );
  }

  const monthly = monthKeys.map(({ key, month, year }) => ({
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    key,
    due: rentDueByMonth.get(key) ?? 0,
    collected: monthlyRevenue.get(key) ?? 0,
  }));

  const occupancy = {
    vacant: 0,
    occupied: 0,
    maintenance: 0,
    total: flats.length,
  };

  for (const bucket of occupancyByBuilding.values()) {
    occupancy.vacant += bucket.vacant;
    occupancy.occupied += bucket.occupied;
    occupancy.maintenance += bucket.maintenance;
  }

  const buildingRows = buildings.map((building) => {
    const occ = occupancyByBuilding.get(building.id) ?? {
      vacant: 0,
      occupied: 0,
      maintenance: 0,
    };
    const totalFlats = occ.vacant + occ.occupied + occ.maintenance;

    return {
      id: building.id,
      name: building.name,
      totalFlats,
      vacant: occ.vacant,
      occupied: occ.occupied,
      maintenance: occ.maintenance,
      occupancyRate: totalFlats > 0 ? (occ.occupied / totalFlats) * 100 : 0,
      revenue: revenueByBuilding.get(building.id) ?? 0,
      outstandingRent: outstandingRentByBuilding.get(building.id) ?? 0,
      outstandingUtilityBills:
        outstandingUtilityByBuilding.get(building.id) ?? 0,
    };
  });

  return {
    buildings: buildingRows,
    occupancy,
    revenue: { allTime: revenueAllTime, thisMonth: revenueThisMonth },
    outstanding: {
      rent: outstandingRentTotal,
      utilityBills: outstandingUtilityTotal,
    },
    monthly,
  };
}
