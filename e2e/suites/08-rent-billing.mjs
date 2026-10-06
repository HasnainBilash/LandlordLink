// Rent billing: the nightly job (/api/cron/bill-rent) and the safety net on
// page views. Expects freshly seeded test data: flat A102 has no row for
// this month yet and last month's unpaid rent is still PENDING.
import { PrismaClient } from "@prisma/client";

import { BASE, CRON_SECRET } from "../lib/config.mjs";
import { get, login } from "../lib/harness.mjs";

const prisma = new PrismaClient();
const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${String(detail).slice(0, 300)}`}`);
}

async function runJob(authorization) {
  const res = await fetch(`${BASE}/api/cron/bill-rent`, {
    headers: authorization ? { authorization } : {},
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const now = new Date();
const thisMonth = { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
const lastMonth = { month: lastMonthDate.getUTCMonth() + 1, year: lastMonthDate.getUTCFullYear() };

const lease = await prisma.lease.findFirst({
  where: { status: "ACTIVE", flat: { flatNumber: "A102" }, tenant: { user: { email: "overdue@example.com" } } },
  select: { id: true, flatId: true, monthlyRent: true },
});

if (!lease) throw new Error("Test lease for A102 not found — seed the test accounts first.");

const rentFor = ({ month, year }) =>
  prisma.rent.findUnique({ where: { leaseId_month_year: { leaseId: lease.id, month, year } } });

// --- Who may run it ---
check("no secret → 401", (await runJob(null)).status === 401);
check("wrong secret → 401", (await runJob("Bearer not-the-secret")).status === 401);

// --- First run bills what's missing ---
check("before: A102 has no rent row for this month", (await rentFor(thisMonth)) === null);
check("before: A102's unpaid last month is still PENDING", (await rentFor(lastMonth))?.status === "PENDING");

let run = await runJob(`Bearer ${CRON_SECRET}`);
check(
  "with the secret → 200 and counts",
  run.status === 200 && run.body?.ok === true && run.body.leases > 0 && run.body.created >= 1 && run.body.markedOverdue >= 1,
  JSON.stringify(run.body)
);

const created = await rentFor(thisMonth);
check(
  "this month's rent created: PENDING, the lease's rent, due on the 1st",
  created?.status === "PENDING" &&
    Number(created.amount) === Number(lease.monthlyRent) &&
    created.dueDate.toISOString() === new Date(Date.UTC(thisMonth.year, thisMonth.month - 1, 1)).toISOString(),
  JSON.stringify(created)
);
check("last month's unpaid rent marked OVERDUE", (await rentFor(lastMonth))?.status === "OVERDUE");

// --- Running it again changes nothing ---
run = await runJob(`Bearer ${CRON_SECRET}`);
check(
  "second run → nothing created, nothing changed",
  run.status === 200 && run.body?.created === 0 && run.body?.markedOverdue === 0,
  JSON.stringify(run.body)
);

const rows = await prisma.rent.count({ where: { leaseId: lease.id, month: thisMonth.month, year: thisMonth.year } });
check("still exactly one row for this month", rows === 1, rows);

// --- Safety net: a page that shows rent bills it if the job hasn't ---
await prisma.rent.delete({ where: { id: created.id } });

const jar = await login("landlord@example.com");
const page = await get(jar, `/dashboard/flats/${lease.flatId}`);
check("landlord opens flat A102", page.status === 200, page.status);
check("…and this month's rent is back", (await rentFor(thisMonth))?.status === "PENDING");

await prisma.$disconnect();

console.log(`\n${results.filter((result) => result.ok).length}/${results.length} passed`);

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
