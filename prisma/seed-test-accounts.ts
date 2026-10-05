// Test accounts for manual testing (see docs/TESTING.md).
//
// Safe to re-run: it only deletes and recreates its OWN accounts (the
// emails listed in ACCOUNTS below — deleting a user cascades to their
// buildings, leases, rent, etc.). Nothing else in the database is touched.
//
// Rent rows are deliberately left "stale" (past months still PENDING,
// current month missing) so the app's own rent reconciliation has to
// bring them up to date when you open a page — that is part of the test.
//
// Run: npm run db:seed-test

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { generateAccessCode } from "../src/lib/generate-access-code";

const prisma = new PrismaClient();

const PASSWORD = "Test@1234";

const ACCOUNTS = {
  landlord: { email: "landlord@example.com", name: "Test Landlord", role: UserRole.LANDLORD },
  otherLandlord: { email: "landlord2@example.com", name: "Other Landlord", role: UserRole.LANDLORD },
  paid: { email: "paid@example.com", name: "Paid Tenant", role: UserRole.TENANT },
  overdue: { email: "overdue@example.com", name: "Overdue Tenant", role: UserRole.TENANT },
  partial: { email: "partial@example.com", name: "Partial Tenant", role: UserRole.TENANT },
  pending: { email: "pending@example.com", name: "Pending Tenant", role: UserRole.TENANT },
  newTenant: { email: "newtenant@example.com", name: "New Tenant", role: UserRole.TENANT },
  ended: { email: "ended@example.com", name: "Ended Tenant", role: UserRole.TENANT },
} as const;

// First day of the month, `n` months ago (UTC) — the app's rent due date.
function monthStart(n: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
}

// The 3rd of the month `n` months ago — a lease start that is billed
// for its first month (the app's late-join cut-off is the 20th).
function leaseStart(n: number) {
  const d = monthStart(n);
  d.setUTCDate(3);
  return d;
}

function period(n: number) {
  const d = monthStart(n);
  return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear(), dueDate: d };
}

async function uniqueAccessCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateAccessCode();
    const taken = await prisma.building.findUnique({ where: { accessCode: code } });
    if (!taken) return code;
  }
  throw new Error("Could not generate a unique access code.");
}

async function createUser(account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS], passwordHash: string) {
  const user = await prisma.user.create({
    data: { name: account.name, email: account.email, passwordHash, role: account.role },
  });

  if (account.role === UserRole.TENANT) {
    const profile = await prisma.tenantProfile.create({
      data: { userId: user.id, occupation: "Tester", emergencyContact: "+8801700000000" },
    });
    return { user, profile };
  }

  return { user, profile: null };
}

