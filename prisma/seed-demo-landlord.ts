// Additive demo-data seed: creates a brand-new demo landlord, buildings,
// floors, flats, tenants, leases, rent/utility billing history, notices,
// and activity log entries. Never touches or deletes existing data —
// safe to run against a database that already has real/test records.

import { PrismaClient, UserRole, FlatStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateAccessCode } from "../src/lib/generate-access-code";

const prisma = new PrismaClient();

const DEMO_LANDLORD = {
  name: "Farhan Ahmed",
  email: "farhan.ahmed@example.com",
  password: "password123",
};

const BUILDINGS = [
  { name: "Green Valley Apartments", address: "House 12, Road 5, Banani", city: "Dhaka" },
  { name: "Sunset Residency", address: "Plot 34, Block C, Bashundhara R/A", city: "Dhaka" },
  { name: "Riverside Heights", address: "45 Agrabad Access Road", city: "Chattogram" },
];

const FLOORS_PER_BUILDING = 3;

// One 4-flat pattern per floor: O = occupied, V = vacant, M = maintenance.
const FLOOR_PATTERNS: FlatStatus[][] = [
  ["OCCUPIED", "OCCUPIED", "OCCUPIED", "VACANT"],
  ["OCCUPIED", "OCCUPIED", "OCCUPIED", "VACANT"],
  ["OCCUPIED", "OCCUPIED", "VACANT", "MAINTENANCE"],
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
];

let nameIndex = 0;
function nextName() {
  const name = TENANT_NAMES[nameIndex % TENANT_NAMES.length];
  nameIndex += 1;
  return `${name}${nameIndex > TENANT_NAMES.length ? ` ${Math.ceil(nameIndex / TENANT_NAMES.length)}` : ""}`;
}

function slugEmail(name: string, counter: number) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/, "");
  return `${slug}${counter}@example.com`;
}

function monthsAgo(n: number, day = 5) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

async function createAccessCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode();
    const existing = await prisma.building.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique access code.");
}

async function createTenant(fullName: string, emailCounter: number) {
  const passwordHash = await bcrypt.hash("password123", 10);
  const email = slugEmail(fullName, emailCounter);

  const user = await prisma.user.create({
    data: { name: fullName, email, passwordHash, role: UserRole.TENANT },
  });

  const profile = await prisma.tenantProfile.create({
    data: {
      userId: user.id,
      occupation: ["Software Engineer", "Teacher", "Bank Officer", "Doctor", "Graphic Designer", "Business Owner", "Nurse", "Accountant"][emailCounter % 8],
      nationalId: `DEMO-${String(emailCounter).padStart(5, "0")}`,
      emergencyContact: `+8801${String(700000000 + emailCounter * 37).slice(0, 9)}`,
    },
  });

  return { user, profile };
}

type OccupiedBehavior = {
  startMonthsAgo: number;
  deposit: boolean;
  rentDelta: number;
  // How the rent history for this tenant should look.
  outcome: "clean" | "clean-recent-pending" | "overdue-1" | "overdue-2" | "partial-current" | "utility-overdue";
};

