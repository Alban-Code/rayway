import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { useCardsFilter } from "@/lib/hooks/useCardsFilter"
import { useTypes } from "@/lib/hooks/useTypes"

export function TypeFilter() {
    const { lang, types, setTypes } = useCardsFilter()
    const { data, error, isPending } = useTypes({ lang })

    if (isPending) return <div>Loading types</div>

    if (error) return <div>Error loading types</div>

    const selectedTypes = data.filter((t) => types.includes(t.code))

    return (<Combobox
        multiple
        autoHighlight
        items={data}
        value={selectedTypes}
        onValueChange={(selected) => setTypes(selected.map((t) => t.code))}
        itemToStringLabel={(type) => type.label}
        isItemEqualToValue={(a, b) => a.code === b.code}
    >
        <ComboboxInput placeholder="Search types..." />
        <ComboboxContent>
            <ComboboxEmpty>No types found.</ComboboxEmpty>
            <ComboboxList>
                {(type) => (
                    <ComboboxItem key={type.code} value={type}>
                        {type.label}
                    </ComboboxItem>
                )}
            </ComboboxList>
        </ComboboxContent>
    </Combobox>)
}