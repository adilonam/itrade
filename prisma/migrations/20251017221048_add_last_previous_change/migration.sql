-- AlterTable
ALTER TABLE "public"."markets" ADD COLUMN     "lastPreviousClose" DOUBLE PRECISION NOT NULL DEFAULT 0;
