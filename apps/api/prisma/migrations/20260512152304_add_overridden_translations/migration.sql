-- AlterTable
ALTER TABLE "CardTranslation" ADD COLUMN     "overridden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TypeTranslation" ADD COLUMN     "overridden" BOOLEAN NOT NULL DEFAULT false;
