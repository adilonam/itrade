/*
  Warnings:

  - You are about to drop the column `amount` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "amount",
ADD COLUMN     "abosulteAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