type RentPlan = { monthsAgo: number; paid: number; status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" };

async function createLease(opts: {
  tenantId: string;
  buildingId: string;
  flatId: string;
  monthlyRent: number;
  startMonthsAgo: number;
  rents: RentPlan[];
  ended?: boolean;
}) {
  const startDate = leaseStart(opts.startMonthsAgo);

  await prisma.joinRequest.create({
    data: {
      tenantId: opts.tenantId,
      buildingId: opts.buildingId,
      flatId: opts.flatId,
      status: opts.ended ? "ENDED" : "APPROVED",
      message: "Test request",
      createdAt: startDate,
    },
  });

  const lease = await prisma.lease.create({
    data: {
      tenantId: opts.tenantId,
      flatId: opts.flatId,
      startDate,
      endDate: opts.ended ? monthStart(0) : null,
      monthlyRent: opts.monthlyRent,
      deposit: opts.monthlyRent * 2,
      status: opts.ended ? "ENDED" : "ACTIVE",
    },
  });

  for (const plan of opts.rents) {
    const { month, year, dueDate } = period(plan.monthsAgo);

    const rent = await prisma.rent.create({
      data: { leaseId: lease.id, month, year, amount: opts.monthlyRent, dueDate, status: plan.status },
    });

    if (plan.paid > 0) {
      await prisma.paymentHistory.create({
        data: {
          paymentType: "RENT",
          rentId: rent.id,
          amount: plan.paid,
          paidAt: new Date(dueDate.getTime() + 4 * 24 * 60 * 60 * 1000),
          transactionRef: "TEST",
        },
      });
    }
  }

  return lease;
}

async function main() {
  const host = (process.env.DATABASE_URL ?? "").split("@")[1]?.split("/")[0] ?? "unknown";
  console.log(`Seeding test accounts into database host: ${host}`);

  const emails = Object.values(ACCOUNTS).map((a) => a.email);
  const removed = await prisma.user.deleteMany({ where: { email: { in: emails } } });
  if (removed.count > 0) console.log(`Removed ${removed.count} previous test account(s).`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const landlord = await createUser(ACCOUNTS.landlord, passwordHash);
  const otherLandlord = await createUser(ACCOUNTS.otherLandlord, passwordHash);
  const paid = await createUser(ACCOUNTS.paid, passwordHash);
  const overdue = await createUser(ACCOUNTS.overdue, passwordHash);
  const partial = await createUser(ACCOUNTS.partial, passwordHash);
  const pending = await createUser(ACCOUNTS.pending, passwordHash);
  await createUser(ACCOUNTS.newTenant, passwordHash);
  const ended = await createUser(ACCOUNTS.ended, passwordHash);

  // ── Building A: occupied flats with different payment situations ──
  const towerA = await prisma.building.create({
    data: {
      name: "Test Tower A",
      address: "House 1, Road 1, Dhanmondi",
      city: "Dhaka",
      ownerId: landlord.user.id,
      accessCode: await uniqueAccessCode(),
    },
  });

  const floorA1 = await prisma.floor.create({ data: { buildingId: towerA.id, floorNumber: 1 } });
  const floorA2 = await prisma.floor.create({ data: { buildingId: towerA.id, floorNumber: 2 } });

  const flat = (floorId: string, flatNumber: string, rent: number, status: "VACANT" | "OCCUPIED" | "MAINTENANCE") =>
    prisma.flat.create({ data: { floorId, flatNumber, bedrooms: 2, bathrooms: 2, monthlyRent: rent, status } });

  const a101 = await flat(floorA1.id, "A101", 15000, "OCCUPIED");
  const a102 = await flat(floorA1.id, "A102", 18000, "OCCUPIED");
  const a201 = await flat(floorA2.id, "A201", 20000, "OCCUPIED");
  const a202 = await flat(floorA2.id, "A202", 16000, "VACANT");
  await flat(floorA2.id, "A203", 16000, "MAINTENANCE");

  // Paid: everything paid up to and including this month.
  await createLease({
    tenantId: paid.profile!.id, buildingId: towerA.id, flatId: a101.id,
    monthlyRent: 15000, startMonthsAgo: 4,
    rents: [4, 3, 2, 1, 0].map((m) => ({ monthsAgo: m, paid: 15000, status: "PAID" as const })),
  });

  // Overdue: 2 months ago half paid, last month unpaid but still marked
  // PENDING (the app must flip it to OVERDUE), this month's row missing
  // (the app must create it).
  await createLease({
    tenantId: overdue.profile!.id, buildingId: towerA.id, flatId: a102.id,
    monthlyRent: 18000, startMonthsAgo: 3,
    rents: [
      { monthsAgo: 3, paid: 18000, status: "PAID" },
      { monthsAgo: 2, paid: 9000, status: "PARTIAL" },
      { monthsAgo: 1, paid: 0, status: "PENDING" },
    ],
  });

  // Partial: this month half paid, plus an unpaid electricity bill.
  const partialLease = await createLease({
    tenantId: partial.profile!.id, buildingId: towerA.id, flatId: a201.id,
    monthlyRent: 20000, startMonthsAgo: 2,
    rents: [
      { monthsAgo: 2, paid: 20000, status: "PAID" },
      { monthsAgo: 1, paid: 20000, status: "PAID" },
      { monthsAgo: 0, paid: 10000, status: "PARTIAL" },
    ],
  });

  const lastMonth = period(1);
  await prisma.utilityBill.create({
    data: {
      leaseId: partialLease.id, type: "ELECTRICITY",
      month: lastMonth.month, year: lastMonth.year, amount: 1500, dueDate: lastMonth.dueDate,
    },
  });

  // Pending request waiting for the landlord on the vacant flat.
  await prisma.joinRequest.create({
    data: {
      tenantId: pending.profile!.id, buildingId: towerA.id, flatId: a202.id,
      status: "PENDING", message: "Hello, I would like to rent this flat from next month.",
    },
  });

  // Notices: one active, one expired (tenants should only see the active one).
  await prisma.notice.create({
    data: { buildingId: towerA.id, title: "Water supply off on Friday", content: "Water will be off 10am–2pm for tank cleaning." },
  });
  await prisma.notice.create({
    data: {
      buildingId: towerA.id, title: "Old notice (expired)", content: "You should not see this as a tenant.",
      expiresAt: monthStart(1),
    },
  });

  // ── Building B: vacant flats + a past tenant who left owing rent ──
  const towerB = await prisma.building.create({
    data: {
      name: "Test Tower B",
      address: "Plot 9, Block B, Bashundhara",
      city: "Dhaka",
      ownerId: landlord.user.id,
      accessCode: await uniqueAccessCode(),
    },
  });

  const floorB1 = await prisma.floor.create({ data: { buildingId: towerB.id, floorNumber: 1 } });
  const b101 = await flat(floorB1.id, "B101", 12000, "VACANT");
  await flat(floorB1.id, "B102", 12500, "VACANT");

  // Ended: lease ended this month, last month's rent never paid.
  await createLease({
    tenantId: ended.profile!.id, buildingId: towerB.id, flatId: b101.id,
    monthlyRent: 12000, startMonthsAgo: 3, ended: true,
    rents: [
      { monthsAgo: 3, paid: 12000, status: "PAID" },
      { monthsAgo: 2, paid: 12000, status: "PAID" },
      { monthsAgo: 1, paid: 0, status: "OVERDUE" },
    ],
  });

  // ── Other landlord: used to check landlords can't see each other's data ──
  const otherTower = await prisma.building.create({
    data: {
      name: "Other Landlord Tower",
      address: "Road 7, Gulshan",
      city: "Dhaka",
      ownerId: otherLandlord.user.id,
      accessCode: await uniqueAccessCode(),
    },
  });
  const otherFloor = await prisma.floor.create({ data: { buildingId: otherTower.id, floorNumber: 1 } });
  await flat(otherFloor.id, "X101", 30000, "VACANT");

  console.log("\nTest accounts ready. Password for all: " + PASSWORD);
  for (const account of Object.values(ACCOUNTS)) console.log(`  ${account.email}`);
  console.log(`\nAccess codes: Test Tower A = ${towerA.accessCode}, Test Tower B = ${towerB.accessCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
