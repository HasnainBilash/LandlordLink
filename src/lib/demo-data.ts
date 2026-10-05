// The public demo's data: a landlord with three buildings, ~30 tenants,
// months of rent history, join requests and notices — all relative to
// today. resetDemoData() wipes the demo and rebuilds it. It runs every
// night (app/api/cron/reset-demo) and from `npm run db:seed-demo`.
//
// Only demo data is touched:
// - the two public demo accounts keep their rows (same IDs), so anyone
//   signed in to the demo stays signed in across a reset;
// - the demo landlord's buildings (and everything in them) are rebuilt;
// - the other demo tenants live on DEMO_EMAIL_DOMAIN and are recreated.
//
// Imports are relative (not "@/…") so the seed script can run this file
// with tsx as well.

import bcrypt from "bcryptjs";
import type { FlatStatus, Prisma, PrismaClient } from "@prisma/client";

import { DEMO_LANDLORD, DEMO_PASSWORD, DEMO_TENANT } from "./demo";
import { formatMoney } from "./format";
import { generateAccessCode } from "./generate-access-code";

type Tx = Prisma.TransactionClient;

// example.com is reserved, so these can never be someone's real address.
const DEMO_EMAIL_DOMAIN = "demo.example.com";

const PUBLIC_DEMO_EMAILS = [DEMO_LANDLORD.email, DEMO_TENANT.email];

// Each building has its own shape, rents and tenant mix so the demo looks
// like a real portfolio rather than three copies of one building.
// One row per floor: O = occupied, V = vacant, M = maintenance.
const O: FlatStatus = "OCCUPIED";
const V: FlatStatus = "VACANT";
const M: FlatStatus = "MAINTENANCE";

// What happened with the tenant who used to live in each building's first
// vacant flat — so Reports → Past dues has something to show.
type FormerTenantStory = "owes-last-month" | "owes-two-months" | "paid-up";

const BUILDINGS: {
  name: string;
  address: string;
  city: string;
  baseRent: number;
  behaviorOffset: number;
  formerTenant: FormerTenantStory;
  floors: FlatStatus[][];
}[] = [
  {
    name: "Green Valley Apartments",
    address: "House 12, Road 5, Banani",
    city: "Dhaka",
    baseRent: 24000,
    behaviorOffset: 0,
    formerTenant: "owes-last-month",
    floors: [
      [O, O, O, O],
      [O, O, O, V],
      [O, O, O, O],
      [O, V, O, M],
    ],
  },
  {
    name: "Sunset Residency",
    address: "Plot 34, Block C, Bashundhara R/A",
    city: "Dhaka",
    baseRent: 18000,
    behaviorOffset: 3,
    formerTenant: "paid-up",
    floors: [
      [O, O, V],
      [O, V, V],
      [O, O, O],
    ],
  },
  {
    name: "Riverside Heights",
    address: "45 Agrabad Access Road",
    city: "Chattogram",
    baseRent: 13000,
    behaviorOffset: 5,
    formerTenant: "owes-two-months",
    floors: [
      [O, O],
      [O, V],
      [O, O],
      [V, O],
      [O, M],
    ],
  },
];

const TENANT_NAMES = [
  "Karim Ahmed", "Fatima Begum", "Rezaul Islam", "Nusrat Jahan",
  "Shakil Hossain", "Ayesha Siddika", "Tanvir Alam", "Samira Khan",
  "Mahmudul Hasan", "Ruma Akter", "Jahangir Alam", "Farhana Yesmin",
  "Imran Chowdhury", "Sabrina Sultana", "Abdullah Al Mamun", "Tania Parvin",
  "Rafiqul Islam", "Nasrin Sultana", "Kamrul Hasan", "Shirin Akhter",
  "Mizanur Rahman", "Lubna Ferdous", "Anisur Rahman", "Rokeya Begum",
  "Sohel Rana", "Munira Haque", "Delwar Hossain", "Taslima Nasrin",
  "Ashraful Islam", "Parvin Akter", "Golam Mostofa", "Shahana Pervin",
  "Habibur Rahman", "Salma Khatun", "Zahidul Islam", "Marjuka Ahmed",
  "Nazmul Huda", "Sharmin Akter", "Rakibul Hasan", "Jannatul Ferdous",
  "Tariqul Islam", "Moushumi Rahman",
];

