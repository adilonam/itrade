-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('PENDING', 'REJECTED', 'PROCESSING', 'APPROVED');

-- CreateTable
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_type" "BalanceType" NOT NULL DEFAULT 'REAL',
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_requests_sender_user_id_idx" ON "transfer_requests"("sender_user_id");

-- CreateIndex
CREATE INDEX "transfer_requests_recipient_user_id_idx" ON "transfer_requests"("recipient_user_id");

-- CreateIndex
CREATE INDEX "transfer_requests_status_idx" ON "transfer_requests"("status");

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
