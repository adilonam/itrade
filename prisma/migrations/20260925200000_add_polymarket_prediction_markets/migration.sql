-- CreateEnum
CREATE TYPE "PredictionMarketCategory" AS ENUM ('politics', 'crypto', 'sports', 'finance', 'tech', 'entertainment', 'world', 'commodities');

-- CreateEnum
CREATE TYPE "PredictionMarketStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "PredictionOutcomeType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "PredictionTradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "PredictionOrderType" AS ENUM ('MARKET');

-- CreateEnum
CREATE TYPE "PredictionBalanceLedgerType" AS ENUM ('trade_buy', 'trade_sell', 'market_win', 'market_loss', 'seed', 'adjustment');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "prediction_avatar" BYTEA,
ADD COLUMN     "prediction_avatar_mime_type" TEXT,
ADD COLUMN     "prediction_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "signup_token_hash" TEXT,
    "signup_token_expires_at" TIMESTAMP(3),
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_market_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_market_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_markets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" TEXT,
    "category" "PredictionMarketCategory" NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT[],
    "status" "PredictionMarketStatus" NOT NULL DEFAULT 'open',
    "winning_outcome" "PredictionOutcomeType",
    "resolution_date" TIMESTAMP(3) NOT NULL,
    "date_label" TEXT,
    "total_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trending_score" INTEGER NOT NULL DEFAULT 0,
    "icon_label" TEXT,
    "image" BYTEA,
    "image_mime_type" TEXT,
    "group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_outcomes" (
    "id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "type" "PredictionOutcomeType" NOT NULL,
    "current_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_trades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "side" "PredictionTradeSide" NOT NULL,
    "order_type" "PredictionOrderType" NOT NULL DEFAULT 'MARKET',
    "amount" DOUBLE PRECISION NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "price_at_trade" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_balance_ledgers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "type" "PredictionBalanceLedgerType" NOT NULL,
    "market_id" TEXT,
    "trade_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_balance_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_price_history" (
    "id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_order_book_levels" (
    "id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "outcome_type" "PredictionOutcomeType" NOT NULL,
    "side" "PredictionTradeSide" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_order_book_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_otps_email_key" ON "email_otps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_otps_signup_token_hash_key" ON "email_otps"("signup_token_hash");

-- CreateIndex
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_market_groups_slug_key" ON "prediction_market_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_markets_slug_key" ON "prediction_markets"("slug");

-- CreateIndex
CREATE INDEX "prediction_markets_category_idx" ON "prediction_markets"("category");

-- CreateIndex
CREATE INDEX "prediction_markets_status_idx" ON "prediction_markets"("status");

-- CreateIndex
CREATE INDEX "prediction_markets_group_id_idx" ON "prediction_markets"("group_id");

-- CreateIndex
CREATE INDEX "prediction_markets_resolution_date_idx" ON "prediction_markets"("resolution_date");

-- CreateIndex
CREATE INDEX "prediction_markets_trending_score_idx" ON "prediction_markets"("trending_score");

-- CreateIndex
CREATE INDEX "prediction_markets_category_status_idx" ON "prediction_markets"("category", "status");

-- CreateIndex
CREATE INDEX "prediction_outcomes_market_id_idx" ON "prediction_outcomes"("market_id");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_outcomes_market_id_type_key" ON "prediction_outcomes"("market_id", "type");

-- CreateIndex
CREATE INDEX "prediction_trades_user_id_idx" ON "prediction_trades"("user_id");

-- CreateIndex
CREATE INDEX "prediction_trades_market_id_idx" ON "prediction_trades"("market_id");

-- CreateIndex
CREATE INDEX "prediction_trades_outcome_id_idx" ON "prediction_trades"("outcome_id");

-- CreateIndex
CREATE INDEX "prediction_trades_created_at_idx" ON "prediction_trades"("created_at");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_user_id_idx" ON "prediction_balance_ledgers"("user_id");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_created_at_idx" ON "prediction_balance_ledgers"("created_at");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_user_id_created_at_idx" ON "prediction_balance_ledgers"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_market_id_idx" ON "prediction_balance_ledgers"("market_id");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_trade_id_idx" ON "prediction_balance_ledgers"("trade_id");

-- CreateIndex
CREATE INDEX "prediction_comments_market_id_idx" ON "prediction_comments"("market_id");

-- CreateIndex
CREATE INDEX "prediction_comments_user_id_idx" ON "prediction_comments"("user_id");

-- CreateIndex
CREATE INDEX "prediction_comments_parent_id_idx" ON "prediction_comments"("parent_id");

-- CreateIndex
CREATE INDEX "prediction_comments_created_at_idx" ON "prediction_comments"("created_at");

-- CreateIndex
CREATE INDEX "prediction_price_history_market_id_timestamp_idx" ON "prediction_price_history"("market_id", "timestamp");

-- CreateIndex
CREATE INDEX "prediction_price_history_outcome_id_timestamp_idx" ON "prediction_price_history"("outcome_id", "timestamp");

-- CreateIndex
CREATE INDEX "prediction_order_book_levels_market_id_idx" ON "prediction_order_book_levels"("market_id");

-- CreateIndex
CREATE INDEX "prediction_order_book_levels_market_id_outcome_type_side_idx" ON "prediction_order_book_levels"("market_id", "outcome_type", "side");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "prediction_markets" ADD CONSTRAINT "prediction_markets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "prediction_market_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_outcomes" ADD CONSTRAINT "prediction_outcomes_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_trades" ADD CONSTRAINT "prediction_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_trades" ADD CONSTRAINT "prediction_trades_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_trades" ADD CONSTRAINT "prediction_trades_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "prediction_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_balance_ledgers" ADD CONSTRAINT "prediction_balance_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_balance_ledgers" ADD CONSTRAINT "prediction_balance_ledgers_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_balance_ledgers" ADD CONSTRAINT "prediction_balance_ledgers_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "prediction_trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_comments" ADD CONSTRAINT "prediction_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_comments" ADD CONSTRAINT "prediction_comments_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_comments" ADD CONSTRAINT "prediction_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "prediction_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_price_history" ADD CONSTRAINT "prediction_price_history_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_price_history" ADD CONSTRAINT "prediction_price_history_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "prediction_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_order_book_levels" ADD CONSTRAINT "prediction_order_book_levels_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
