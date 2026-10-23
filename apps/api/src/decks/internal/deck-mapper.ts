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
        attributes: line.variant.card.attributes,
        rarity: line.variant.card.rarity,
        types: line.variant.card.types.map((ct) => ({
            code: ct.type.code,
            label: ct.type.translations.find(t => t.languageCode === line.languageCode)?.label ?? "",
        })),
        effect: line.variant.card.translations
            .find(t => t.languageCode === line.languageCode)?.effect ?? null,
        triggerEffect: line.variant.card.translations
            .find(t => t.languageCode === line.languageCode)?.triggerEffect ?? null,
        category: line.variant.card.category,
        colors: line.variant.card.colors,
        cost: line.variant.card.cost,
        counterAmount: line.variant.card.counterAmount,
        power: line.variant.card.power,
    };
}

export function mapDeckDetail(deck: DeckDetailWithRelations): DeckDetailDto {
    const base = mapDeckBase(deck);
    const t = deck.leaderVariant.card.translations.find(x => x.languageCode === deck.leaderLanguageCode);
    return {
        ...base,
        leader: {
            ...base.leader,
            power: deck.leaderVariant.card.power,
            life: deck.leaderVariant.card.life,
            effect: t?.effect ?? null,
            types: deck.leaderVariant.card.types.map(ct => ({
                code: ct.type.code,
                label: ct.type.translations.find(x => x.languageCode === deck.leaderLanguageCode)?.label ?? "",
            })),
            attributes: deck.leaderVariant.card.attributes
        },
        cards: deck.cards.map(mapDeckCard)
    }
}