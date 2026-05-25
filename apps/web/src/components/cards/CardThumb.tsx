import type { CardListItemDto } from "@/api/cards"
import { idColorStyle } from "@/lib/idStyle"
import { Link } from "react-router"

type CardThumbProps = {
    card: CardListItemDto
}

export function CardThumb({ card }: CardThumbProps) {

    const imageUrl = card.variants[0]?.imageUrl
    const style = {
        ...idColorStyle(card.colors),
        ...(imageUrl ? { '--art-image': `url(${imageUrl})` } : {})
    }


    return (
        <Link to={`/cards/${card.code}`} className="card-tile" style={style}>
            <div className="top-bar" />
            <div className={imageUrl ? "art has-image" : "art"} />
            {card.cost !== null && <div className="cost">{card.cost}</div>}
            <div className="type-tag">{card.category.toUpperCase()}</div>
            <div className="name">{card.name}</div>
            <div className="code">
                <span>{card.code}</span>
                <span>{card.rarity}</span>
            </div>
        </Link>
    )
}