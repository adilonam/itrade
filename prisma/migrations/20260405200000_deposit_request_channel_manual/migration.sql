-- CreateEnum
CREATE TYPE "DepositRequestChannel" AS ENUM ('GATEWAY', 'MANUAL');

-- AlterTable
ALTER TABLE "deposit_requests" ADD COLUMN "channel" "DepositRequestChannel" NOT NULL DEFAULT 'GATEWAY';
ALTER TABLE "deposit_requests" ADD COLUMN "admin_notes" TEXT;

-- CreateIndex
CREATE INDEX "deposit_requests_channel_idx" ON "deposit_requests"("channel");
