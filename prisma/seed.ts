import { PrismaClient, UserRole, BuildingStatus, FlatStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // This script DELETES EVERY ROW in the database before seeding.
  // Refuse to run unless explicitly allowed, so it can never wipe a
  // real database by accident. For test data use: npm run db:seed-test
  if (process.env.ALLOW_DB_WIPE !== "yes") {
    console.error(
      "Refusing to run: prisma/seed.ts wipes the whole database. " +
        "Set ALLOW_DB_WIPE=yes if you really mean it, or use npm run db:seed-test."
    );
    process.exitCode = 1;
    return;
  }

  await prisma.activityLog.deleteMany();
  await prisma.paymentHistory.deleteMany();
  await prisma.utilityBill.deleteMany();
  await prisma.rent.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenantProfile.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("11111111", 12);

  const landlord = await prisma.user.create({
    data: {
      name: "Demo Landlord",
      email: "landlord@test.com",
      passwordHash,
      role: UserRole.LANDLORD,
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      name: "Demo Tenant",
      email: "tenant@test.com",
      passwordHash,
      role: UserRole.TENANT,
    },
  });

  await prisma.tenantProfile.create({
    data: {
      userId: tenantUser.id,
      occupation: "Software Engineer",
    },
  });

  const building = await prisma.building.create({
    data: {
      name: "Green Tower",
      address: "123 Main Road",
      city: "Dhaka",
      country: "Bangladesh",
      status: BuildingStatus.ACTIVE,
      ownerId: landlord.id,
    },
  });

  for (let i = 1; i <= 2; i++) {
    const floor = await prisma.floor.create({
      data: {
        floorNumber: i,
        buildingId: building.id,
      },
    });

    for (let j = 1; j <= 3; j++) {
      await prisma.flat.create({
        data: {
          flatNumber: `${i}0${j}`,
          bedrooms: 2,
          bathrooms: 2,
          monthlyRent: 15000,
          status: FlatStatus.VACANT,
          floorId: floor.id,
        },
      });
    }
  }

  console.log("✅ Database seeded successfully");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });