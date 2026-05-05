/*
  Warnings:

  - A unique constraint covering the columns `[imageId]` on the table `CardVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CardVariant_imageId_key" ON "CardVariant"("imageId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
