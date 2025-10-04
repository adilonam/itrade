-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "room" "public"."Room" NOT NULL DEFAULT 'TRADING';
