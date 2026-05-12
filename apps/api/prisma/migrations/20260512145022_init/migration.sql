-- CreateEnum
CREATE TYPE "Color" AS ENUM ('Red', 'Blue', 'Green', 'Black', 'Yellow', 'Purple');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Leader', 'Character', 'Event', 'Stage', 'Don');

-- CreateEnum
CREATE TYPE "Attribute" AS ENUM ('Slash', 'Strike', 'Ranged', 'Special', 'Wisdom');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('C', 'UC', 'R', 'SR', 'SEC', 'L', 'P', 'TR', 'SP');

-- CreateEnum
CREATE TYPE "LegalityStatus" AS ENUM ('Legal', 'Restricted', 'Limited', 'Banned');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('Llm', 'Human', 'Official');

-- CreateEnum
CREATE TYPE "TagScope" AS ENUM ('Main', 'Trigger');

-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('Regular', 'Parallel', 'Reprint');

-- CreateEnum
CREATE TYPE "TagKind" AS ENUM ('Keyword', 'Semantic');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "Language" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardSet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "colors" "Color"[],
    "cost" INTEGER,
    "power" INTEGER,
    "life" INTEGER,
    "counterAmount" INTEGER,
    "attributes" "Attribute"[],
    "rarity" "Rarity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "setId" TEXT NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTranslation" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effect" TEXT,
    "triggerEffect" TEXT,

    CONSTRAINT "CardTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardVariant" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "variantCode" TEXT NOT NULL,
    "variantType" "VariantType" NOT NULL DEFAULT 'Regular',
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "marketPrice" DOUBLE PRECISION,
    "inventoryPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardVariantImage" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "CardVariantImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeTranslation" (
    "id" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TypeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardType" (
    "cardId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CardType_pkey" PRIMARY KEY ("cardId","typeId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "TagKind" NOT NULL DEFAULT 'Semantic',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagTranslation" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TagTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTag" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "scope" "TagScope" NOT NULL DEFAULT 'Main',
    "source" "TagSource" NOT NULL DEFAULT 'Llm',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Format" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatTranslation" (
    "id" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "FormatTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatLegality" (
    "id" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "status" "LegalityStatus" NOT NULL DEFAULT 'Legal',
    "maxCopies" INTEGER,
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "FormatLegality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formatId" TEXT,
    "leaderVariantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "cardsUpserted" INTEGER NOT NULL DEFAULT 0,
    "variantsUpserted" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_code_key" ON "CardSet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Card_code_key" ON "Card"("code");

-- CreateIndex
CREATE INDEX "Card_category_idx" ON "Card"("category");

-- CreateIndex
CREATE INDEX "Card_setId_idx" ON "Card"("setId");

-- CreateIndex
CREATE INDEX "CardTranslation_languageCode_idx" ON "CardTranslation"("languageCode");

-- CreateIndex
CREATE INDEX "CardTranslation_name_idx" ON "CardTranslation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CardTranslation_cardId_languageCode_key" ON "CardTranslation"("cardId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "CardVariant_variantCode_key" ON "CardVariant"("variantCode");

-- CreateIndex
CREATE INDEX "CardVariant_cardId_idx" ON "CardVariant"("cardId");

-- CreateIndex
CREATE INDEX "CardVariant_variantType_idx" ON "CardVariant"("variantType");

-- CreateIndex
CREATE UNIQUE INDEX "CardVariantImage_variantId_languageCode_key" ON "CardVariantImage"("variantId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "Type_code_key" ON "Type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TypeTranslation_typeId_languageCode_key" ON "TypeTranslation"("typeId", "languageCode");

-- CreateIndex
CREATE INDEX "CardType_typeId_idx" ON "CardType"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "CardType_cardId_order_key" ON "CardType"("cardId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_code_key" ON "Tag"("code");

-- CreateIndex
CREATE INDEX "Tag_kind_idx" ON "Tag"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "TagTranslation_tagId_languageCode_key" ON "TagTranslation"("tagId", "languageCode");

-- CreateIndex
CREATE INDEX "CardTag_tagId_scope_idx" ON "CardTag"("tagId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "CardTag_cardId_tagId_scope_key" ON "CardTag"("cardId", "tagId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Format_code_key" ON "Format"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FormatTranslation_formatId_languageCode_key" ON "FormatTranslation"("formatId", "languageCode");

-- CreateIndex
CREATE INDEX "FormatLegality_cardId_formatId_idx" ON "FormatLegality"("cardId", "formatId");

-- CreateIndex
CREATE UNIQUE INDEX "FormatLegality_formatId_cardId_effectiveAt_key" ON "FormatLegality"("formatId", "cardId", "effectiveAt");

-- CreateIndex
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");

-- CreateIndex
CREATE INDEX "Deck_formatId_idx" ON "Deck"("formatId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_variantId_key" ON "DeckCard"("deckId", "variantId");

-- CreateIndex
CREATE INDEX "CollectionItem_userId_idx" ON "CollectionItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_userId_variantId_languageCode_key" ON "CollectionItem"("userId", "variantId", "languageCode");

-- CreateIndex
CREATE INDEX "IngestionRun_source_status_finishedAt_idx" ON "IngestionRun"("source", "status", "finishedAt");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CardSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTranslation" ADD CONSTRAINT "CardTranslation_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTranslation" ADD CONSTRAINT "CardTranslation_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVariant" ADD CONSTRAINT "CardVariant_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVariantImage" ADD CONSTRAINT "CardVariantImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CardVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVariantImage" ADD CONSTRAINT "CardVariantImage_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeTranslation" ADD CONSTRAINT "TypeTranslation_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeTranslation" ADD CONSTRAINT "TypeTranslation_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardType" ADD CONSTRAINT "CardType_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardType" ADD CONSTRAINT "CardType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagTranslation" ADD CONSTRAINT "TagTranslation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagTranslation" ADD CONSTRAINT "TagTranslation_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatTranslation" ADD CONSTRAINT "FormatTranslation_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatTranslation" ADD CONSTRAINT "FormatTranslation_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatLegality" ADD CONSTRAINT "FormatLegality_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatLegality" ADD CONSTRAINT "FormatLegality_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_leaderVariantId_fkey" FOREIGN KEY ("leaderVariantId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CardVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
