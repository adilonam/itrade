/*
  Warnings:

  - You are about to drop the column `abosulteAmount` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "abosulteAmount",
ADD COLUMN     "absoluteAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
