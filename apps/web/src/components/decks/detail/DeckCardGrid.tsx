import type { DeckCardDto } from "@/api/decks"
import { DeckCardTile } from "./DeckCardTile"
import { groupByCategory } from "@/lib/deckGrouping";

type DeckCardGridProps = {
    cards: DeckCardDto[]
}

export function DeckCardGrid({ cards }: DeckCardGridProps) {

    const groupedCards = groupByCategory(cards).flatMap(g => g.cards);

    return (
        <div className="deck-card-grid">
            {groupedCards.map((card) => (<DeckCardTile key={card.variant.variantCode} card={card} />))}
        </div>
    )
}