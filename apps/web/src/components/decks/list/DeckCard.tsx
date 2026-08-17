import type { DeckListItemDto } from "@/api/decks"
import { COLOR_VARS } from "@/lib/cardColors"
import { idColorStyle } from "@/lib/idStyle"
import type { CSSProperties } from "react"
import { Link } from "react-router"

type DeckCardProps = {
    deck: DeckListItemDto
}

export function DeckCard({ deck }: DeckCardProps) {
    const imageUrl = deck.leader.imageUrl
    const style = {
        ...idColorStyle(deck.leader.colors),
        ...(imageUrl ? { '--art-image': `url(${imageUrl})` } : {}),
    } as CSSProperties

    return (
        <Link to={`/decks/${deck.id}`} className="deck-tile" style={style}>
            <div className={imageUrl ? "deck-tile__art has-image" : "deck-tile__art"} />
            <div className="deck-tile__bar" />
            <div className="deck-tile__body">
                <div className="deck-tile__title-row">
                    <h3 className="deck-tile__name">{deck.name}</h3>
                    {deck.isPublic && <span className="deck-tile__badge">Public</span>}
                </div>
                {deck.description && <p className="deck-tile__desc">{deck.description}</p>}
                <div className="deck-tile__footer">
                    <div className="deck-tile__pips">
                        {deck.leader.colors.map((c) => (
                            <span key={c} className="deck-tile__pip" style={{ '--pip': COLOR_VARS[c] } as CSSProperties} />
                        ))}
                    </div>
                    <span className="deck-tile__count">{deck.cardCount}/50</span>
                </div>
            </div>
        </Link>
    )
}