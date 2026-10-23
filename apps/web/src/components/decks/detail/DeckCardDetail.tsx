import type { DeckCardDto } from "@/api/decks"
import { CardDetailChips } from "@/components/cards/detail/CardDetailChips"
import { CardDetailEffects } from "@/components/cards/detail/CardDetailEffects"
import { CardDetailStats } from "@/components/cards/detail/CardDetailStats"

type DeckCardDetailProps = {
    card: DeckCardDto
}

// Shared text body for a deck card, reused by the hover preview and the
// click modal. Mirrors the cards-page detail, minus the leader-only header
// fields (code/setCode) that deck lines don't carry.
export function DeckCardDetail({ card }: DeckCardDetailProps) {
    return (
        <div className="flex flex-col gap-3">
            <header className="flex flex-col gap-1">
                <h2 className="text-2xl font-display font-bold leading-tight tracking-tight">{card.name}</h2>
                <p className="text-xs font-mono text-muted-foreground tracking-wide">{card.rarity}</p>
            </header>
            <CardDetailStats card={card} />
            <CardDetailChips card={card} />
            <CardDetailEffects card={card} />
        </div>
    )
}
