/*
  Warnings:

  - A unique constraint covering the columns `[accessCode]` on the table `Building` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "accessCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Building_accessCode_key" ON "Building"("accessCode");
