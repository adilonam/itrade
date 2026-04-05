-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "app_name" TEXT NOT NULL DEFAULT 'Trade Nova';
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "google_client_id" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "google_client_secret" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "twelve_data_api_key_public" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "twelve_data_api_key" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_host" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_port" TEXT NOT NULL DEFAULT '587';
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_secure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_user" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_password" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smtp_from_email" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "min_margin_level" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "alpha_vantage_api_key" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "blob_read_write_token" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "nowpayments_api_key" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "nowpayments_ipn_secret" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "manual_usdt_deposit_wallet_address" TEXT;

INSERT INTO "app_settings" ("id", "app_name", "open_market", "smtp_port", "smtp_secure", "min_margin_level", "created_at", "updated_at")
SELECT 'default', 'Trade Nova', true, '587', false, 100, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "app_settings" WHERE "id" = 'default');
