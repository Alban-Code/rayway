import type { DeckCardDto } from "@/api/decks";
import { categoryCounts, costHistogram, counterHistogram, groupByCategory } from "./deckGrouping";

// Forge a minimal deck card: only the fields the functions read
// (category, cost, name, quantity, counterAmount). Everything else via `as`.
function card(overrides: Partial<DeckCardDto>): DeckCardDto {
    return { name: "", category: "Character", cost: 1, quantity: 1, ...overrides } as DeckCardDto;
}

describe("groupByCategory", () => {

    it("orders sections Character, Event, Stage regardless of input order", () => {
        const cards = [
            card({ category: "Stage" }),
            card({ category: "Event" }),
            card({ category: "Character" }),
        ];
        expect(groupByCategory(cards).map((g) => g.category)).toEqual(["Character", "Event", "Stage"]);
    });

    it("omits empty categories", () => {
        const result = groupByCategory([card({ category: "Character" })]);
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe("Character");
    });

    it("drops cards whose category is not a deck category (Leader/Don)", () => {
        // The type allows any Category, but only Character/Event/Stage are deck lines.
        const cards = [card({ category: "Leader" }), card({ category: "Character" })];
        expect(groupByCategory(cards).map((g) => g.category)).toEqual(["Character"]);
    });

    it("sorts cards within a section by cost then name", () => {
        const cards = [
            card({ category: "Character", cost: 3, name: "Zoro" }),
            card({ category: "Character", cost: 1, name: "Nami" }),
            card({ category: "Character", cost: 1, name: "Bepo" }),
        ];
        const names = groupByCategory(cards)[0].cards.map((c) => c.name);
        expect(names).toEqual(["Bepo", "Nami", "Zoro"]);
    });

    it("places null-cost cards last within a section", () => {
        const cards = [
            card({ category: "Character", cost: null, name: "Aaa" }),
            card({ category: "Character", cost: 2, name: "Zzz" }),
        ];
        const names = groupByCategory(cards)[0].cards.map((c) => c.name);
        expect(names).toEqual(["Zzz", "Aaa"]);
    });
});

describe("costHistogram", () => {

    it("returns 11 buckets labeled 0..10, all zero for empty input", () => {
        const result = costHistogram([]);
        expect(result).toHaveLength(11);
        expect(result.map((b) => b.label)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(result.every((b) => b.count === 0)).toBe(true);
    });

    it("sums quantities into the matching cost bucket", () => {
        const cards = [
            card({ cost: 2, quantity: 4 }),
            card({ cost: 2, quantity: 1 }),
        ];
        expect(costHistogram(cards)[2].count).toBe(5);
    });

    it("keeps empty buckets at zero (holes are visible)", () => {
        const result = costHistogram([card({ cost: 3, quantity: 2 })]);
        expect(result[3].count).toBe(2);
        expect(result[4].count).toBe(0);
    });

    it("clamps cost above 10 into the bucket 10", () => {
        expect(costHistogram([card({ cost: 12, quantity: 3 })])[10].count).toBe(3);
    });

    it("skips null-cost cards without counting them", () => {
        const result = costHistogram([card({ cost: null, quantity: 4 })]);
        expect(result.every((b) => b.count === 0)).toBe(true);
    });
});

describe("categoryCounts", () => {

    it("sums quantities per deck category", () => {
        const cards = [
            card({ category: "Character", quantity: 4 }),
            card({ category: "Character", quantity: 2 }),
            card({ category: "Event", quantity: 3 }),
        ];
        expect(categoryCounts(cards)).toEqual({ Character: 6, Event: 3, Stage: 0 });
    });

    it("ignores non-deck categories (Leader/Don)", () => {
        const cards = [card({ category: "Leader", quantity: 1 }), card({ category: "Stage", quantity: 2 })];
        expect(categoryCounts(cards)).toEqual({ Character: 0, Event: 0, Stage: 2 });
    });
});

describe("counterHistogram", () => {

    it("returns the three counter buckets 0/1000/2000, zeroed for empty input", () => {
        const result = counterHistogram([]);
        expect(result.map((b) => b.value)).toEqual([0, 1000, 2000]);
        expect(result.every((b) => b.count === 0)).toBe(true);
    });

    it("sums quantities into the matching counter bucket", () => {
        const cards = [
            card({ counterAmount: 1000, quantity: 4 }),
            card({ counterAmount: 1000, quantity: 2 }),
            card({ counterAmount: 2000, quantity: 3 }),
        ];
        const result = counterHistogram(cards);
        expect(result[1]).toEqual({ value: 1000, count: 6 });
        expect(result[2]).toEqual({ value: 2000, count: 3 });
    });

    it("skips cards with no counter value (null or off-value)", () => {
        const cards = [card({ counterAmount: null, quantity: 4 }), card({ counterAmount: 1500, quantity: 2 })];
        expect(counterHistogram(cards).every((b) => b.count === 0)).toBe(true);
    });
});
