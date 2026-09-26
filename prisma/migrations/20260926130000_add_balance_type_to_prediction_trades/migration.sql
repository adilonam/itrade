-- AlterTable
ALTER TABLE "prediction_trades" ADD COLUMN "balance_type" "BalanceType" NOT NULL DEFAULT 'REAL';

-- AlterTable
ALTER TABLE "prediction_balance_ledgers" ADD COLUMN "balance_type" "BalanceType" NOT NULL DEFAULT 'REAL';

-- CreateIndex
CREATE INDEX "prediction_trades_user_id_balance_type_idx" ON "prediction_trades"("user_id", "balance_type");

-- CreateIndex
CREATE INDEX "prediction_trades_user_id_market_id_balance_type_idx" ON "prediction_trades"("user_id", "market_id", "balance_type");

-- CreateIndex
CREATE INDEX "prediction_balance_ledgers_user_id_balance_type_idx" ON "prediction_balance_ledgers"("user_id", "balance_type");
