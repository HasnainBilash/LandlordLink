"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reconcileRentForLeases } from "@/lib/reconcile-rent";
import { MONTH_NAMES } from "@/lib/rent";

const MONTHLY_HISTORY_LENGTH = 6;

type BuildingAmountRow = { buildingId: string; amount: number };
type RevenueRow = { buildingId: string; monthKey: string; amount: number };

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
  const thisMonthKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;

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
  const buildingIdList = Prisma.join(buildingIds);

  const [flats, activeLeases] = await Promise.all([
    prisma.flat.findMany({
      where: {
        deletedAt: null,
        floor: { deletedAt: null, buildingId: { in: buildingIds } },
      },
      select: { status: true, floor: { select: { buildingId: true } } },
    }),
    prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        flat: { floor: { buildingId: { in: buildingIds } } },
      },
      select: { id: true },
    }),
  ]);

  const leaseIds = activeLeases.map((lease) => lease.id);

  await reconcileRentForLeases(leaseIds);

  // All money totals are summed by Postgres; only a handful of rows
  // (one per building, or per building+month) come back.
  const [outstandingRentRows, outstandingUtilityRows, revenueRows, rentDueRows] =
    await Promise.all([
      prisma.$queryRaw<BuildingAmountRow[]>`
        SELECT fl."buildingId" AS "buildingId",
               SUM(r."amount" - COALESCE(p."paid", 0))::float8 AS "amount"
        FROM "Rent" r
        JOIN "Lease" l ON l."id" = r."leaseId"
        JOIN "Flat" f ON f."id" = l."flatId"
        JOIN "Floor" fl ON fl."id" = f."floorId"
        LEFT JOIN (
          SELECT "rentId", SUM("amount") AS "paid"
          FROM "PaymentHistory"
          WHERE "rentId" IS NOT NULL
          GROUP BY "rentId"
        ) p ON p."rentId" = r."id"
        WHERE l."status" = 'ACTIVE'
          AND r."status" IN ('PENDING', 'OVERDUE', 'PARTIAL')
          AND fl."buildingId" IN (${buildingIdList})
        GROUP BY fl."buildingId"
      `,
      prisma.$queryRaw<BuildingAmountRow[]>`
        SELECT fl."buildingId" AS "buildingId",
               SUM(GREATEST(u."amount" - COALESCE(p."paid", 0), 0))::float8 AS "amount"
        FROM "UtilityBill" u
        JOIN "Lease" l ON l."id" = u."leaseId"
        JOIN "Flat" f ON f."id" = l."flatId"
        JOIN "Floor" fl ON fl."id" = f."floorId"
        LEFT JOIN (
          SELECT "utilityBillId", SUM("amount") AS "paid"
          FROM "PaymentHistory"
          WHERE "utilityBillId" IS NOT NULL
          GROUP BY "utilityBillId"
        ) p ON p."utilityBillId" = u."id"
        WHERE l."status" = 'ACTIVE'
          AND fl."buildingId" IN (${buildingIdList})
        GROUP BY fl."buildingId"
      `,
      prisma.$queryRaw<RevenueRow[]>`
        SELECT fl."buildingId" AS "buildingId",
               to_char(ph."paidAt", 'YYYY-MM') AS "monthKey",
               SUM(ph."amount")::float8 AS "amount"
        FROM "PaymentHistory" ph
        LEFT JOIN "Rent" r ON r."id" = ph."rentId"
        LEFT JOIN "UtilityBill" u ON u."id" = ph."utilityBillId"
        JOIN "Lease" l ON l."id" = COALESCE(r."leaseId", u."leaseId")
        JOIN "Flat" f ON f."id" = l."flatId"
        JOIN "Floor" fl ON fl."id" = f."floorId"
        WHERE fl."buildingId" IN (${buildingIdList})
        GROUP BY fl."buildingId", "monthKey"
      `,
      leaseIds.length
        ? prisma.rent.groupBy({
            by: ["year", "month"],
            where: {
              leaseId: { in: leaseIds },
              OR: monthKeys.map(({ month, year }) => ({ month, year })),
            },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
    ]);

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

  const outstandingRentByBuilding = new Map(
    outstandingRentRows.map((row) => [row.buildingId, row.amount])
  );
  const outstandingUtilityByBuilding = new Map(
    outstandingUtilityRows.map((row) => [row.buildingId, row.amount])
  );

  let revenueAllTime = 0;
  let revenueThisMonth = 0;
  const revenueByBuilding = new Map<string, number>();
  const monthlyRevenue = new Map<string, number>();

  for (const row of revenueRows) {
    revenueAllTime += row.amount;

    if (row.monthKey === thisMonthKey) {
      revenueThisMonth += row.amount;
    }

    revenueByBuilding.set(
      row.buildingId,
      (revenueByBuilding.get(row.buildingId) ?? 0) + row.amount
    );
    monthlyRevenue.set(
      row.monthKey,
      (monthlyRevenue.get(row.monthKey) ?? 0) + row.amount
    );
  }

  const rentDueByMonth = new Map(
    rentDueRows.map((row) => [
      `${row.year}-${String(row.month).padStart(2, "0")}`,
      Number(row._sum.amount ?? 0),
    ])
  );

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

  const sum = (values: Iterable<number>) =>
    [...values].reduce((total, value) => total + value, 0);

  return {
    buildings: buildingRows,
    occupancy,
    revenue: { allTime: revenueAllTime, thisMonth: revenueThisMonth },
    outstanding: {
      rent: sum(outstandingRentByBuilding.values()),
      utilityBills: sum(outstandingUtilityByBuilding.values()),
    },
    monthly,
  };
}
