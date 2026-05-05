/*
  Warnings:

  - You are about to drop the column `color` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "color",
ADD COLUMN     "colors" "Color"[];
