import type { CardListItemDto } from "@/api/cards"

type CardDetailStatsProps = {
    card: CardListItemDto
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold">{label}</span>
            <span className="text-xl font-display font-bold tabular-nums leading-none">{value}</span>
        </div>
    );
}

export function CardDetailStats({ card }: CardDetailStatsProps) {
    const stats = [
        card.cost !== null && <Stat key="cost" label="Cost" value={card.cost} />,
        card.power !== null && <Stat key="power" label="Power" value={card.power} />,
        card.counterAmount !== null && <Stat key="counter" label="Counter" value={card.counterAmount} />,
        card.life !== null && <Stat key="life" label="Life" value={card.life} />,
    ].filter(Boolean)

    if (stats.length === 0) return null

    return (
        <div className="flex gap-6 px-3.5 py-3 bg-card border border-border rounded-xl">
            {stats}
        </div>
    )
}