/*
  Warnings:

  - You are about to drop the column `cardId` on the `DeckCard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deckId,variantId]` on the table `DeckCard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variantId` to the `DeckCard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DeckCard" DROP CONSTRAINT "DeckCard_cardId_fkey";

-- DropIndex
DROP INDEX "DeckCard_deckId_cardId_key";

-- AlterTable
ALTER TABLE "DeckCard" DROP COLUMN "cardId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_variantId_key" ON "DeckCard"("deckId", "variantId");

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
