-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SELLER';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "seller_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
