-- CreateTable
CREATE TABLE "BuildingDailyStat" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "flats" INTEGER NOT NULL,
    "occupied" INTEGER NOT NULL,
    "owed" DECIMAL(12,2) NOT NULL,
    "collected" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingDailyStat_day_idx" ON "BuildingDailyStat"("day");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingDailyStat_buildingId_day_key" ON "BuildingDailyStat"("buildingId", "day");

-- AddForeignKey
ALTER TABLE "BuildingDailyStat" ADD CONSTRAINT "BuildingDailyStat_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

