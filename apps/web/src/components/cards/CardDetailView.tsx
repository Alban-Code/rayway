import type { CardListItemDto } from "@/api/cards";
import { idColorStyle } from "@/lib/idStyle";
import { CardDetailHeader } from "./CardDetailHeader";
import { CardDetailStats } from "./CardDetailStats";
import { CardDetailChips } from "./CardDetailChips";
import { CardDetailEffects } from "./CardDetailEffects";
import { CardDetailVariants } from "./CardDetailVariants";

type CardDetailViewProps = {
    card: CardListItemDto
}
export function CardDetailView({ card }: CardDetailViewProps) {
    const imageUrl = card.variants[0]?.imageUrl ?? null
    return (
        <div className="flex flex-col gap-6 p-6">
            <section
                className="card-tile card-tile--static mx-auto w-full max-w-[360px]"
                style={{ ...idColorStyle(card.colors), ...(imageUrl ? { '--art-image': `url(${imageUrl})` } : {}) }}
            >
                <div className="top-bar" />
                <div className={imageUrl ? "art has-image" : "art"} />
            </section>

            <section className="flex flex-col gap-3.5">
                <CardDetailHeader card={card} />
                <CardDetailStats card={card} />
                <CardDetailChips card={card} />
                <CardDetailEffects card={card} />
                <CardDetailVariants card={card} />
            </section>
        </div>
    )
}