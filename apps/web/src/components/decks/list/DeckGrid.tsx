import type { PaginatedDecksDto } from "@/api/decks"
import { DeckCard } from "./DeckCard"

type DeckGridProps = {
    decks: PaginatedDecksDto
}

export function DeckGrid({ decks }: DeckGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {decks.items.map((deck) => (<DeckCard deck={deck} key={deck.id} />))}
        </div>
    )
}