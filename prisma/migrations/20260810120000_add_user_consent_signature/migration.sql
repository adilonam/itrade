-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN "has_signed_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "consent_signed_at" TIMESTAMP(3),
ADD COLUMN "consent_signature_name" TEXT,
ADD COLUMN "consent_signature_content" BYTEA,
ADD COLUMN "consent_signature_content_type" TEXT,
ADD COLUMN "consent_ip_address" TEXT;
