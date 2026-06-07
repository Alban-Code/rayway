import { useCardsFilter } from "@/lib/hooks/useCardsFilter"
import { useTypes } from "@/lib/hooks/useTypes"
import { ComboboxFilterGroup } from "./ComboboxFilterGroup"

export function TypeFilter() {
    const { lang, types, setTypes } = useCardsFilter()
    const { data, error, isPending } = useTypes({ lang })

    if (isPending) return <div>Loading types</div>

    if (error) return <div>Error loading types</div>

    return (
        <ComboboxFilterGroup
            items={data}
            value={data.filter((t) => types.includes(t.code))}
            onValueChange={(selected) => setTypes(selected.map((t) => t.code))}
            itemToLabel={(t) => t.label}
            itemKey={(t) => t.code}
            placeholder="Search types..."
            emptyMessage="No types found." />
    )
}