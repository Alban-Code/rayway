import { COLORS, CATEGORIES, ATTRIBUTES, COSTS, COUNTERS } from "@/api/cards"
import { useCardsFilter } from "@/lib/hooks/useCardsFilter"
import { CardSearch } from "@/components/cards/filters/CardSearch"
import { FilterSection } from "./FilterSection"
import { ToggleFilterGroups } from "./ToggleGroupFilter"
import { TypeFilter } from "./TypeFilter"

export function CardFilters() {
    const { colors, category, attribute, costs, counters, handleColorClick, setCategoryFilter, setAttributeFilter, setCost, setCounter } = useCardsFilter()

    return (
        <aside className="border-r border-border bg-card overflow-y-auto p-4 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Filters
            </h2>

            <FilterSection title="Search" >
                <CardSearch />
            </FilterSection>

            <FilterSection title="Colors">
                <ToggleFilterGroups options={COLORS} isActive={(c) => colors.includes(c)} onToggle={(c, _) => handleColorClick(c)} />
            </FilterSection>

            <FilterSection title="Categories">
                <ToggleFilterGroups options={CATEGORIES} isActive={(cat) => cat === category} onToggle={(c, on) => setCategoryFilter(on ? c : undefined)} />
            </FilterSection>

            <FilterSection title="Attributes">
                <TypeFilter />
            </FilterSection>

            <FilterSection title="Attributes">
                <ToggleFilterGroups options={ATTRIBUTES} isActive={(attr) => attr === attribute} onToggle={(attr, on) => setAttributeFilter(on ? attr : undefined)} />
            </FilterSection>

            <FilterSection title="Costs">
                <ToggleFilterGroups options={COSTS} isActive={(c) => costs.includes(c)} onToggle={(c, _) => setCost(c)} />
            </FilterSection>

            <FilterSection title="counters">
                <ToggleFilterGroups options={COUNTERS} isActive={(c) => counters.includes(c)} onToggle={(c, _) => setCounter(c)} />
            </FilterSection>
        </aside >)
}