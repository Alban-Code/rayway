import type { PaginatedCardsDto } from "@/api/cards"
import { CardThumb } from "./CardThumb"

type CardGridProps = {
    cards: PaginatedCardsDto
}

export function CardGrid({ cards }: CardGridProps) {
    return (
        <div>
            {cards.items.map((card) => <CardThumb key={card.code} card={card} />)}
        </div>
    )
}