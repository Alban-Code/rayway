import type { CardListItemDto } from "@/api/cards"

type CardDetailHeaderProps = {
    card: CardListItemDto
}

export function CardDetailHeader({ card }: CardDetailHeaderProps) {
    return (
        <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-display font-bold leading-tight tracking-tight">{card.name}</h1>
            <p className="text-xs font-mono text-muted-foreground tracking-wide">
                {card.code} · {card.setCode} · {card.rarity}
            </p>
        </header>
    )
}