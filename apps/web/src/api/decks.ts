import type { Attribute, CardTypeDto, CardVariantDto, Category, Color, Rarity } from "./cards";
import { api } from "./client";


// Type vers le backend
export type DeckLeaderInputDto = {
    variantCode: string;
    languageCode: string;
}

export type DeckCardInputDto = {
    variantCode: string;
    languageCode: string;
    quantity: number;
}

export type CreateDeckDto = {
    name: string;
    description?: string;
    isPublic?: boolean;
    leader: DeckLeaderInputDto;
    cards: DeckCardInputDto[];
}


// Type retour du backend
export type DeckLeaderDto = {
    variantCode: string;
    name: string;
    languageCode: string;
    imageUrl: string | null;
    colors: Color[];
}

export type DeckLeaderDetailDto = DeckLeaderDto & {
    attributes: Attribute[];
    types: CardTypeDto[];
    effect: string | null;
    power: number | null;
    life: number | null;
}

export type DeckCardDto = {
    name: string;
    languageCode: string;
    variant: CardVariantDto;
    quantity: number;
    attributes: Attribute[];
    rarity: Rarity;
    types: CardTypeDto[];
    effect: string | null;
    triggerEffect: string | null;
    category: Category;
    colors: Color[];
    cost: number | null;
    counterAmount: number | null;
    power: number | null;
}

export type DeckListItemDto = {
    id: string;
    name: string;
    description: string | null;
    leader: DeckLeaderDto;
    isPublic: boolean;
    cardCount: number;
    createdAt: string;
    updatedAt: string;
}

export type PaginatedDecksDto = {
    items: DeckListItemDto[];
    total: number;
    page: number;
    limit: number;
}

export type DeckDetailDto = DeckListItemDto & {
    leader: DeckLeaderDetailDto;
    cards: DeckCardDto[];
}

export type DeckListParams = {
    colors?: Color[];
    q?: string;
    page?: number;
    limit?: number;
}

export async function fetchDecks(params: DeckListParams = {}): Promise<PaginatedDecksDto> {
    const queryString = new URLSearchParams()
    if (params.page !== undefined) queryString.set('page', String(params.page))
    if (params.limit !== undefined) queryString.set('limit', String(params.limit))
    if (params.colors !== undefined && params.colors.length > 0) {
        params.colors.forEach(c => queryString.append('colors', c))
    }
    if (params.q) queryString.set('q', params.q)

    const path = `/decks${queryString.toString() ? `?${queryString}` : ''}`;

    return api<PaginatedDecksDto>(path);
}

export async function fetchDeck(deckId: string): Promise<DeckDetailDto> {
    const path = `/decks/${deckId}`;
    return api<DeckDetailDto>(path);
}