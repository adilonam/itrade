-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "stop_loss" DOUBLE PRECISION,
ADD COLUMN     "take_profit" DOUBLE PRECISION;
