-- CreateTable
CREATE TABLE "ip_limit_records" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastRequestDate" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_limit_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ip_limit_records_ipAddress_key" ON "ip_limit_records"("ipAddress");

-- CreateIndex
CREATE INDEX "ip_limit_records_ipAddress_lastRequestDate_idx" ON "ip_limit_records"("ipAddress", "lastRequestDate");
