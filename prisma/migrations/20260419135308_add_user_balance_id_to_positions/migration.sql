-- Add wallet column (nullable first for backfill)
ALTER TABLE "positions" ADD COLUMN "user_balance_id" TEXT;

-- Map each position to the user's balance row for that room's wallet (INSTITUTIONAL vs REAL)
UPDATE "positions" AS p
SET "user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = p."user_id"
  AND ub."type" = CASE
    WHEN p."room" = 'INSTITUTIONAL' THEN 'INSTITUTIONAL'::"BalanceType"
    ELSE 'REAL'::"BalanceType"
  END;

-- Any stragglers: attach REAL balance
UPDATE "positions" AS p
SET "user_balance_id" = ub."id"
FROM "user_balances" AS ub
WHERE ub."user_id" = p."user_id"
  AND ub."type" = 'REAL'
  AND p."user_balance_id" IS NULL;

ALTER TABLE "positions" ALTER COLUMN "user_balance_id" SET NOT NULL;

CREATE INDEX "positions_user_balance_id_idx" ON "positions"("user_balance_id");

ALTER TABLE "positions" ADD CONSTRAINT "positions_user_balance_id_fkey" FOREIGN KEY ("user_balance_id") REFERENCES "user_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
