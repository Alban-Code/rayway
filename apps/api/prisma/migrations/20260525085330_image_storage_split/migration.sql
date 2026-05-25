/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `CardVariantImage` table. All the data in the column will be lost.
  - Added the required column `sourceUrl` to the `CardVariantImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `CardVariantImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CardVariantImage" DROP COLUMN "imageUrl",
ADD COLUMN     "sourceUrl" TEXT NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL;
