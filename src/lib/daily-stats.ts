import type { PrismaClient } from "@prisma/client";

import {
  addDays,
  buildingOnDay,
  daysBefore,
  dhakaDay,
  dhakaDayStart,
  type BuildingHistory,
} from "@/lib/insights";
import { prisma as appPrisma } from "@/lib/prisma";

// The nightly data pipeline behind the trend charts in Reports → Insights:
// for every building, how it stood at the end of each day (flats,
// occupied flats, money owed, money received) in BuildingDailyStat.
//
// Each day is computed from the lease and payment history, so the job
// can also fill in days it missed — a failed nightly run, a new
// database, the rebuilt demo. Yesterday is always recomputed, in case
// payments were recorded late.

export const STATS_HISTORY_DAYS = 90;
const BUILDINGS_PER_BATCH = 25;

type Options = {
  db?: PrismaClient;
  // Only this landlord's buildings (the demo and test seeds).
  ownerId?: string;
  days?: number;
  now?: Date;
};

export async function recordDailyStats({
  db = appPrisma,
  ownerId,
  days = STATS_HISTORY_DAYS,
  now = new Date(),
}: Options = {}) {
  const today = dhakaDay(now);
  const window = daysBefore(today, days);
  const yesterday = window[window.length - 1];

  const buildings = await db.building.findMany({
    where: { deletedAt: null, ...(ownerId ? { ownerId } : {}) },
    select: { id: true, createdAt: true },
    orderBy: { id: "asc" },
  });

  let written = 0;

  for (let i = 0; i < buildings.length; i += BUILDINGS_PER_BATCH) {
    const batch = buildings.slice(i, i + BUILDINGS_PER_BATCH);
    const ids = batch.map((building) => building.id);

    const [existing, histories] = await Promise.all([
      db.buildingDailyStat.findMany({
        where: { buildingId: { in: ids }, day: { gte: window[0] } },
        select: { buildingId: true, day: true },
      }),
      loadHistories(db, ids),
    ]);

    const recorded = new Set(existing.map((row) => `${row.buildingId} ${row.day}`));
    const rows = [];

    for (const building of batch) {
      const firstDay = dhakaDay(building.createdAt);
      const history = histories.get(building.id)!;

      for (const day of window) {
        if (day < firstDay) continue;
        if (day !== yesterday && recorded.has(`${building.id} ${day}`)) continue;

        rows.push({
          buildingId: building.id,
          day,
          ...buildingOnDay(history, dhakaDayStart(day), dhakaDayStart(addDays(day, 1))),
        });
      }
    }

    // Replace yesterday's rows; add the missing days.
    await db.$transaction([
      db.buildingDailyStat.deleteMany({ where: { buildingId: { in: ids }, day: yesterday } }),
      db.buildingDailyStat.createMany({ data: rows, skipDuplicates: true }),
    ]);

    written += rows.length;
  }

  return { buildings: buildings.length, days: window.length, written };
}

async function loadHistories(db: PrismaClient, buildingIds: string[]) {
  const payments = { select: { amount: true, paidAt: true } } as const;

  const [flats, leases] = await Promise.all([
    db.flat.findMany({
      where: { floor: { buildingId: { in: buildingIds } } },
      select: { id: true, createdAt: true, deletedAt: true, floor: { select: { buildingId: true } } },
    }),
    db.lease.findMany({
      where: { flat: { floor: { buildingId: { in: buildingIds } } } },
      select: {
        flatId: true,
        startDate: true,
        endDate: true,
        flat: { select: { floor: { select: { buildingId: true } } } },
        rents: { select: { amount: true, dueDate: true, status: true, payments } },
        utilityBills: { select: { amount: true, dueDate: true, writtenOffAt: true, payments } },
      },
    }),
  ]);

  const histories = new Map<string, BuildingHistory>(
    buildingIds.map((id) => [id, { flats: [], leases: [], charges: [] }])
  );

  for (const flat of flats) {
    histories.get(flat.floor.buildingId)?.flats.push(flat);
  }

  for (const lease of leases) {
    const history = histories.get(lease.flat.floor.buildingId);
    if (!history) continue;

    history.leases.push(lease);

    for (const rent of lease.rents) {
      history.charges.push({
        amount: rent.amount,
        dueDate: rent.dueDate,
        // Rent has no write-off date. It's only written off once the lease
        // has ended, so the end date stands in for it.
        writtenOffAt: rent.status === "WRITTEN_OFF" ? (lease.endDate ?? rent.dueDate) : null,
        payments: rent.payments,
      });
    }

    history.charges.push(...lease.utilityBills);
  }

  return histories;
}