// The public demo tenant has their own fixed name; keep it unique.
const OTHER_TENANT_NAMES = TENANT_NAMES.filter((name) => name !== DEMO_TENANT.name);

const OCCUPATIONS = [
  "Software Engineer", "Teacher", "Bank Officer", "Doctor",
  "Graphic Designer", "Business Owner", "Nurse", "Accountant",
];

type OccupiedBehavior = {
  startMonthsAgo: number;
  deposit: boolean;
  rentDelta: number;
  // How the rent history for this tenant should look.
  outcome:
    | "clean"
    | "clean-recent-pending"
    | "overdue-1"
    | "overdue-2"
    | "partial-current"
    | "utility-overdue";
};

const OCCUPIED_PATTERN: OccupiedBehavior[] = [
  { startMonthsAgo: 6, deposit: true, rentDelta: 0, outcome: "clean" },
  { startMonthsAgo: 3, deposit: false, rentDelta: 500, outcome: "clean" },
  { startMonthsAgo: 1, deposit: false, rentDelta: 0, outcome: "clean-recent-pending" },
  { startMonthsAgo: 4, deposit: true, rentDelta: -1000, outcome: "overdue-1" },
  { startMonthsAgo: 5, deposit: false, rentDelta: 0, outcome: "utility-overdue" },
  { startMonthsAgo: 7, deposit: true, rentDelta: 1500, outcome: "overdue-2" },
  { startMonthsAgo: 2, deposit: false, rentDelta: 0, outcome: "partial-current" },
  { startMonthsAgo: 8, deposit: true, rentDelta: -500, outcome: "clean" },
];

type ActivityRow = {
  userId: string;
  buildingId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  createdAt: Date;
};

export type DemoSummary = {
  buildings: number;
  occupiedFlats: number;
  vacantFlats: number;
  overdueRentPeriods: number;
  activityEntries: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY_MS);
}

// The given day of the month, n months ago (UTC).
function monthsAgo(n: number, day = 5) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const HOUR_MS = 60 * 60 * 1000;

// When a seeded bill was paid: a few days after it was due, during the
// working day (9am–5pm in Dhaka). For this month's bills, when that day
// hasn't come yet, some time between the due date and now instead — never
// in the future. `seed` just varies the time from flat to flat.
function paidDate(due: Date, daysLate: number, seed: number) {
  const natural = new Date(due.getTime() + daysLate * DAY_MS + (3 + (seed % 9)) * HOUR_MS);
  const now = Date.now();

  if (natural.getTime() <= now) return natural;

  const fraction = 0.15 + ((seed * 37) % 70) / 100;
  return new Date(due.getTime() + (now - due.getTime()) * fraction);
}

