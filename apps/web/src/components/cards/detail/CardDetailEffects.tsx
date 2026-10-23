import type { CardListItemDto } from "@/api/cards"
import { renderEffect } from "@/lib/renderEffects"

// Structural prop: any card-like carrying the two effect texts (CardListItemDto
// or DeckCardDto) can reuse this presentational block.
type CardDetailEffectsProps = {
    card: Pick<CardListItemDto, "effect" | "triggerEffect">
}

export function CardDetailEffects({ card }: CardDetailEffectsProps) {
    if (!card.effect && !card.triggerEffect) return null

    return (
        <div className="flex flex-col gap-3">
            {card.effect && (
                <section className="px-3.5 py-3 bg-card border border-border rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-1.5">Effect</h3>
                    <p className="text-[12.5px] leading-[1.55] whitespace-pre-line">{renderEffect(card.effect)}</p>
                </section>
            )}
            {card.triggerEffect && (
                <section className="px-3.5 py-3 bg-card border border-border rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-1.5">Trigger</h3>
                    <p className="text-[12.5px] leading-[1.55] whitespace-pre-line">{renderEffect(card.triggerEffect)}</p>
                </section>
            )}
        </div>
    )
}