import { buildImageUrl } from "../../common/image-url.js";
import { DeckCardDto, DeckDetailDto, DeckListItemDto } from "../dto/deck-response.dto.js";
import { DeckDetailWithRelations, DeckWithRelations } from "./deck-include.js";

type DeckBaseInput = {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    leaderVariant: DeckWithRelations["leaderVariant"];
    leaderLanguageCode: string;
    cards: { quantity: number }[];
    createdAt: Date;
    updatedAt: Date;
};

function mapDeckBase(deck: DeckBaseInput) {
    return {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        isPublic: deck.isPublic,
        cardCount: deck.cards.reduce((acc, c) => acc + c.quantity, 0),
        leader: {
            name: deck.leaderVariant.card.translations.find(t => t.languageCode === deck.leaderLanguageCode)?.name ?? "",
            imageUrl: buildImageUrl(deck.leaderVariant.images.find(i => i.languageCode === deck.leaderLanguageCode)?.storageKey),
            colors: deck.leaderVariant.card.colors,
            languageCode: deck.leaderLanguageCode,
            variantCode: deck.leaderVariant.variantCode
        },
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt
    }
}

export function mapDeck(deck: DeckWithRelations): DeckListItemDto {
    return mapDeckBase(deck);
}

function mapDeckCard(line: DeckDetailWithRelations["cards"][number]): DeckCardDto {
    return {
        languageCode: line.languageCode,
        quantity: line.quantity,
        name: line.variant.card.translations
            .find(t => t.languageCode === line.languageCode)?.name ?? "",
        variant: {
            variantCode: line.variant.variantCode,
            variantType: line.variant.variantType,
            isPromo: line.variant.isPromo,
            isStarter: line.variant.isStarter,
            imageUrl: buildImageUrl(line.variant.images
                .find(i => i.languageCode === line.languageCode)?.storageKey),
        },
    };
}

export function mapDeckDetail(deck: DeckDetailWithRelations): DeckDetailDto {
    return {
        ...mapDeckBase(deck),
        cards: deck.cards.map(mapDeckCard)
    }
}