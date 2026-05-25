import type { PaginatedCardsDto } from "@/api/cards"
import { CardThumb } from "./CardThumb"

type CardGridProps = {
    cards: PaginatedCardsDto
}

export function CardGrid({ cards }: CardGridProps) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {cards.items.map((card) => <CardThumb key={card.code} card={card} />)}
        </div>
    )
}