/*
  Warnings:

  - You are about to drop the column `alpha_vantage_api_key` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `app_icon` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `app_name` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `google_client_id` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `google_client_secret` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `min_margin_level` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `nowpayments_api_key` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `nowpayments_ipn_secret` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_from_email` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_host` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_password` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_port` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_secure` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtp_user` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `twelve_data_api_key` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `twelve_data_api_key_public` on the `app_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_settings" DROP COLUMN "alpha_vantage_api_key",
DROP COLUMN "app_icon",
DROP COLUMN "app_name",
DROP COLUMN "google_client_id",
DROP COLUMN "google_client_secret",
DROP COLUMN "min_margin_level",
DROP COLUMN "nowpayments_api_key",
DROP COLUMN "nowpayments_ipn_secret",
DROP COLUMN "smtp_from_email",
DROP COLUMN "smtp_host",
DROP COLUMN "smtp_password",
DROP COLUMN "smtp_port",
DROP COLUMN "smtp_secure",
DROP COLUMN "smtp_user",
DROP COLUMN "twelve_data_api_key",
DROP COLUMN "twelve_data_api_key_public";
