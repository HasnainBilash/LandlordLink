-- AlterEnum
ALTER TYPE "RentStatus" ADD VALUE 'WRITTEN_OFF';

-- AlterTable
ALTER TABLE "UtilityBill" ADD COLUMN "writtenOffAt" TIMESTAMP(3);

-- Free the numbers still held by soft-deleted floors and flats, so they
-- can be reused (see src/lib/tombstone.ts). History rows are kept.
UPDATE "Floor" AS f
SET "floorNumber" = -1000000 - deleted.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "buildingId" ORDER BY "id") AS rn
  FROM "Floor"
  WHERE "deletedAt" IS NOT NULL AND "floorNumber" > -1000000
) AS deleted
WHERE f."id" = deleted."id";

UPDATE "Flat"
SET "flatNumber" = "flatNumber" || '~' || RIGHT("id", 8)
WHERE "deletedAt" IS NOT NULL AND POSITION('~' IN "flatNumber") = 0;
