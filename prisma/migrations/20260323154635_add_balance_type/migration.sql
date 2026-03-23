-- CreateEnum
CREATE TYPE "BalanceType" AS ENUM ('REAL', 'DEMO', 'INSTITUTIONAL');

-- CreateTable
CREATE TABLE "user_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BalanceType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_balances_user_id_type_key" ON "user_balances"("user_id", "type");

-- AddForeignKey
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
