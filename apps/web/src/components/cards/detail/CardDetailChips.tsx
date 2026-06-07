import type { CardListItemDto } from "@/api/cards"
import { Badge } from "@/components/ui/badge"
import type { CSSProperties } from "react"
import { COLOR_VARS } from "@/lib/cardColors"

type CardDetailChipsProps = {
    card: CardListItemDto
}

export function CardDetailChips({ card }: CardDetailChipsProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {card.colors.map(c => (
                <Badge
                    key={`color-${c}`}
                    style={{ '--chip-color': COLOR_VARS[c] } as CSSProperties}
                    className="h-6 px-2.5 text-[11px] font-semibold bg-[color-mix(in_oklch,var(--chip-color)_22%,transparent)] border border-[color-mix(in_oklch,var(--chip-color)_55%,transparent)] text-foreground"
                >
                    {c}
                </Badge>
            ))}
            {card.types.map(t => (
                <Badge key={`type-${t.code}`} variant="secondary" className="h-6 px-2.5 text-[11px]">
                    {t.label}
                </Badge>
            ))}
            {card.attributes.map(a => (
                <Badge key={`attr-${a}`} variant="outline" className="h-6 px-2.5 text-[11px]">
                    {a}
                </Badge>
            ))}
        </div>
    )
}