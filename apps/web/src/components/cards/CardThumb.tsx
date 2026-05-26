import type { CardListItemDto } from "@/api/cards"
import { idColorStyle } from "@/lib/idStyle"
import { Link } from "react-router"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { CardDetailHeader } from "@/components/cards/CardDetailHeader"
import { CardDetailStats } from "@/components/cards/CardDetailStats"
import { CardDetailChips } from "@/components/cards/CardDetailChips"
import { CardDetailEffects } from "@/components/cards/CardDetailEffects"

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
        <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                <Link to={`/cards/${card.code}`} className="card-tile" style={style}>
                    <div className="top-bar" />
                    <div className={imageUrl ? "art has-image" : "art"} />
                </Link>
            </HoverCardTrigger>
            <HoverCardContent side="right"
                align="start"
                sideOffset={8}
                className="w-[460px] p-3 max-h-[80vh] overflow-y-auto"
                style={idColorStyle(card.colors)}
            >
                <div className="flex gap-3">

                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <CardDetailHeader card={card} />
                        <CardDetailStats card={card} />
                        <CardDetailChips card={card} />
                        <CardDetailEffects card={card} />
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>


    )
}