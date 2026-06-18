import { buildImageUrl } from "../../common/image-url.js";
import { DeckDetailDto, DeckListItemDto } from "../dto/deck-response.dto.js";
import { DeckDetailWithRelations, DeckWithRelations } from "./deck-include.js";

export function mapDeck(deck: DeckWithRelations): DeckListItemDto {
    return {
        id: deck.id,
        cardCount: deck.cards.reduce((acc, c) => acc + c.quantity, 0),
        description: deck.description,
        name: deck.name,
        isPublic: deck.isPublic,
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

export function mapDeckDetail(deck: DeckDetailWithRelations): DeckDetailDto {
    return {
        id: deck.id,
        isPublic: deck.isPublic
    }
}