/*
  Warnings:

  - You are about to drop the column `used_margin` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."positions" ADD COLUMN     "required_margin" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "used_margin";

