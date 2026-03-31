-- CreateEnum
CREATE TYPE "KycVerificationRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocumentKind" AS ENUM ('FRONT', 'BACK', 'SELFIE', 'UTILITY_BILL');

-- CreateTable
CREATE TABLE "kyc_verification_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "status" "KycVerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,

    CONSTRAINT "kyc_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verification_documents" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "kind" "KycDocumentKind" NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_verification_requests_user_id_idx" ON "kyc_verification_requests"("user_id");

-- CreateIndex
CREATE INDEX "kyc_verification_requests_status_idx" ON "kyc_verification_requests"("status");

-- CreateIndex
CREATE INDEX "kyc_verification_documents_request_id_idx" ON "kyc_verification_documents"("request_id");

-- AddForeignKey
ALTER TABLE "kyc_verification_requests" ADD CONSTRAINT "kyc_verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verification_requests" ADD CONSTRAINT "kyc_verification_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verification_documents" ADD CONSTRAINT "kyc_verification_documents_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "kyc_verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
