import { formatFlatNumber } from "@/lib/format";
import {
  AGING_LABELS,
  DAY_MS,
  ageOwed,
  collectionByMonth,
  collectionRate,
  daysBefore,
  dhakaDay,
  emptySince,
  forecastRent,
  monthIndex,
  monthStart,
  paidTowards,
  punctuality,
  reletGaps,
  rentForDays,
  vacantDays,
  type OwedItem,
} from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";

// Loads one landlord's leases, rent, bills and flats and runs the insight
// calculations (src/lib/insights.ts) on them. Used by Reports → Insights
// and by the assistant; callers pass the signed-in landlord's own ID.

const LOOKBACK_MONTHS = 12;
const FORECAST_BASIS_MONTHS = 6;
const TREND_DAYS = 90;

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const UNPAID_RENT = ["PENDING", "OVERDUE", "PARTIAL"] as const;

export type Insights = Awaited<ReturnType<typeof loadInsights>>;

export async function loadInsights(ownerId: string, now = new Date()) {
  await reconcileRentForOwner(ownerId);

  const windowStart = monthStart(monthIndex(now) - LOOKBACK_MONTHS);
  const yearAgo = new Date(now.getTime() - 365 * DAY_MS);

  const [leases, flats, dailyStats] = await Promise.all([
    prisma.lease.findMany({
      where: { flat: { floor: { building: { ownerId } } } },
      select: {
        id: true,
        status: true,
        monthlyRent: true,
        flatId: true,
        tenant: { select: { user: { select: { name: true } } } },
        flat: {
          select: {
            flatNumber: true,
            floor: { select: { building: { select: { name: true } } } },
          },
        },
        rents: {
          where: {
            OR: [{ dueDate: { gte: windowStart } }, { status: { in: [...UNPAID_RENT] } }],
          },
          select: {
            amount: true,
            dueDate: true,
            status: true,
            payments: { select: { amount: true, paidAt: true } },
          },
        },
        utilityBills: {
          where: { writtenOffAt: null },
          select: {
            amount: true,
            dueDate: true,
            payments: { select: { amount: true, paidAt: true } },
          },
        },
      },
    }),
    prisma.flat.findMany({
      where: {
        deletedAt: null,
        floor: { deletedAt: null, building: { ownerId, deletedAt: null } },
      },
      select: {
        id: true,
        flatNumber: true,
        monthlyRent: true,
        status: true,
        createdAt: true,
        floor: { select: { building: { select: { name: true } } } },
        leases: { select: { startDate: true, endDate: true, status: true } },
      },
    }),
    // Written by the nightly data job (src/lib/daily-stats.ts).
    prisma.buildingDailyStat.groupBy({
      by: ["day"],
      where: {
        day: { gte: daysBefore(dhakaDay(now), TREND_DAYS)[0] },
        building: { ownerId, deletedAt: null },
      },
      _sum: { flats: true, occupied: true, owed: true },
      orderBy: { day: "asc" },
    }),
  ]);

  // ---- What's owed, and how long it has been owed
  const owedByCurrentTenants: OwedItem[] = [];
  let formerTenantsOwe = 0;

  for (const lease of leases) {
    const unpaid = [
      ...lease.rents.filter((rent) => (UNPAID_RENT as readonly string[]).includes(rent.status)),
      ...lease.utilityBills,
    ];

    for (const item of unpaid) {
      const remaining = Number(item.amount) - paidTowards(item.amount, item.payments);
      if (remaining <= 0) continue;

      if (lease.status === "ACTIVE") {
        owedByCurrentTenants.push({ key: lease.id, remaining, dueDate: item.dueDate });
      } else {
        formerTenantsOwe += remaining;
      }
    }
  }

  const aging = ageOwed(owedByCurrentTenants, now);
  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE");

  const describe = (lease: (typeof leases)[number]) => ({
    leaseId: lease.id,
    flatId: lease.flatId,
    tenant: lease.tenant.user.name,
    flat: `Flat ${formatFlatNumber(lease.flat.flatNumber)}`,
    building: lease.flat.floor.building.name,
  });

  const debtors = activeLeases
    .flatMap((lease) => {
      const entry = aging.byKey.get(lease.id);
      return entry ? [{ ...describe(lease), ...entry }] : [];
    })
    .sort((a, b) => a.oldestDue.getTime() - b.oldestDue.getTime() || b.total - a.total);

  // ---- Payment habits of current tenants
  const habits = activeLeases
    .map((lease) => ({
      ...describe(lease),
      ...punctuality(lease.rents, now, LOOKBACK_MONTHS),
      owes: aging.byKey.get(lease.id)?.total ?? 0,
    }))
    .sort(
      (a, b) =>
        (a.months ? a.onTime / a.months : 2) - (b.months ? b.onTime / b.months : 2) ||
        b.owes - a.owes ||
        a.tenant.localeCompare(b.tenant)
    );

  // ---- Collection per rent month (every lease, current or ended)
  const collection = collectionByMonth(
    leases.flatMap((lease) => lease.rents),
    now,
    LOOKBACK_MONTHS
  );

  // ---- Empty flats
  const emptyFlats = flats
    .filter((flat) => !flat.leases.some((lease) => lease.status === "ACTIVE"))
    .map((flat) => {
      const since = emptySince(flat);
      const days = Math.max(0, Math.floor((now.getTime() - since.getTime()) / DAY_MS));

      return {
        flatId: flat.id,
        flat: `Flat ${formatFlatNumber(flat.flatNumber)}`,
        building: flat.floor.building.name,
        status: flat.status,
        monthlyRent: Number(flat.monthlyRent),
        since,
        days,
        missedSoFar: rentForDays(Number(flat.monthlyRent), days),
      };
    })
    .sort((a, b) => b.days - a.days);

  const missedLastYear = flats.reduce(
    (sum, flat) => sum + rentForDays(Number(flat.monthlyRent), vacantDays(flat, yearAgo, now)),
    0
  );
  const gaps = reletGaps(flats, yearAgo);

  // ---- The next three months, from the last six completed months
  const basis = collection.filter((month) => !month.isCurrent && month.due > 0).slice(-FORECAST_BASIS_MONTHS);
  const recentRate = collectionRate(basis);

  const fullRent = activeLeases.reduce((sum, lease) => sum + Number(lease.monthlyRent), 0);

  const forecast = {
    ...forecastRent(fullRent, recentRate),
    // What the current leases bring in a month when paid in full.
    fullRent,
    recentRate,
    basisMonths: basis.length,
    // Extra rent a month if every vacant flat were let at its listed rent.
    ifAllLet: emptyFlats
      .filter((flat) => flat.status === "VACANT")
      .reduce((sum, flat) => sum + flat.monthlyRent, 0),
  };

  // ---- Day by day, from the daily snapshots
  const trends = dailyStats.map((row) => {
    const flatCount = row._sum.flats ?? 0;

    return {
      label: dayLabel.format(new Date(`${row.day}T00:00:00Z`)),
      owed: Number(row._sum.owed ?? 0),
      occupancy: flatCount > 0 ? (row._sum.occupied ?? 0) / flatCount : 0,
    };
  });

  return {
    trends,
    aging: {
      buckets: AGING_LABELS.map((label, i) => ({ label, amount: aging.totals[i] })),
      total: aging.total,
      overdue: aging.totals[1] + aging.totals[2] + aging.totals[3],
      debtors,
      formerTenantsOwe,
    },
    habits,
    collection,
    vacancy: {
      emptyFlats,
      missedLastYear,
      averageReletDays: gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null,
      relets: gaps.length,
    },
    forecast,
  };
}
