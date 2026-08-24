import { PrismaClient, Prisma } from "@prisma/client";
import { generateAccessCode } from "../src/lib/generate-access-code";

const prisma = new PrismaClient();

async function main() {
  const buildings = await prisma.building.findMany({
    where: { accessCode: null },
  });

  console.log(
    `Found ${buildings.length} building(s) without an access code.`
  );

  for (const building of buildings) {
    let code = generateAccessCode();
    let attempts = 0;
    let saved = false;

    while (attempts < 5 && !saved) {
      try {
        await prisma.building.update({
          where: { id: building.id },
          data: { accessCode: code },
        });

        console.log(`  ${building.name}: ${code}`);
        saved = true;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          attempts++;
          code = generateAccessCode();
          continue;
        }

        throw error;
      }
    }

    if (!saved) {
      console.error(
        `  Failed to assign a unique code to "${building.name}" after 5 attempts.`
      );
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });