import type { DeckCardDto } from "@/api/decks"
import { COLOR_VARS } from "@/lib/cardColors"
import { idColorStyle } from "@/lib/idStyle"
import type { CSSProperties } from "react"
import { Link } from "react-router"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { DeckCardDetail } from "./DeckCardDetail"

type DeckCardTileProps = {
    card: DeckCardDto
}

// How many offset copies fan out behind the front face at most.
const MAX_PILE_LAYERS = 3

export function DeckCardTile({ card }: DeckCardTileProps) {
    const imageUrl = card.variant.imageUrl
    const pileLayers = Math.min(card.quantity - 1, MAX_PILE_LAYERS)

    const style = {
        '--tile-color': card.colors[0] ? COLOR_VARS[card.colors[0]] : 'var(--accent)',
        ...(imageUrl ? { '--tile-image': `url(${imageUrl})` } : {}),
    } as CSSProperties

    return (
        <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                <Link
                    to={card.variant.variantCode}
                    className={imageUrl ? "deck-card-tile has-image" : "deck-card-tile"}
                    style={style}
                    title={card.name}
                >
                    {Array.from({ length: pileLayers }).map((_, i) => (
                        <div
                            key={i}
                            className="deck-card-tile__layer"
                            style={{ '--i': i + 1 } as CSSProperties}
                        />
                    ))}
                    <div className="deck-card-tile__face" />
                    <span className="deck-card-tile__qty">×{card.quantity}</span>
                </Link>
            </HoverCardTrigger>
            <HoverCardContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-[460px] p-3 max-h-[80vh] overflow-y-auto"
                style={idColorStyle(card.colors)}
            >
                <DeckCardDetail card={card} />
            </HoverCardContent>
        </HoverCard>
    )
}
