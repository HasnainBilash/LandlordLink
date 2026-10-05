// Rebuilds the public demo now: the demo landlord with three buildings,
// ~30 tenants and months of rent history (see src/lib/demo-data.ts).
// Safe to re-run — it only replaces demo data. The live site also does
// this every night.
//
// Run: npm run db:seed-demo

import { PrismaClient } from "@prisma/client";

import { DEMO_LANDLORD, DEMO_PASSWORD, DEMO_TENANT } from "../src/lib/demo";
import { resetDemoData } from "../src/lib/demo-data";

const prisma = new PrismaClient();

resetDemoData(prisma)
  .then((summary) => {
    console.log("Demo data is ready.");
    console.log(`  Landlord login: ${DEMO_LANDLORD.email} / ${DEMO_PASSWORD}`);
    console.log(`  Tenant login:   ${DEMO_TENANT.email} / ${DEMO_PASSWORD}`);
    console.log(`  Buildings: ${summary.buildings}`);
    console.log(`  Occupied flats: ${summary.occupiedFlats}`);
    console.log(`  Vacant flats: ${summary.vacantFlats}`);
    console.log(`  Overdue rent periods: ${summary.overdueRentPeriods}`);
    console.log(`  Activity log entries: ${summary.activityEntries}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