const OCCUPIED_PATTERN: OccupiedBehavior[] = [
  { startMonthsAgo: 6, deposit: true, rentDelta: 0, outcome: "clean" },
  { startMonthsAgo: 3, deposit: false, rentDelta: 20, outcome: "clean" },
  { startMonthsAgo: 1, deposit: false, rentDelta: 0, outcome: "clean-recent-pending" },
  { startMonthsAgo: 4, deposit: true, rentDelta: -30, outcome: "overdue-1" },
  { startMonthsAgo: 5, deposit: false, rentDelta: 0, outcome: "utility-overdue" },
  { startMonthsAgo: 7, deposit: true, rentDelta: 50, outcome: "overdue-2" },
  { startMonthsAgo: 2, deposit: false, rentDelta: 0, outcome: "partial-current" },
  { startMonthsAgo: 8, deposit: true, rentDelta: -10, outcome: "clean" },
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

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_LANDLORD.password, 10);

  const existingLandlord = await prisma.user.findUnique({
    where: { email: DEMO_LANDLORD.email },
  });

  if (existingLandlord) {
    console.log(
      `Demo landlord ${DEMO_LANDLORD.email} already exists (id ${existingLandlord.id}). Re-running would create duplicate buildings, so aborting.`
    );
    console.log("Delete that user (cascades to everything under it) first if you want a fresh run.");
    return;
  }

  const landlord = await prisma.user.create({
    data: {
      name: DEMO_LANDLORD.name,
      email: DEMO_LANDLORD.email,
      passwordHash,
      role: UserRole.LANDLORD,
    },
  });

  const activityRows: ActivityRow[] = [];
  let emailCounter = 1;
  let overdueCount = 0;
  let occupiedCount = 0;
  let vacantCount = 0;

  for (const buildingSpec of BUILDINGS) {
    const accessCode = await createAccessCode();

    const building = await prisma.building.create({
      data: {
        name: buildingSpec.name,
        address: buildingSpec.address,
        city: buildingSpec.city,
        country: "Bangladesh",
        status: "ACTIVE",
        ownerId: landlord.id,
        accessCode,
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

    for (let floorNumber = 1; floorNumber <= FLOORS_PER_BUILDING; floorNumber++) {
      const floor = await prisma.floor.create({
        data: {
          floorNumber,
          buildingId: building.id,
        },
      });

      const pattern = FLOOR_PATTERNS[floorNumber - 1];

      for (let unit = 1; unit <= pattern.length; unit++) {
        const status = pattern[unit - 1];
        const flatNumber = `${floorNumber}0${unit}`;
        const baseRent = 800 + floorNumber * 100 + unit * 25;

        const flat = await prisma.flat.create({
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
          const behavior = OCCUPIED_PATTERN[occupiedIndexInBuilding % OCCUPIED_PATTERN.length];
          occupiedIndexInBuilding += 1;
          occupiedCount += 1;

          const tenantName = nextName();
          const { profile: tenantProfile } = await createTenant(
            tenantName,
            emailCounter++
          );

          const startDate = monthsAgo(behavior.startMonthsAgo, 3);

          const joinRequest = await prisma.joinRequest.create({
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

          const leaseRent = Math.max(300, baseRent + behavior.rentDelta);

          const lease = await prisma.lease.create({
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

          const now = new Date();
          const periods = monthsBetween(startDate, now);

          for (let i = 0; i < periods.length; i++) {
            const { month, year } = periods[i];
            // The app's own reconciliation rule: the CURRENT month is
            // never OVERDUE (it hasn't fully elapsed yet) — only a
            // fully-past month can be. Keep seeded data consistent
            // with that rule rather than contradicting it.
            const isCurrentMonth = i === periods.length - 1;
            const isPrevMonth = i === periods.length - 2;
            const isTwoMonthsAgo = i === periods.length - 3;

            const rent = await prisma.rent.create({
              data: {
                leaseId: lease.id,
                month,
                year,
                amount: leaseRent,
                dueDate: dueDate(month, year),
                status: "PENDING",
              },
            });

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

            if (paidAmount > 0) {
              const payment = await prisma.paymentHistory.create({
                data: {
                  paymentType: "RENT",
                  rentId: rent.id,
                  amount: paidAmount,
                  paidAt: new Date(dueDate(month, year).getTime() + 3 * 24 * 60 * 60 * 1000),
                },
              });

              activityRows.push({
                userId: landlord.id,
                buildingId: building.id,
                action: "PAY",
                entity: "Rent",
                entityId: rent.id,
                description: `Recorded rent payment of $${paidAmount.toFixed(2)} for flat ${flatNumber} (${month}/${year}).`,
                createdAt: payment.paidAt,
              });
            }

            await prisma.rent.update({
              where: { id: rent.id },
              data: { status: finalStatus },
            });

            if (finalStatus === "OVERDUE") overdueCount += 1;
          }

          // One or two utility bills for recent months.
          const utilityMonths = periods.slice(-2);

          for (const { month, year } of utilityMonths) {
            const utilityAmount = 40 + unit * 5;

            const bill = await prisma.utilityBill.create({
              data: {
                leaseId: lease.id,
                type: "ELECTRICITY",
                month,
                year,
                amount: utilityAmount,
                dueDate: dueDate(month, year),
              },
            });

            const shouldLeaveUnpaid =
              behavior.outcome === "utility-overdue" && month === utilityMonths[utilityMonths.length - 1].month;

            if (!shouldLeaveUnpaid) {
              const payment = await prisma.paymentHistory.create({
                data: {
                  paymentType: "UTILITY",
                  utilityBillId: bill.id,
                  amount: utilityAmount,
                  paidAt: new Date(dueDate(month, year).getTime() + 5 * 24 * 60 * 60 * 1000),
                },
              });

              activityRows.push({
                userId: landlord.id,
                buildingId: building.id,
                action: "PAY",
                entity: "UtilityBill",
                entityId: bill.id,
                description: `Recorded utility payment of $${utilityAmount.toFixed(2)} for flat ${flatNumber}.`,
                createdAt: payment.paidAt,
              });
            }
          }
        } else if (status === "VACANT") {
          vacantCount += 1;
          vacantFlatsPendingRequest += 1;

          // Most vacant flats get a pending applicant; leave one per
          // building empty for realism.
          if (vacantFlatsPendingRequest % 3 !== 0) {
            const applicantName = nextName();
            const { profile: applicantProfile } = await createTenant(
              applicantName,
              emailCounter++
            );

            const requestDate = monthsAgo(0, 20);

            const request = await prisma.joinRequest.create({
              data: {
                tenantId: applicantProfile.id,
                buildingId: building.id,
                flatId: flat.id,
                status: "PENDING",
                message: "Hello, is this flat still available? I'm interested in moving in next month.",
                createdAt: requestDate,
                updatedAt: requestDate,
              },
            });

            activityRows.push({
              userId: applicantProfile.userId,
              buildingId: building.id,
              action: "CREATE",
              entity: "JoinRequest",
              entityId: request.id,
              description: `Requested flat ${flatNumber}.`,
              createdAt: requestDate,
            });
          }

          // The first vacant flat in each building also carries a
          // rejected historical request, for realistic history.
          if (vacantFlatsPendingRequest === 1) {
            const rejectedApplicantName = nextName();
            const { profile: rejectedProfile } = await createTenant(
              rejectedApplicantName,
              emailCounter++
            );

            const rejectedDate = monthsAgo(2, 10);

            await prisma.joinRequest.create({
              data: {
                tenantId: rejectedProfile.id,
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

    // Notices for this building.
    const notice1 = await prisma.notice.create({
      data: {
        buildingId: building.id,
        title: "Water tank cleaning this weekend",
        content:
          "The rooftop water tank will be cleaned this Saturday between 9am and 1pm. Water supply may be briefly interrupted.",
        audience: "ALL",
        expiresAt: null,
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId: building.id,
      action: "CREATE",
      entity: "Notice",
      entityId: notice1.id,
      description: `Published notice "${notice1.title}".`,
      createdAt: monthsAgo(1, 15),
    });

    const notice2 = await prisma.notice.create({
      data: {
        buildingId: building.id,
        title: "Rent due reminder",
        content:
          "This is a friendly reminder that rent is due on the 1st of every month. Please contact building management for any payment issues.",
        audience: "TENANTS",
        expiresAt: monthsAgo(0, 1),
      },
    });

    activityRows.push({
      userId: landlord.id,
      buildingId: building.id,
      action: "CREATE",
      entity: "Notice",
      entityId: notice2.id,
      description: `Published notice "${notice2.title}".`,
      createdAt: monthsAgo(2, 1),
    });
  }

  if (activityRows.length > 0) {
    await prisma.activityLog.createMany({
      data: activityRows.map((row) => ({
        userId: row.userId,
        buildingId: row.buildingId,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        description: row.description,
        createdAt: row.createdAt,
      })),
    });
  }

  console.log("Demo landlord seeded successfully.");
  console.log(`  Login: ${DEMO_LANDLORD.email} / ${DEMO_LANDLORD.password}`);
  console.log(`  Buildings: ${BUILDINGS.length}`);
  console.log(`  Occupied flats: ${occupiedCount}`);
  console.log(`  Vacant flats: ${vacantCount}`);
  console.log(`  Overdue rent periods created: ${overdueCount}`);
  console.log(`  Activity log entries: ${activityRows.length}`);
  console.log("  All demo tenant accounts use password: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
