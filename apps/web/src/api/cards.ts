import { api } from "./client";

export const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" }
] as const
export type LangCode = typeof LANGUAGES[number]["code"]

export function isLang(value: string): value is LangCode {
    return (LANGUAGES.map(({ code }) => code) as string[]).includes(value)
}

export const COLORS = ["Red", "Green", "Blue", "Purple", "Yellow", "Black"] as const;
export type Color = typeof COLORS[number];

export function isColor(value: string): value is Color {
    return (COLORS as readonly string[]).includes(value)
}

export const CATEGORIES = ["Leader", "Character", "Event", "Stage", "Don"] as const;
export type Category = typeof CATEGORIES[number];

export function isCategory(value: string): value is Category {
    return (CATEGORIES as readonly string[]).includes(value)
}

export const RARITIES = ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'P', 'TR', 'SP'] as const;
export type Rarity = typeof RARITIES[number];

export const ATTRIBUTES = ['Slash', 'Strike', 'Ranged', 'Special', 'Wisdom'] as const;

export type Attribute = typeof ATTRIBUTES[number];

export function isAttribute(value: string): value is Attribute {
    return (ATTRIBUTES as readonly string[]).includes(value)
}

export const VariantType = {
    Regular: 'Regular',
    Parallel: 'Parallel',
    Reprint: 'Reprint'
} as const

export type VariantType = (typeof VariantType)[keyof typeof VariantType]

export const COSTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type Cost = typeof COSTS[number]

export function isCost(value: number): value is Cost {
    return (COSTS as readonly number[]).includes(value)
}

export const COUNTERS = [0, 1000, 2000] as const
export type Counter = typeof COUNTERS[number]

export function isCounter(value: number): value is Counter {
    return (COUNTERS as readonly number[]).includes(value)
}

export const PAGE_SIZES = [24, 30, 36, 48]
export type PageSize = (typeof PAGE_SIZES)[number]
export const DEFAULT_PAGE_SIZE = 30 satisfies PageSize

export function isPageSize(n: number): n is PageSize {
    return (PAGE_SIZES as readonly number[]).includes(n)
}

export type CardTypeDto = {
    code: string;
    label: string;
}

export type CardVariantDto = {
    variantCode: string;
    variantType: VariantType;
    isPromo: boolean;
    isStarter: boolean;
    imageUrl: string | null;
}

export type CardListItemDto = {
    code: string
    name: string
    category: Category
    colors: Color[];
    cost: number | null;
    counterAmount: number | null;
    power: number | null;
    life: number | null;
    attributes: Attribute[];
    rarity: Rarity;
    types: CardTypeDto[];
    effect: string | null;
    triggerEffect: string | null;
    variants: CardVariantDto[];
    setCode: string;
    language: string;

}

export type PaginatedCardsDto = {
    items: CardListItemDto[];
    total: number;
    page: number;
    limit: number;
}

export type CardListParams = {
    page?: number
    limit?: number
    lang?: string
    colors?: Color[]
    category?: Category,
    q?: string,
    attribute?: Attribute,
    types?: string[],
    costs?: number[],
    counters?: number[]
}

export async function fetchCards(params: CardListParams = {}): Promise<PaginatedCardsDto> {
    const queryString = new URLSearchParams()
    if (params.page !== undefined) queryString.set('page', String(params.page))
    if (params.limit !== undefined) queryString.set('limit', String(params.limit))
    if (params.lang !== undefined) queryString.set('lang', params.lang)

    if (params.colors !== undefined && params.colors.length > 0) {
        params.colors.forEach(c => queryString.append('colors', c))
    }

    if (params.category !== undefined) queryString.set('category', params.category)

    if (params.attribute !== undefined) queryString.set('attribute', params.attribute)

    if (params.q) queryString.set('q', params.q)

    if (params.types !== undefined && params.types.length > 0) {
        params.types.forEach((type) => queryString.append('types', type))
    }

    if (params.costs !== undefined && params.costs.length > 0) {
        params.costs.forEach(c => queryString.append('costs', String(c)))
    }

    if (params.counters !== undefined && params.counters.length > 0) {
        params.counters.forEach(c => queryString.append('counters', String(c)))
    }

    const path = `/cards${queryString.toString() ? `?${queryString}` : ''}`

    return api<PaginatedCardsDto>(path)
}

export async function fetchCard(code: string, lang?: string): Promise<CardListItemDto> {
    const qs = lang && lang !== "en" ? `?lang=${lang}` : ''
    const path = `/cards/${code}${qs}`

    return api<CardListItemDto>(path)
}

