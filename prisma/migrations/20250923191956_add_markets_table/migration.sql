/*
  Warnings:

  - You are about to drop the `verificationtokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MarketType" AS ENUM ('FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES');

-- DropTable
DROP TABLE "public"."verificationtokens";

-- CreateTable
CREATE TABLE "public"."markets" (
    "id" TEXT NOT NULL,
    "type" "public"."MarketType" NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_symbol_key" ON "public"."markets"("symbol");
