import type { Category } from "@/api/cards";
import type { DeckCardDto } from "@/api/decks";

const DECK_CATEGORY_ORDER = ["Character", "Event", "Stage"] as const satisfies readonly Category[];
type DeckCategory = (typeof DECK_CATEGORY_ORDER)[number];

// Counter values printed on One Piece cards. Anything else (null, off-value)
// is not a counter and stays out of the breakdown.
const COUNTER_VALUES = [0, 1000, 2000] as const;

function byCostThenName(a: DeckCardDto, b: DeckCardDto) {
    return (a.cost ?? Infinity) - (b.cost ?? Infinity) || a.name.localeCompare(b.name);
}

export function groupByCategory(cards: DeckCardDto[]): Array<{ category: Category, cards: DeckCardDto[] }> {

    const grouped = new Map<Category, DeckCardDto[]>()
    for (const card of cards) {
        const bucket = grouped.get(card.category)
        if (bucket) bucket.push(card)
        else grouped.set(card.category, [card]);
    }

    return DECK_CATEGORY_ORDER.flatMap((category) => {
        const group = grouped.get(category);
        return group ? [{ category, cards: group.sort(byCostThenName) }] : [];
    });
}

export function costHistogram(cards: DeckCardDto[]) {
    const buckets = []
    for (let i = 0; i < 11; i++) {
        buckets.push({ label: i, count: 0 });
    }

    for (const card of cards) {
        if (card.cost === null) {
            continue;
        }
        buckets[Math.min(card.cost, 10)].count += card.quantity;
    }

    return buckets;
}

export function categoryCounts(cards: DeckCardDto[]): Record<DeckCategory, number> {
    const counts: Record<DeckCategory, number> = { Character: 0, Event: 0, Stage: 0 };

    for (const card of cards) {
        if ((DECK_CATEGORY_ORDER as readonly Category[]).includes(card.category)) {
            counts[card.category as DeckCategory] += card.quantity;
        }
    }

    return counts;
}

export function counterHistogram(cards: DeckCardDto[]) {
    const buckets = COUNTER_VALUES.map((value) => ({ value, count: 0 }));

    for (const card of cards) {
        const index = COUNTER_VALUES.indexOf(card.counterAmount as (typeof COUNTER_VALUES)[number]);
        if (index !== -1) {
            buckets[index].count += card.quantity;
        }
    }

    return buckets;
}