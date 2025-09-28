/*
  Warnings:

  - You are about to drop the column `amount` on the `transactions` table. All the data in the column will be lost.
  - Made the column `quantity` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "amount",
ALTER COLUMN "quantity" SET NOT NULL;
