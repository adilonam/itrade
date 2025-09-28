-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "closed_price" DOUBLE PRECISION,
ADD COLUMN     "executed_price" DOUBLE PRECISION;
