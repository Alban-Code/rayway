import { Toggle } from "@/components/ui/toggle"
import { COLORS, CATEGORIES, ATTRIBUTES, type Color } from "@/api/cards"
import { useCardsFilter } from "@/lib/hooks/useCardsFilter"
import type { CSSProperties } from "react"
import { CardSearch } from "@/components/cards/CardSearch"
import { TypeFilter } from "./TypeFilter"

const COLOR_VARS: Record<Color, string> = {
    Red: 'var(--id-red)',
    Green: 'var(--id-green)',
    Blue: 'var(--id-blue)',
    Purple: 'var(--id-purple)',
    Black: 'var(--id-black)',
    Yellow: 'var(--id-yellow)',
}

export function CardFilters() {
    const { colors, category, attribute, handleColorClick, setCategoryFilter, setAttributeFilter } = useCardsFilter()

    return (
        <aside className="border-r border-border bg-card overflow-y-auto p-4 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Filters
            </h2>

            <section className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Search
                </h3>
                <CardSearch />
            </section>

            <section className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Color
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((c) => (
                        <Toggle
                            key={c}
                            size="sm"
                            pressed={colors.includes(c)}
                            onPressedChange={() => handleColorClick(c)}
                            style={{ '--chip-color': COLOR_VARS[c] } as CSSProperties}
                            className="gap-1.5 data-[state=on]:bg-[color-mix(in_oklch,var(--chip-color)_22%,transparent)] data-[state=on]:border-[color-mix(in_oklch,var(--chip-color)_50%,transparent)] data-[state=on]:text-[var(--chip-color)] border"
                        >
                            <span className="size-2 rounded-full" style={{ background: 'var(--chip-color)' }} />
                            {c}
                        </Toggle>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Category
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                        <Toggle
                            key={cat}
                            size="sm"
                            pressed={category === cat}
                            onPressedChange={(pressed) => setCategoryFilter(pressed ? cat : undefined)}
                            className="border"
                        >
                            {cat}
                        </Toggle>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Attributes
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {ATTRIBUTES.map((attr) => (
                        <Toggle
                            key={attr}
                            size="sm"
                            pressed={attribute === attr}
                            onPressedChange={(pressed) => setAttributeFilter(pressed ? attr : undefined)}
                            className="border"
                        >
                            {attr}
                        </Toggle>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Types
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    <TypeFilter />
                </div>
            </section>
        </aside >)
}