import { BadRequestException } from "@nestjs/common";
import { Category, Color } from "../../generated/prisma/enums.js";
import { ResolvedVariant } from "./deck-include.js";
import { assertDeckRules } from "./deck-rules.js";

function variant(cardId: string, category: Category, colors: Color[]): ResolvedVariant {
    return { cardId, card: { id: cardId, code: cardId, category, colors } } as ResolvedVariant;
}

const line = (v: ResolvedVariant, quantity: number) => ({ variant: v, quantity, languageCode: "en" });

const leaderRed = variant("LEADER", Category.Leader, [Color.Red]);
const redChar = (id: string) => variant(id, Category.Character, [Color.Red]);

describe("assertDeckRules", () => {

    it("mono-color leader deck accepted", () => {
        const lines = [line(redChar("A"), 4), line(redChar("B"), 3)]
        expect(() => assertDeckRules(leaderRed, lines)).not.toThrow();
    });

    it("rejects a leader that is not of category Leader", () => {
        const fakeLeader = variant("X", Category.Character, [Color.Red]);
        expect(() => assertDeckRules(fakeLeader, [])).toThrow(BadRequestException);
    });

    it("rejects a card whose color is not shared with the leader", () => {
        const blueCard = variant("B", Category.Character, [Color.Blue]);
        // several rules exist here → assert the message via regex
        expect(() => assertDeckRules(leaderRed, [line(blueCard, 1)]))
            .toThrow(/different color/);
    });

    it("counts copies per cardId across variants", () => {
        const base = variant("OP01-016", Category.Character, [Color.Red]);
        const para = variant("OP01-016", Category.Character, [Color.Red]); // same cardId
        // 3 + 1 = 4 → ok
        expect(() => assertDeckRules(leaderRed, [line(base, 3), line(para, 1)])).not.toThrow();
        // 3 + 2 = 5 → throw
        expect(() => assertDeckRules(leaderRed, [line(base, 3), line(para, 2)]))
            .toThrow(/more than 4/);
    });

    // Documented rule gaps (shown as "todo" in the report)
    it("rejects a Don!! card among the deck lines", () => {
        const base = variant("OP01-016", Category.Character, [Color.Red]);
        const don = variant("Don", Category.Don, []); // Don!! card have no color
        expect(() => assertDeckRules(leaderRed, [line(base, 3), line(don, 1)])).toThrow(/Don!!/);
    });

    it("rejects a Leader card among the deck lines", () => {
        const base = variant("OP01-016", Category.Character, [Color.Red]);
        const lead = variant("yelo", Category.Leader, [Color.Red]);
        expect(() => assertDeckRules(leaderRed, [line(base, 3), line(lead, 1)])).toThrow(/Leader/);
    });

    it("multi-colored leaders can have characters from 2 different colors", () => {
        const multiColoredLeader = variant("MC_Leader", Category.Leader, [Color.Red, Color.Black]);
        const lines = [line(redChar("A"), 4), line(redChar("B"), 2), line(variant("Black_Char", Category.Event, [Color.Black]), 3)]
        expect(() => assertDeckRules(multiColoredLeader, lines)).not.toThrow()
    })

    it("multi-colored leaders can't have characters from another color", () => {
        const multiColoredLeader = variant("MC_Leader", Category.Leader, [Color.Red, Color.Black]);
        const lines = [line(redChar("A"), 4), line(redChar("B"), 2), line(variant("Blue_Char", Category.Event, [Color.Blue]), 3)]
        expect(() => assertDeckRules(multiColoredLeader, lines)).toThrow(/with different color/)
    })

    it("No more than 50 cards", () => {
        const lines = Array.from({ length: 13 }, (_, i) => line(redChar("C" + i), 4));
        expect(() => assertDeckRules(leaderRed, lines)).toThrow(/ more than 50 cards/)
    })

    it("accepts a deck with exactly 50 cards", () => {
        // boundary: 12 cards x 4 = 48, + 1 card x 2 = 50 (rule is > 50, so 50 must pass)
        const lines = [
            ...Array.from({ length: 12 }, (_, i) => line(redChar("D" + i), 4)),
            line(redChar("D12"), 2),
        ];
        expect(() => assertDeckRules(leaderRed, lines)).not.toThrow()
    })
});
