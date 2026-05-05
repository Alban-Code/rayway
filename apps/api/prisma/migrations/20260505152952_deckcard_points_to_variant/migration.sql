-- DropForeignKey
ALTER TABLE "DeckCard" DROP CONSTRAINT "DeckCard_cardId_fkey";

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
