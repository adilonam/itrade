-- Backfill default REAL, DEMO, and INSTITUTIONAL balances for existing users
INSERT INTO "user_balances" ("id", "user_id", "type", "amount", "created_at", "updated_at")
SELECT
  'seed-real-' || u."id",
  u."id",
  'REAL'::"BalanceType",
  0,
  NOW(),
  NOW()
FROM "users" u
ON CONFLICT ("user_id", "type") DO NOTHING;

INSERT INTO "user_balances" ("id", "user_id", "type", "amount", "created_at", "updated_at")
SELECT
  'seed-demo-' || u."id",
  u."id",
  'DEMO'::"BalanceType",
  10000,
  NOW(),
  NOW()
FROM "users" u
ON CONFLICT ("user_id", "type") DO NOTHING;

INSERT INTO "user_balances" ("id", "user_id", "type", "amount", "created_at", "updated_at")
SELECT
  'seed-institutional-' || u."id",
  u."id",
  'INSTITUTIONAL'::"BalanceType",
  0,
  NOW(),
  NOW()
FROM "users" u
ON CONFLICT ("user_id", "type") DO NOTHING;

-- Remove legacy single balance column from users
ALTER TABLE "users" DROP COLUMN "balance";
