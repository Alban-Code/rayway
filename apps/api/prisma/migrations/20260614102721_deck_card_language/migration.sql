/*
  Warnings:

  - A unique constraint covering the columns `[deckId,variantId,languageCode]` on the table `DeckCard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leaderLanguageCode` to the `Deck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `languageCode` to the `DeckCard` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DeckCard_deckId_variantId_key";

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "leaderLanguageCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeckCard" ADD COLUMN     "languageCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_variantId_languageCode_key" ON "DeckCard"("deckId", "variantId", "languageCode");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_leaderLanguageCode_fkey" FOREIGN KEY ("leaderLanguageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
