-- AlterTable
ALTER TABLE "public"."app_settings" ADD COLUMN     "high_contrast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme_color" TEXT NOT NULL DEFAULT 'green',
ADD COLUMN     "theme_mode" TEXT NOT NULL DEFAULT 'system';
