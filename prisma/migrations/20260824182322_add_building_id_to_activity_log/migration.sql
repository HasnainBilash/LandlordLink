-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "buildingId" TEXT;

-- CreateIndex
CREATE INDEX "ActivityLog_buildingId_idx" ON "ActivityLog"("buildingId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
