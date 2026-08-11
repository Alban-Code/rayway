import { BadRequestException } from "@nestjs/common";
import { Category } from "../../generated/prisma/enums.js";
import { ResolvedVariant } from "./deck-include.js";

export type Line = {
    variant: ResolvedVariant;
    quantity: number;
    languageCode: string;
}

export function assertDeckRules(leaderCard: ResolvedVariant, lines: Line[]): void {
    // Deck-building rules:
    // - leader must be of category Leader
    // - each card shares at least one color with the leader
    // - no more than 4 copies per Card (by cardId, across variants)
    // - at most 50 cards, leader excluded
    // - no DON!! or Leader cards among the deck lines
    if (leaderCard.card.category !== Category.Leader) throw new BadRequestException("Leader card must be a leader");

    const linesByCard = lines.reduce((map, line) => {
        if (line.variant.card.category === Category.Don) throw new BadRequestException("You can't have a Don!! card in your deck");
        if (line.variant.card.category === Category.Leader) throw new BadRequestException("You can't have a Leader card in your deck");
        if (!leaderCard.card.colors.some(color => line.variant.card.colors.includes(color))) throw new BadRequestException("You can't have a card with different color than the leader");

        const cardId = line.variant.cardId;

        const existing = map.get(cardId);

        if (existing) {
            existing.push(line);
        } else {
            map.set(cardId, [line]);
        }

        return map;
    }, new Map<string, { variant: ResolvedVariant; quantity: number }[]>());


    let deckSize = 0;
    for (const value of linesByCard.values()) {
        const currentQuantity = value.reduce((acc, variant) => acc + variant.quantity, 0);
        if (currentQuantity > 4) throw new BadRequestException("Cannoy have more than 4 instances of a single card")
        deckSize += currentQuantity
    }

    if (deckSize > 50) throw new BadRequestException("Cannot have a deck with more than 50 cards");
}