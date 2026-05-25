import type { CardListItemDto } from "@/api/cards"

type CardThumbProps = {
    card: CardListItemDto
}

export function CardThumb({ card }: CardThumbProps) {

    return (
        <div>
            <h1>{card.name}</h1>
            <p>
                Category: {card.category}
            </p>
            <p>
                Colors: {card.colors}
            </p>
        </div>
    )
}