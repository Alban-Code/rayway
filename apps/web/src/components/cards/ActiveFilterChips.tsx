import { Badge } from "@/components/ui/badge"
import { useCardsFilter } from "@/lib/hooks/useCardsFilter"
import type { Color } from "@/api/cards"
import type { CSSProperties } from "react"

const COLOR_VARS: Record<Color, string> = {
    Red: 'var(--id-red)',
    Green: 'var(--id-green)',
    Blue: 'var(--id-blue)',
    Purple: 'var(--id-purple)',
    Black: 'var(--id-black)',
    Yellow: 'var(--id-yellow)',
}

export function ActiveFilterChips() {
    const { colors, category, handleColorClick, activeCount, setCategoryFilter, clearAll } = useCardsFilter()

    if (activeCount === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-1.5 px-7 py-3 border-b border-border bg-muted/40">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-1">
                Filters
            </span>
            {colors.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1.5 pr-1" style={{ '--chip-color': COLOR_VARS[c] } as CSSProperties}>
                    <span className="size-2 rounded-full" style={{ background: 'var(--chip-color)' }} />
                    {c}
                    <button
                        type="button"
                        onClick={() => handleColorClick(c)}
                        className="ml-1 hover:text-destructive"
                    >
                        ×
                    </button>
                </Badge>
            ))}
            {category && (
                <Badge variant="secondary" className="pr-1">
                    {category}
                    <button
                        type="button"
                        onClick={() => setCategoryFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                    >
                        ×
                    </button>
                </Badge>
            )}

            <div className="flex-1" />
            <button type="button" onClick={clearAll} className="text-xs text-primary font-semibold hover:underline">Clear all</button>
        </div>
    )
}