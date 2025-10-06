/*
  Warnings:

  - The values [PROCESSING] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEPOSIT,WITHDRAWAL,TRANSFER_IN,TRANSFER_OUT,FEE,BONUS,REFUND] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionStatus_new" AS ENUM ('PLACED', 'CLOSED', 'FAILED', 'PENDING');
ALTER TABLE "public"."transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."transactions" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TYPE "public"."TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "public"."TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "public"."transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionType_new" AS ENUM ('BUY', 'SELL');
ALTER TABLE "public"."transactions" ALTER COLUMN "type" TYPE "public"."TransactionType_new" USING ("type"::text::"public"."TransactionType_new");
ALTER TYPE "public"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "public"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';
