/*
  Warnings:

  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PositionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."PositionStatus" AS ENUM ('PLACED', 'CLOSED', 'FAILED', 'PENDING');

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_market_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- DropTable
DROP TABLE "public"."transactions";

-- DropEnum
DROP TYPE "public"."TransactionStatus";

-- DropEnum
DROP TYPE "public"."TransactionType";

-- CreateTable
CREATE TABLE "public"."positions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."PositionType" NOT NULL,
    "status" "public"."PositionStatus" NOT NULL DEFAULT 'PENDING',
    "room" "public"."Room" NOT NULL DEFAULT 'TRADING',
    "market_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "executed_price" DOUBLE PRECISION,
    "closed_price" DOUBLE PRECISION,
    "take_profit" DOUBLE PRECISION,
    "stop_loss" DOUBLE PRECISION,
    "description" TEXT,
    "executed_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "pnl" DOUBLE PRECISION,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
