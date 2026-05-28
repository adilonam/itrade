/*
  Warnings:

  - The values [DEMO] on the enum `Room` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Room_new" AS ENUM ('STOCK', 'TRADING', 'INSTITUTIONAL');
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
