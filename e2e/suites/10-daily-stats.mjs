// The nightly data job (/api/cron/daily-stats): who may run it, the 90 days
// of history the test seed rebuilt, filling in missing days, and running
// it twice. Expects freshly seeded test data.
import { PrismaClient } from "@prisma/client";

import { BASE, CRON_SECRET } from "../lib/config.mjs";

const prisma = new PrismaClient();
const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${String(detail).slice(0, 400)}`}`);
}

async function runJob(authorization) {
  const res = await fetch(`${BASE}/api/cron/daily-stats`, { headers: authorization ? { authorization } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// Bangladesh days (UTC+6, no daylight saving time), like the app.
const dhakaDay = (date) => new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
const addDays = (day, count) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
};

const today = dhakaDay(new Date());
const yesterday = addDays(today, -1);

const towerA = await prisma.building.findFirst({
  where: { name: "Test Tower A", owner: { email: "landlord@example.com" } },
  select: { id: true },
});
const statsOf = (buildingId) =>
  prisma.buildingDailyStat.findMany({ where: { buildingId }, orderBy: { day: "asc" } });
const fingerprint = (rows) => rows.map((row) => `${row.day} ${row.flats} ${row.occupied} ${row.owed} ${row.collected}`).join("\n");

// ---- What the seed rebuilt
let rows = await statsOf(towerA.id);
check(
  "seed rebuilt the last 90 days",
  rows.length === 90 && rows[0].day === addDays(today, -90) && rows.at(-1).day === yesterday,
  `${rows.length} rows, ${rows[0]?.day} … ${rows.at(-1)?.day}`
);
check("yesterday: 5 flats, 3 with a tenant", rows.at(-1).flats === 5 && rows.at(-1).occupied === 3, JSON.stringify(rows.at(-1)));
check(
  "money owed is never negative, flats never fewer than tenants",
  rows.every((row) => Number(row.owed) >= 0 && row.occupied <= row.flats),
  fingerprint(rows.filter((row) => Number(row.owed) < 0 || row.occupied > row.flats))
);

// ---- Who may run it
check("no secret → 401", (await runJob(null)).status === 401);
check("wrong secret → 401", (await runJob("Bearer not-the-secret")).status === 401);

// ---- Missing days are rebuilt exactly as they were
const before = fingerprint(rows);
const gap = [addDays(today, -32), addDays(today, -31), addDays(today, -30)];
await prisma.buildingDailyStat.deleteMany({ where: { buildingId: towerA.id, day: { in: gap } } });

let run = await runJob(`Bearer ${CRON_SECRET}`);
check("job → 200 with counts", run.status === 200 && run.body?.ok === true && run.body.days === 90 && run.body.written >= 3, JSON.stringify(run.body));

rows = await statsOf(towerA.id);
check("the 3 missing days are back, identical", fingerprint(rows) === before, `${rows.length} rows`);

// ---- Running it again only rewrites yesterday
const buildings = await prisma.building.findMany({ where: { deletedAt: null }, select: { createdAt: true } });
const withYesterday = buildings.filter((building) => dhakaDay(building.createdAt) <= yesterday).length;
const countBefore = await prisma.buildingDailyStat.count();

run = await runJob(`Bearer ${CRON_SECRET}`);
check(
  "second run → one row per building (yesterday), nothing added",
  run.status === 200 && run.body.written === withYesterday && (await prisma.buildingDailyStat.count()) === countBefore,
  `${JSON.stringify(run.body)}, expected ${withYesterday} written`
);

await prisma.$disconnect();

console.log(`\n${results.filter((result) => result.ok).length}/${results.length} passed`);

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