function monthsBetween(start: Date, end: Date) {
  const months: { month: number; year: number }[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ month, year });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function dueDate(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

export async function resetDemoData(prisma: PrismaClient): Promise<DemoSummary> {
  // Hash before the transaction so it doesn't hold the connection open.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // One transaction: visitors see the old demo until the new one is
  // complete, and a failure leaves the old demo in place.
  return prisma.$transaction((tx) => rebuild(tx, passwordHash), {
    maxWait: 10_000,
    timeout: 120_000,
  });
}

async function rebuild(tx: Tx, passwordHash: string): Promise<DemoSummary> {
  await removeDemoData(tx);

  const landlord = await tx.user.upsert({
    where: { email: DEMO_LANDLORD.email },
    update: { name: DEMO_LANDLORD.name, passwordHash, role: "LANDLORD", deletedAt: null },
    create: {
      name: DEMO_LANDLORD.name,
      email: DEMO_LANDLORD.email,
      passwordHash,
      role: "LANDLORD",
    },
  });

  const activityRows: ActivityRow[] = [];

  let nameIndex = 0;
  function nextName() {
    const name = OTHER_TENANT_NAMES[nameIndex % OTHER_TENANT_NAMES.length];
    nameIndex += 1;
    const round = Math.ceil(nameIndex / OTHER_TENANT_NAMES.length);
    return round > 1 ? `${name} ${round}` : name;
  }

  let emailCounter = 1;

  // Creates a tenant account with a profile. The public demo tenant's
  // account is reused (same ID) so their session survives the reset.
  async function createTenant(fullName: string, isPublicDemoTenant = false) {
    const counter = emailCounter++;
    const profile = {
      occupation: OCCUPATIONS[counter % OCCUPATIONS.length],
      emergencyContact: `+8801${String(700000000 + counter * 37).slice(0, 9)}`,
    };

    if (isPublicDemoTenant) {
      const user = await tx.user.upsert({
        where: { email: DEMO_TENANT.email },
        update: { name: DEMO_TENANT.name, passwordHash, role: "TENANT", deletedAt: null },
        create: { name: DEMO_TENANT.name, email: DEMO_TENANT.email, passwordHash, role: "TENANT" },
      });

      return tx.tenantProfile.create({ data: { userId: user.id, ...profile } });
    }

    const slug = fullName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/, "");

    const user = await tx.user.create({
      data: {
        name: fullName,
        email: `${slug}${counter}@${DEMO_EMAIL_DOMAIN}`,
        passwordHash,
        role: "TENANT",
        tenantProfile: { create: profile },
      },
      select: { tenantProfile: true },
    });

    return user.tenantProfile!;
  }

  // A tenant who lived in a now-vacant flat and moved out at the end of
  // last month, possibly still owing rent and their last electricity bill.
  async function addFormerTenant(
    story: FormerTenantStory,
    flat: { id: string; flatNumber: string; rent: number },
    buildingId: string
  ) {
    const tenantProfile = await createTenant(nextName());
    const startDate = monthsAgo(7, 3);
    const endDate = monthsAgo(1, 28);

    const joinRequest = await tx.joinRequest.create({
      data: {
        tenantId: tenantProfile.id,
        buildingId,
        flatId: flat.id,
        status: "ENDED",
        message: "Hi, I'd like to rent this flat from next month.",
        createdAt: startDate,
        updatedAt: endDate,
      },
    });

    const lease = await tx.lease.create({
      data: {
        tenantId: tenantProfile.id,
        flatId: flat.id,
        startDate,
        endDate,
        monthlyRent: flat.rent,
        deposit: flat.rent,
        status: "ENDED",
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId,
      action: "APPROVE",
      entity: "JoinRequest",
      entityId: joinRequest.id,
      description: `Approved join request and created lease for flat ${flat.flatNumber}.`,
      createdAt: startDate,
    });

    const periods = monthsBetween(startDate, endDate);

    for (let i = 0; i < periods.length; i++) {
      const { month, year } = periods[i];
      const monthsBeforeEnd = periods.length - 1 - i;
      const unpaid = story !== "paid-up" && monthsBeforeEnd === 0;
      const partial = story === "owes-two-months" && monthsBeforeEnd === 1;
      const paidAmount = unpaid ? 0 : partial ? Math.round(flat.rent * 0.4) : flat.rent;
      const paidAt = paidDate(dueDate(month, year), 4, i + month);

      const rent = await tx.rent.create({
        data: {
          leaseId: lease.id,
          month,
          year,
          amount: flat.rent,
          dueDate: dueDate(month, year),
          status: unpaid ? "OVERDUE" : partial ? "PARTIAL" : "PAID",
          ...(paidAmount > 0 && {
            payments: { create: { paymentType: "RENT", amount: paidAmount, paidAt } },
          }),
        },
      });

      if (paidAmount > 0) {
        activityRows.push({
          userId: landlord.id,
          buildingId,
          action: "PAY",
          entity: "Rent",
          entityId: rent.id,
          description: `Recorded rent payment of ${formatMoney(paidAmount)} for flat ${flat.flatNumber} (${month}/${year}).`,
          createdAt: paidAt,
        });
      }
    }

    // The last electricity bill, unpaid unless they left all square.
    const last = periods[periods.length - 1];
    const billAmount = 1650;

    await tx.utilityBill.create({
      data: {
        leaseId: lease.id,
        type: "ELECTRICITY",
        month: last.month,
        year: last.year,
        amount: billAmount,
        dueDate: dueDate(last.month, last.year),
        ...(story === "paid-up" && {
          payments: {
            create: { paymentType: "UTILITY", amount: billAmount, paidAt: endDate },
          },
        }),
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId,
      action: "END",
      entity: "Lease",
      entityId: lease.id,
      description: "Ended lease.",
      createdAt: endDate,
    });
  }

  async function createAccessCode() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateAccessCode();
      const existing = await tx.building.findUnique({ where: { accessCode: code } });
      if (!existing) return code;
    }
    throw new Error("Could not generate a unique access code.");
  }

  let demoTenantCreated = false;
  let overdueCount = 0;
  let occupiedCount = 0;
  let vacantCount = 0;

  for (const spec of BUILDINGS) {
    const building = await tx.building.create({
      data: {
        name: spec.name,
        address: spec.address,
        city: spec.city,
        country: "Bangladesh",
        status: "ACTIVE",
        ownerId: landlord.id,
        accessCode: await createAccessCode(),
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId: building.id,
      action: "CREATE",
      entity: "Building",
      entityId: building.id,
      description: `Created building "${building.name}".`,
      createdAt: monthsAgo(9, 2),
    });

    let occupiedIndexInBuilding = 0;
    let vacantFlatsPendingRequest = 0;

    for (let floorNumber = 1; floorNumber <= spec.floors.length; floorNumber++) {
      const floor = await tx.floor.create({
        data: { floorNumber, buildingId: building.id },
      });

      const pattern = spec.floors[floorNumber - 1];

      for (let unit = 1; unit <= pattern.length; unit++) {
        const status = pattern[unit - 1];
        const flatNumber = `${floorNumber}0${unit}`;
        // Realistic taka rents: higher floors and 3-bed flats cost more.
        const baseRent = spec.baseRent + (floorNumber - 1) * 1000 + (unit % 2 === 0 ? 1500 : 0);

        const flat = await tx.flat.create({
          data: {
            flatNumber,
            bedrooms: unit % 2 === 0 ? 3 : 2,
            bathrooms: 2,
            monthlyRent: baseRent,
            status,
            floorId: floor.id,
          },
        });

        if (status === "OCCUPIED") {
          const behavior =
            OCCUPIED_PATTERN[(occupiedIndexInBuilding + spec.behaviorOffset) % OCCUPIED_PATTERN.length];
          occupiedIndexInBuilding += 1;
          occupiedCount += 1;

          // One tenant in the first building is the public demo tenant
          // ("Try as tenant"): a partly paid month, history and notices.
          const isDemoTenant = !demoTenantCreated && behavior.outcome === "partial-current";
          if (isDemoTenant) demoTenantCreated = true;

          const tenantProfile = await createTenant(
            isDemoTenant ? DEMO_TENANT.name : nextName(),
            isDemoTenant
          );

          const startDate = monthsAgo(behavior.startMonthsAgo, 3);

          const joinRequest = await tx.joinRequest.create({
            data: {
              tenantId: tenantProfile.id,
              buildingId: building.id,
              flatId: flat.id,
              status: "APPROVED",
              message: "Hi, I'd like to rent this flat. I can move in right away.",
              createdAt: startDate,
              updatedAt: startDate,
            },
          });

          const leaseRent = Math.max(8000, baseRent + behavior.rentDelta);

          const lease = await tx.lease.create({
            data: {
              tenantId: tenantProfile.id,
              flatId: flat.id,
              startDate,
              monthlyRent: leaseRent,
              deposit: behavior.deposit ? leaseRent : null,
              status: "ACTIVE",
            },
          });

          activityRows.push({
            userId: landlord.id,
            buildingId: building.id,
            action: "APPROVE",
            entity: "JoinRequest",
            entityId: joinRequest.id,
            description: `Approved join request and created lease for flat ${flatNumber}.`,
            createdAt: startDate,
          });

          const periods = monthsBetween(startDate, new Date());

          for (let i = 0; i < periods.length; i++) {
            const { month, year } = periods[i];
            // The app's own rule: the CURRENT month is never OVERDUE (it
            // hasn't fully elapsed yet) — only a fully-past month can be.
            const isCurrentMonth = i === periods.length - 1;
            const isPrevMonth = i === periods.length - 2;
            const isTwoMonthsAgo = i === periods.length - 3;

            let paidAmount = leaseRent;
            let finalStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = "PAID";

            if (isCurrentMonth) {
              if (behavior.outcome === "partial-current") {
                paidAmount = Math.round(leaseRent * 0.5);
                finalStatus = "PARTIAL";
              } else if (
                behavior.outcome === "clean-recent-pending" ||
                behavior.outcome === "overdue-1" ||
                behavior.outcome === "overdue-2" ||
                behavior.outcome === "utility-overdue"
              ) {
                paidAmount = 0;
                finalStatus = "PENDING";
              }
            } else if (
              isPrevMonth &&
              (behavior.outcome === "overdue-1" || behavior.outcome === "overdue-2")
            ) {
              paidAmount = 0;
              finalStatus = "OVERDUE";
            } else if (isTwoMonthsAgo && behavior.outcome === "overdue-2") {
              paidAmount = 0;
              finalStatus = "OVERDUE";
            }

            const paidAt = paidDate(dueDate(month, year), 3, floorNumber * 7 + unit * 3 + month);

            const rent = await tx.rent.create({
              data: {
                leaseId: lease.id,
                month,
                year,
                amount: leaseRent,
                dueDate: dueDate(month, year),
                status: finalStatus,
                ...(paidAmount > 0 && {
                  payments: {
                    create: { paymentType: "RENT", amount: paidAmount, paidAt },
                  },
                }),
              },
            });

            if (paidAmount > 0) {
              activityRows.push({
                userId: landlord.id,
                buildingId: building.id,
                action: "PAY",
                entity: "Rent",
                entityId: rent.id,
                description: `Recorded rent payment of ${formatMoney(paidAmount)} for flat ${flatNumber} (${month}/${year}).`,
                createdAt: paidAt,
              });
            }

            if (finalStatus === "OVERDUE") overdueCount += 1;
          }

          // One or two electricity bills for recent months.
          const utilityMonths = periods.slice(-2);

          for (const { month, year } of utilityMonths) {
            const utilityAmount = 1200 + unit * 150;
            const leaveUnpaid =
              behavior.outcome === "utility-overdue" &&
              month === utilityMonths[utilityMonths.length - 1].month;
            const paidAt = paidDate(dueDate(month, year), 5, floorNumber * 7 + unit * 3 + month + 4);

            const bill = await tx.utilityBill.create({
              data: {
                leaseId: lease.id,
                type: "ELECTRICITY",
                month,
                year,
                amount: utilityAmount,
                dueDate: dueDate(month, year),
                ...(!leaveUnpaid && {
                  payments: {
                    create: { paymentType: "UTILITY", amount: utilityAmount, paidAt },
                  },
                }),
              },
            });

            if (!leaveUnpaid) {
              activityRows.push({
                userId: landlord.id,
                buildingId: building.id,
                action: "PAY",
                entity: "UtilityBill",
                entityId: bill.id,
                description: `Recorded utility payment of ${formatMoney(utilityAmount)} for flat ${flatNumber}.`,
                createdAt: paidAt,
              });
            }
          }
        } else if (status === "VACANT") {
          vacantCount += 1;
          vacantFlatsPendingRequest += 1;

          // Most vacant flats get a pending applicant; leave one per
          // building empty for realism.
          if (vacantFlatsPendingRequest % 3 !== 0) {
            const applicant = await createTenant(nextName());
            // Sent in the last week, so the requests look fresh.
            const requestDate = daysAgo(1 + (emailCounter % 6));

            const request = await tx.joinRequest.create({
              data: {
                tenantId: applicant.id,
                buildingId: building.id,
                flatId: flat.id,
                status: "PENDING",
                message: "Hello, is this flat still available? I'm interested in moving in next month.",
                createdAt: requestDate,
                updatedAt: requestDate,
              },
            });

            activityRows.push({
              userId: applicant.userId,
              buildingId: building.id,
              action: "CREATE",
              entity: "JoinRequest",
              entityId: request.id,
              description: `Requested flat ${flatNumber}.`,
              createdAt: requestDate,
            });
          }

          // The first vacant flat in each building also has a former
          // tenant and a rejected request, for realistic history.
          if (vacantFlatsPendingRequest === 1) {
            await addFormerTenant(
              spec.formerTenant,
              { id: flat.id, flatNumber, rent: baseRent },
              building.id
            );

            const rejected = await createTenant(nextName());
            const rejectedDate = monthsAgo(2, 10);

            await tx.joinRequest.create({
              data: {
                tenantId: rejected.id,
                buildingId: building.id,
                flatId: flat.id,
                status: "REJECTED",
                message: "Is this flat pet-friendly?",
                createdAt: rejectedDate,
                updatedAt: rejectedDate,
              },
            });
          }
        }
      }
    }

    // Two notices per building: a fresh one (shows as "New" to tenants)
    // and an expired reminder (shows as "Expired" to the landlord).
    const freshNoticeDate = daysAgo(2);
    const notice = await tx.notice.create({
      data: {
        buildingId: building.id,
        title: "Water tank cleaning this weekend",
        content:
          "The rooftop water tank will be cleaned this Saturday between 9am and 1pm. Water supply may be briefly interrupted.",
        audience: "ALL",
        createdAt: freshNoticeDate,
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId: building.id,
      action: "CREATE",
      entity: "Notice",
      entityId: notice.id,
      description: `Published notice "${notice.title}".`,
      createdAt: freshNoticeDate,
    });

    const reminderDate = daysAgo(40);
    const reminder = await tx.notice.create({
      data: {
        buildingId: building.id,
        title: "Rent due reminder",
        content:
          "This is a friendly reminder that rent is due on the 1st of every month. Please contact building management for any payment issues.",
        audience: "TENANTS",
        createdAt: reminderDate,
        expiresAt: daysAgo(10),
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId: building.id,
      action: "CREATE",
      entity: "Notice",
      entityId: reminder.id,
      description: `Published notice "${reminder.title}".`,
      createdAt: reminderDate,
    });
  }

  await tx.activityLog.createMany({ data: activityRows });

  return {
    buildings: BUILDINGS.length,
    occupiedFlats: occupiedCount,
    vacantFlats: vacantCount,
    overdueRentPeriods: overdueCount,
    activityEntries: activityRows.length,
  };
}

async function removeDemoData(tx: Tx) {
  // Buildings cascade to floors, flats, leases, rent, bills, payments,
  // requests and notices.
  await tx.building.deleteMany({ where: { owner: { email: DEMO_LANDLORD.email } } });

  // The public demo tenant's profile cascades to their leases and requests
  // (including any they sent to other buildings while exploring).
  await tx.tenantProfile.deleteMany({ where: { user: { email: DEMO_TENANT.email } } });

  await tx.activityLog.deleteMany({ where: { user: { email: { in: PUBLIC_DEMO_EMAILS } } } });

  // Every other demo tenant (their accounts cascade to everything they
  // own), plus tenants left by older versions of this seed, which used
  // @example.com addresses and "DEMO-" national IDs.
  await tx.user.deleteMany({
    where: {
      email: { notIn: PUBLIC_DEMO_EMAILS },
      OR: [
        { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
        {
          email: { endsWith: "@example.com" },
          tenantProfile: { nationalId: { startsWith: "DEMO-" } },
        },
      ],
    },
  });
}
