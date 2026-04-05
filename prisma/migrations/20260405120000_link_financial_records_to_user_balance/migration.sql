-- Link transactions, deposit_requests, and transfer_requests to user_balances.
-- Backfill then drop legacy user_id / balance type columns.

-- 1) transactions
ALTER TABLE "transactions" ADD COLUMN "user_balance_id" TEXT;

UPDATE "transactions" AS t
SET "user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = t."user_id" AND ub."type" = t."balanceType";

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_fkey";

ALTER TABLE "transactions" DROP COLUMN "user_id",
DROP COLUMN "balanceType";

ALTER TABLE "transactions" ALTER COLUMN "user_balance_id" SET NOT NULL;

CREATE INDEX "transactions_user_balance_id_idx" ON "transactions"("user_balance_id");

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_balance_id_fkey" FOREIGN KEY ("user_balance_id") REFERENCES "user_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) deposit_requests
ALTER TABLE "deposit_requests" ADD COLUMN "user_balance_id" TEXT;

UPDATE "deposit_requests" AS dr
SET "user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = dr."user_id" AND ub."type" = dr."balance_type";

ALTER TABLE "deposit_requests" DROP CONSTRAINT IF EXISTS "deposit_requests_user_id_fkey";

DROP INDEX IF EXISTS "deposit_requests_user_id_idx";

ALTER TABLE "deposit_requests" DROP COLUMN "user_id",
DROP COLUMN "balance_type";

ALTER TABLE "deposit_requests" ALTER COLUMN "user_balance_id" SET NOT NULL;

CREATE INDEX "deposit_requests_user_balance_id_idx" ON "deposit_requests"("user_balance_id");

ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_user_balance_id_fkey" FOREIGN KEY ("user_balance_id") REFERENCES "user_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) transfer_requests
ALTER TABLE "transfer_requests" ADD COLUMN "sender_user_balance_id" TEXT;
ALTER TABLE "transfer_requests" ADD COLUMN "recipient_user_balance_id" TEXT;

UPDATE "transfer_requests" AS tr
SET "sender_user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = tr."sender_user_id" AND ub."type" = tr."balance_type";

UPDATE "transfer_requests" AS tr
SET "recipient_user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = tr."recipient_user_id" AND ub."type" = tr."balance_type";

ALTER TABLE "transfer_requests" DROP CONSTRAINT IF EXISTS "transfer_requests_sender_user_id_fkey";
ALTER TABLE "transfer_requests" DROP CONSTRAINT IF EXISTS "transfer_requests_recipient_user_id_fkey";

DROP INDEX IF EXISTS "transfer_requests_sender_user_id_idx";
DROP INDEX IF EXISTS "transfer_requests_recipient_user_id_idx";

ALTER TABLE "transfer_requests" DROP COLUMN "sender_user_id",
DROP COLUMN "recipient_user_id",
DROP COLUMN "balance_type";

ALTER TABLE "transfer_requests" ALTER COLUMN "sender_user_balance_id" SET NOT NULL;
ALTER TABLE "transfer_requests" ALTER COLUMN "recipient_user_balance_id" SET NOT NULL;

CREATE INDEX "transfer_requests_sender_user_balance_id_idx" ON "transfer_requests"("sender_user_balance_id");
CREATE INDEX "transfer_requests_recipient_user_balance_id_idx" ON "transfer_requests"("recipient_user_balance_id");

ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_sender_user_balance_id_fkey" FOREIGN KEY ("sender_user_balance_id") REFERENCES "user_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_recipient_user_balance_id_fkey" FOREIGN KEY ("recipient_user_balance_id") REFERENCES "user_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
