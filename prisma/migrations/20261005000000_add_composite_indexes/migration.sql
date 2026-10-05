-- CreateIndex
CREATE INDEX "Lease_flatId_status_idx" ON "Lease"("flatId", "status");

-- CreateIndex
CREATE INDEX "Lease_tenantId_status_idx" ON "Lease"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JoinRequest_buildingId_status_idx" ON "JoinRequest"("buildingId", "status");

-- CreateIndex
CREATE INDEX "Rent_leaseId_status_dueDate_idx" ON "Rent"("leaseId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Notice_buildingId_createdAt_idx" ON "Notice"("buildingId", "createdAt");
