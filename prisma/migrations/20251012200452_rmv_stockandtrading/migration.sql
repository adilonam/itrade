/*
  Warnings:

  - The values [STOCK_AND_TRADING] on the enum `Room` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Room_new" AS ENUM ('STOCK', 'TRADING');
ALTER TABLE "public"."markets" ALTER COLUMN "room" DROP DEFAULT;
ALTER TABLE "public"."positions" ALTER COLUMN "room" DROP DEFAULT;
ALTER TABLE "public"."markets" ALTER COLUMN "room" TYPE "public"."Room_new" USING ("room"::text::"public"."Room_new");
ALTER TABLE "public"."positions" ALTER COLUMN "room" TYPE "public"."Room_new" USING ("room"::text::"public"."Room_new");
ALTER TYPE "public"."Room" RENAME TO "Room_old";
ALTER TYPE "public"."Room_new" RENAME TO "Room";
DROP TYPE "public"."Room_old";
ALTER TABLE "public"."markets" ALTER COLUMN "room" SET DEFAULT 'TRADING';
ALTER TABLE "public"."positions" ALTER COLUMN "room" SET DEFAULT 'TRADING';
COMMIT;
