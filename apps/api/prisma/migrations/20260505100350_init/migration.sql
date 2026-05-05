-- CreateEnum
CREATE TYPE "Color" AS ENUM ('Red', 'Blue', 'Green', 'Black', 'Yellow', 'Purple');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('Leader', 'Character', 'Event', 'Stage');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "color" "Color" NOT NULL,
    "cost" INTEGER,
    "power" INTEGER,
    "life" INTEGER,
    "counterAmount" INTEGER,
    "attribute" TEXT,
    "rarity" TEXT NOT NULL,
    "subTypes" TEXT,
    "effect" TEXT,
    "isDon" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardVariant" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "isAlternate" BOOLEAN NOT NULL DEFAULT false,
    "marketPrice" DOUBLE PRECISION,
    "inventoryPrice" DOUBLE PRECISION,

    CONSTRAINT "CardVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTag" (
    "id" SERIAL NOT NULL,
    "cardId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'llm',
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTrigger" (
    "id" SERIAL NOT NULL,
    "cardId" TEXT NOT NULL,
    "hasTrigger" BOOLEAN NOT NULL,
    "effects" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'llm',
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "CardTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "leaderColors" "Color"[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" SERIAL NOT NULL,
    "deckId" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_code_key" ON "Card"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CardTag_cardId_tag_key" ON "CardTag"("cardId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "CardTrigger_cardId_key" ON "CardTrigger"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_cardId_key" ON "DeckCard"("deckId", "cardId");

-- AddForeignKey
ALTER TABLE "CardVariant" ADD CONSTRAINT "CardVariant_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTrigger" ADD CONSTRAINT "CardTrigger_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
