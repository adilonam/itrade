-- App display name is configured via NEXT_PUBLIC_APP_NAME
ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "app_name";
