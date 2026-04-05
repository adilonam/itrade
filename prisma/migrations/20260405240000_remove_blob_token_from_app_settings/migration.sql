-- Blob uploads use BLOB_READ_WRITE_TOKEN env only (not app_settings).
ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "blob_read_write_token";
