import type { DeckDetailDto } from "@/api/decks"
import { COLOR_VARS } from "@/lib/cardColors"
import { idColorStyle } from "@/lib/idStyle"
import type { CSSProperties } from "react"

type DeckHeaderProps = {
    deck: DeckDetailDto
}

export function DeckHeader({ deck }: DeckHeaderProps) {
    const { leader } = deck
    const cardCount = deck.cards.reduce((total, card) => total + card.quantity, 0)

    const style = {
        ...idColorStyle(leader.colors),
        ...(leader.imageUrl ? { '--art-image': `url(${leader.imageUrl})` } : {}),
    } as CSSProperties

    return (
        <header className="deck-header" style={style}>
            <div className={leader.imageUrl ? "deck-header__art has-image" : "deck-header__art"} />
            <div className="deck-header__bar" />
            <div className="deck-header__body">
                <div className="deck-header__title-row">
                    <h1 className="deck-header__name">{deck.name}</h1>
                    {deck.isPublic && <span className="deck-header__badge">Public</span>}
                </div>
                <p className="deck-header__leader">Leader · {leader.name}</p>
                {deck.description && <p className="deck-header__desc">{deck.description}</p>}
                <div className="deck-header__meta">
                    <div className="deck-header__pips">
                        {leader.colors.map((color) => (
                            <span
                                key={color}
                                className="deck-header__pip"
                                style={{ '--pip': COLOR_VARS[color] } as CSSProperties}
                            />
                        ))}
                    </div>
                    <span className="deck-header__count">{cardCount}/50</span>
                </div>
            </div>
        </header>
    )
}
