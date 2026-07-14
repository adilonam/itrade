-- KYC documents previously stored Vercel Blob URLs; blob bytes cannot be migrated automatically.
DELETE FROM "kyc_verification_documents";

ALTER TABLE "kyc_verification_documents" DROP COLUMN "file_url";

ALTER TABLE "kyc_verification_documents"
ADD COLUMN "file_content" BYTEA NOT NULL,
ADD COLUMN "content_type" TEXT NOT NULL,
ADD COLUMN "file_name" TEXT;

ALTER TABLE "users" DROP COLUMN "kyc_front_image_url",
DROP COLUMN "kyc_back_image_url",
DROP COLUMN "kyc_selfie_url",
DROP COLUMN "kyc_utility_bill_url";
