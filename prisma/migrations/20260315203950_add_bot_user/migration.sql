-- CreateEnum
CREATE TYPE "Bot" AS ENUM ('RSI');

-- CreateTable
CREATE TABLE "bot_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot" "Bot" NOT NULL,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_stop" TIMESTAMP(3) NOT NULL,
    "quantity_lot" DOUBLE PRECISION NOT NULL,
    "market_id" TEXT NOT NULL,
    "bot_params" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_users_user_id_idx" ON "bot_users"("user_id");

-- CreateIndex
CREATE INDEX "bot_users_market_id_idx" ON "bot_users"("market_id");

-- AddForeignKey
ALTER TABLE "bot_users" ADD CONSTRAINT "bot_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_users" ADD CONSTRAINT "bot_users_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
