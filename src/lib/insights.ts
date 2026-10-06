import { MONTH_NAMES } from "@/lib/rent";

// The calculations behind Reports → Insights and the assistant's insights
// tool. Plain rows in, plain numbers out — no database here — so every rule
// is covered by insights.test.ts.
//
// Months follow the app's rent months (UTC): rent is due on the 1st and
// only counts as late once its month has ended.

export const DAY_MS = 24 * 60 * 60 * 1000;

type Payment = { amount: unknown; paidAt: Date };

export type RentRecord = { amount: unknown; dueDate: Date; payments: Payment[] };

// Money is compared in paisa, so float rounding never decides "paid".
const paisa = (value: unknown) => Math.round(Number(value) * 100);

// A UTC month as one number, so months subtract:
// monthIndex(January 2027) − monthIndex(December 2026) = 1.
export function monthIndex(date: Date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function monthStart(index: number) {
  return new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));
}

export function monthName(index: number) {
  return `${MONTH_NAMES[index % 12]} ${Math.floor(index / 12)}`;
}

function median(values: number[]) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

// Paid towards `amount` so far, never more than the amount itself.
export function paidTowards(amount: unknown, payments: Payment[]) {
  const paid = payments.reduce((total, payment) => total + paisa(payment.amount), 0);
  return Math.min(paid, paisa(amount)) / 100;
}

// When the payments first covered `amount` in full; null if they never did.
export function paidOffAt(amount: unknown, payments: Payment[]): Date | null {
  const target = paisa(amount);
  let paid = 0;

  for (const payment of [...payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())) {
    paid += paisa(payment.amount);
    if (paid >= target) return payment.paidAt;
  }

  return null;
}

// ---------------------------------------------------------------- aging

export const AGING_LABELS = [
  "Due this month",
  "1 month overdue",
  "2 months overdue",
  "3+ months overdue",
] as const;

// 0: due this month (or not due yet), 1: due last month, 2: the month
// before, 3: three or more months ago.
export function agingBucket(dueDate: Date, now: Date) {
  return Math.max(0, Math.min(3, monthIndex(now) - monthIndex(dueDate)));
}

export type OwedItem = { key: string; remaining: number; dueDate: Date };

export type AgingEntry = { buckets: number[]; total: number; oldestDue: Date };

// What's owed, split by how long it has been overdue — in total and per
// key (a lease).
export function ageOwed(items: OwedItem[], now: Date) {
  const totals = [0, 0, 0, 0];
  const byKey = new Map<string, AgingEntry>();

  for (const item of items) {
    if (item.remaining <= 0) continue;

    const bucket = agingBucket(item.dueDate, now);
    totals[bucket] += item.remaining;

    let entry = byKey.get(item.key);

    if (!entry) {
      entry = { buckets: [0, 0, 0, 0], total: 0, oldestDue: item.dueDate };
      byKey.set(item.key, entry);
    }

    entry.buckets[bucket] += item.remaining;
    entry.total += item.remaining;
    if (item.dueDate < entry.oldestDue) entry.oldestDue = item.dueDate;
  }

  return { totals, total: totals.reduce((sum, value) => sum + value, 0), byKey };
}

// ---------------------------------------------------------- punctuality

export type PunctualityRating = "reliable" | "sometimes-late" | "often-late" | "new";

export type Punctuality = {
  // Completed rent months looked at (the current month isn't over yet).
  months: number;
  // Of those, paid in full before their month ended.
  onTime: number;
  // Median day of the month the rent was paid in full: 1 is the 1st;
  // past the month's length means it was paid the next month.
  typicalPayDay: number | null;
  rating: PunctualityRating;
};

export const MIN_MONTHS_FOR_RATING = 3;

export function punctuality(rents: RentRecord[], now: Date, lookbackMonths = 12): Punctuality {
  const current = monthIndex(now);
  const evaluated = rents.filter((rent) => {
    const month = monthIndex(rent.dueDate);
    return month < current && month >= current - lookbackMonths;
  });

  let onTime = 0;
  const payDays: number[] = [];

  for (const rent of evaluated) {
    const paidAt = paidOffAt(rent.amount, rent.payments);
    if (!paidAt) continue;

    if (monthIndex(paidAt) <= monthIndex(rent.dueDate)) onTime += 1;
    payDays.push(Math.max(0, Math.floor((paidAt.getTime() - rent.dueDate.getTime()) / DAY_MS)) + 1);
  }

  const share = evaluated.length > 0 ? onTime / evaluated.length : 0;

  const rating: PunctualityRating =
    evaluated.length < MIN_MONTHS_FOR_RATING
      ? "new"
      : share >= 0.9
        ? "reliable"
        : share >= 0.6
          ? "sometimes-late"
          : "often-late";

  return { months: evaluated.length, onTime, typicalPayDay: median(payDays), rating };
}

// ----------------------------------------------------------- collection

export type CollectionMonth = {
  label: string;
  due: number;
  collected: number;
  // Share of the month's rent paid so far; null when nothing was due.
  rate: number | null;
  isCurrent: boolean;
};

// For each of the last `months` rent months (this one included): how much
// rent was due and how much of it has been paid, whenever it was paid.
export function collectionByMonth(rents: RentRecord[], now: Date, months = 12): CollectionMonth[] {
  const current = monthIndex(now);
  const rows = Array.from({ length: months }, (_, i) => {
    const index = current - (months - 1 - i);
    return { index, due: 0, collected: 0 };
  });
  const byIndex = new Map(rows.map((row) => [row.index, row]));

  for (const rent of rents) {
    const row = byIndex.get(monthIndex(rent.dueDate));
    if (!row) continue;

    row.due += Number(rent.amount);
    row.collected += paidTowards(rent.amount, rent.payments);
  }

  return rows.map((row) => ({
    label: monthName(row.index),
    due: row.due,
    collected: row.collected,
    rate: row.due > 0 ? row.collected / row.due : null,
    isCurrent: row.index === current,
  }));
}

