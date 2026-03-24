-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "kyc_back_image_url" TEXT,
ADD COLUMN     "kyc_document_type" TEXT,
ADD COLUMN     "kyc_front_image_url" TEXT,
ADD COLUMN     "kyc_selfie_url" TEXT,
ADD COLUMN     "kyc_status" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ADD COLUMN     "kyc_utility_bill_url" TEXT;
