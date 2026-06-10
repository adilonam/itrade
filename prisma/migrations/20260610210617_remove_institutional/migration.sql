/*
  Warnings:

  - The values [INSTITUTIONAL] on the enum `BalanceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [INSTITUTIONAL] on the enum `Room` will be removed. If these variants are still used in the database, this will fail.
  - The values [TRANSFER_IN,TRANSFER_OUT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/

-- Remove rows that still reference enum variants we are dropping.
DELETE FROM "positions"
WHERE "room" = 'INSTITUTIONAL'
   OR "user_balance_id" IN (
     SELECT "id" FROM "user_balances" WHERE "type" = 'INSTITUTIONAL'
   );

DELETE FROM "transactions"
WHERE "type" IN ('TRANSFER_IN', 'TRANSFER_OUT');

DELETE FROM "user_balances"
WHERE "type" = 'INSTITUTIONAL';

UPDATE "markets"
SET "room" = 'TRADING'
WHERE "room" = 'INSTITUTIONAL';

-- AlterEnum
BEGIN;
CREATE TYPE "BalanceType_new" AS ENUM ('REAL', 'DEMO');
ALTER TABLE "user_balances" ALTER COLUMN "type" TYPE "BalanceType_new" USING ("type"::text::"BalanceType_new");
ALTER TYPE "BalanceType" RENAME TO "BalanceType_old";
ALTER TYPE "BalanceType_new" RENAME TO "BalanceType";
DROP TYPE "public"."BalanceType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Room_new" AS ENUM ('STOCK', 'TRADING');
ALTER TABLE "public"."markets" ALTER COLUMN "room" DROP DEFAULT;
ALTER TABLE "public"."positions" ALTER COLUMN "room" DROP DEFAULT;
ALTER TABLE "markets" ALTER COLUMN "room" TYPE "Room_new" USING ("room"::text::"Room_new");
ALTER TABLE "positions" ALTER COLUMN "room" TYPE "Room_new" USING ("room"::text::"Room_new");
ALTER TYPE "Room" RENAME TO "Room_old";
ALTER TYPE "Room_new" RENAME TO "Room";
DROP TYPE "public"."Room_old";
ALTER TABLE "markets" ALTER COLUMN "room" SET DEFAULT 'TRADING';
ALTER TABLE "positions" ALTER COLUMN "room" SET DEFAULT 'TRADING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('GAIN', 'INVESTMENT_GAIN', 'LOSS', 'DEPOSIT', 'WITHDRAW');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;
