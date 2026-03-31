-- CreateEnum
CREATE TYPE "DepositRequestStatus" AS ENUM ('PENDING', 'WAITING', 'CONFIRMING', 'FINISHED', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "deposit_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "pay_currency" TEXT NOT NULL,
    "balance_type" "BalanceType" NOT NULL DEFAULT 'REAL',
    "status" "DepositRequestStatus" NOT NULL DEFAULT 'PENDING',
    "now_payment_id" TEXT,
    "now_payment_status" TEXT,
    "checkout_url" TEXT,
    "order_id" TEXT NOT NULL,
    "credited_at" TIMESTAMP(3),
    "last_webhook_at" TIMESTAMP(3),
    "raw_webhook_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_requests_now_payment_id_key" ON "deposit_requests"("now_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_requests_order_id_key" ON "deposit_requests"("order_id");

-- CreateIndex
CREATE INDEX "deposit_requests_user_id_idx" ON "deposit_requests"("user_id");

-- CreateIndex
CREATE INDEX "deposit_requests_status_idx" ON "deposit_requests"("status");

-- AddForeignKey
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
