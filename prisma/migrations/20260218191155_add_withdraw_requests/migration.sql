-- CreateEnum
CREATE TYPE "WithdrawMethod" AS ENUM ('PAYPAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "WithdrawRequestStatus" AS ENUM ('PENDING', 'REJECTED', 'PROCESSING', 'CLOSED');

-- CreateTable
CREATE TABLE "withdraw_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "WithdrawMethod" NOT NULL,
    "status" "WithdrawRequestStatus" NOT NULL DEFAULT 'PENDING',
    "details" JSONB,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdraw_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdraw_requests_user_id_idx" ON "withdraw_requests"("user_id");

-- CreateIndex
CREATE INDEX "withdraw_requests_status_idx" ON "withdraw_requests"("status");

-- AddForeignKey
ALTER TABLE "withdraw_requests" ADD CONSTRAINT "withdraw_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