// -------------------------------------------------------------- vacancy

export type LeasePeriod = { startDate: Date; endDate: Date | null };

// Days between `from` and `to` when the flat existed but had no lease.
export function vacantDays(
  flat: { createdAt: Date; leases: LeasePeriod[] },
  from: Date,
  to: Date
) {
  const start = Math.max(from.getTime(), flat.createdAt.getTime());
  const end = to.getTime();
  if (end <= start) return 0;

  const periods = flat.leases
    .map((lease) => [
      Math.max(lease.startDate.getTime(), start),
      Math.min((lease.endDate ?? to).getTime(), end),
    ])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);

  let occupied = 0;
  let cursor = start;

  for (const [a, b] of periods) {
    const segmentStart = Math.max(a, cursor);

    if (b > segmentStart) {
      occupied += b - segmentStart;
      cursor = b;
    }
  }

  return (end - start - occupied) / DAY_MS;
}

// When a flat without a lease became empty: the end of its last lease, or
// when it was added.
export function emptySince(flat: { createdAt: Date; leases: LeasePeriod[] }) {
  const ends = flat.leases
    .map((lease) => lease.endDate?.getTime())
    .filter((time): time is number => time !== undefined);

  return new Date(Math.max(flat.createdAt.getTime(), ...ends));
}

// Days each flat stood empty between one tenant leaving and the next one
// moving in, for moves-in since `from`.
export function reletGaps(flats: { leases: LeasePeriod[] }[], from: Date) {
  const gaps: number[] = [];

  for (const flat of flats) {
    const leases = [...flat.leases].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 1; i < leases.length; i++) {
      const previous = leases[i - 1];
      const next = leases[i];

      if (!previous.endDate || next.startDate < from) continue;

      gaps.push(Math.max(0, (next.startDate.getTime() - previous.endDate.getTime()) / DAY_MS));
    }
  }

  return gaps;
}

// Rent a flat would have brought in over `days` days.
export function rentForDays(monthlyRent: number, days: number) {
  return (monthlyRent * days) / 30;
}

// ------------------------------------------------------ daily snapshots

// Days for the daily snapshots are Bangladesh calendar days. Bangladesh
// has no daylight saving time, so a day always starts at 00:00 UTC+6.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

// yyyy-mm-dd of the Bangladesh day `date` falls on.
export function dhakaDay(date: Date) {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

// The moment a Bangladesh day starts.
export function dhakaDayStart(day: string) {
  return new Date(Date.parse(`${day}T00:00:00Z`) - DHAKA_OFFSET_MS);
}

export function addDays(day: string, count: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

// The `count` days before `day`, oldest first.
export function daysBefore(day: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(day, i - count));
}

export type BuildingHistory = {
  flats: { id: string; createdAt: Date; deletedAt: Date | null }[];
  leases: { flatId: string; startDate: Date; endDate: Date | null }[];
  // Rent and bills; a written-off one stops counting from `writtenOffAt`.
  charges: { amount: unknown; dueDate: Date; writtenOffAt: Date | null; payments: Payment[] }[];
};

export type DaySnapshot = { flats: number; occupied: number; owed: number; collected: number };

// How a building stood at `end`: the flats it had, how many had a lease,
// what was owed (rent and bills due by then, minus what was paid by then),
// and what was paid between `start` and `end`.
export function buildingOnDay(history: BuildingHistory, start: Date, end: Date): DaySnapshot {
  const from = start.getTime();
  const to = end.getTime();

  const flatIds = new Set(
    history.flats
      .filter((flat) => flat.createdAt.getTime() < to && (!flat.deletedAt || flat.deletedAt.getTime() >= to))
      .map((flat) => flat.id)
  );

  const occupied = new Set(
    history.leases
      .filter(
        (lease) =>
          flatIds.has(lease.flatId) &&
          lease.startDate.getTime() < to &&
          (!lease.endDate || lease.endDate.getTime() >= to)
      )
      .map((lease) => lease.flatId)
  ).size;

  let owed = 0;
  let collected = 0;

  for (const charge of history.charges) {
    let paid = 0;

    for (const payment of charge.payments) {
      const at = payment.paidAt.getTime();
      if (at >= to) continue;

      paid += paisa(payment.amount);
      if (at >= from) collected += paisa(payment.amount);
    }

    const due = charge.dueDate.getTime() < to;
    const writtenOff = charge.writtenOffAt !== null && charge.writtenOffAt.getTime() < to;

    if (due && !writtenOff) owed += Math.max(0, paisa(charge.amount) - paid);
  }

  return { flats: flatIds.size, occupied, owed: owed / 100, collected: collected / 100 };
}

// Share of the rent due over these months that has been paid; null if
// nothing was due. Months with more rent weigh more.
export function collectionRate(months: CollectionMonth[]) {
  const due = months.reduce((sum, month) => sum + month.due, 0);
  const collected = months.reduce((sum, month) => sum + month.collected, 0);

  return due > 0 ? collected / due : null;
}

// ------------------------------------------------------------- forecast

// Rent expected over the next `months` months: what the current leases
// would pay in full, scaled by the share of rent actually collected
// recently (all of it when there's no history yet).
export function forecastRent(activeMonthlyRent: number, recentRate: number | null, months = 3) {
  const rate = recentRate === null ? 1 : Math.min(1, recentRate);
  const perMonth = activeMonthlyRent * rate;

  return { months, rate, perMonth, total: perMonth * months };
}
