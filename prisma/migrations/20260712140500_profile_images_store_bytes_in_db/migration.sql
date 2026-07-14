-- Existing hosted profile image URLs cannot be migrated because the bytes are
-- not available to the migration.
UPDATE "users"
SET "image" = NULL
WHERE "image" LIKE 'https://%.public.%vercel-storage.com/%';

ALTER TABLE "users"
ADD COLUMN "profile_image_content" BYTEA,
ADD COLUMN "profile_image_content_type" TEXT,
ADD COLUMN "profile_image_file_name" TEXT;
