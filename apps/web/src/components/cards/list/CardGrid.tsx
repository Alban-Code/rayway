import type { PaginatedCardsDto } from "@/api/cards"
import { CardThumb } from "./CardThumb"

type CardGridProps = {
    cards: PaginatedCardsDto
}

export function CardGrid({ cards }: CardGridProps) {
    return (
        <div className="grid grid-cols-6 min-[2560px]:grid-cols-8 gap-6">
            {cards.items.map((card) => <CardThumb key={card.code} card={card} />)}
        </div>
    )
}