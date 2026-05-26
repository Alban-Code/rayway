import type { CardListItemDto } from "@/api/cards"

type CardDetailEffectsProps = {
    card: CardListItemDto
}

function normalizeBreaks(text: string): string {
    return text.replace(/<br\s*\/?>/gi, '\n')
}

export function CardDetailEffects({ card }: CardDetailEffectsProps) {
    if (!card.effect && !card.triggerEffect) return null

    return (
        <div className="flex flex-col gap-3">
            {card.effect && (
                <section className="px-3.5 py-3 bg-card border border-border rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-1.5">Effect</h3>
                    <p className="text-[12.5px] leading-[1.55] whitespace-pre-line">{normalizeBreaks(card.effect)}</p>
                </section>
            )}
            {card.triggerEffect && (
                <section className="px-3.5 py-3 bg-card border border-border rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-1.5">Trigger</h3>
                    <p className="text-[12.5px] leading-[1.55] whitespace-pre-line">{normalizeBreaks(card.triggerEffect)}</p>
                </section>
            )}
        </div>
    )
}