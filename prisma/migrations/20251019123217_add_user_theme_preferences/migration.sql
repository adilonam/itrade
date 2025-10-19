-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "high_contrast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme_color" TEXT DEFAULT 'default',
ADD COLUMN     "theme_mode" TEXT DEFAULT 'system';
