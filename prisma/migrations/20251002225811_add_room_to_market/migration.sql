-- CreateEnum
CREATE TYPE "public"."Room" AS ENUM ('STOCK', 'TRADING');

-- AlterTable
ALTER TABLE "public"."markets" ADD COLUMN     "room" "public"."Room" NOT NULL DEFAULT 'TRADING';
