import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"

type ComboboxFilterGroupProps<T> = {
    items: readonly T[]
    value: T[]
    onValueChange: (selected: T[]) => void
    itemToLabel: (item: T) => string
    itemKey: (item: T) => string | number
    placeholder?: string
    emptyMessage?: string
}

export function ComboboxFilterGroup<T>({ items, value, onValueChange, itemToLabel, itemKey, placeholder = "Search...", emptyMessage = "No results found" }: ComboboxFilterGroupProps<T>) {
    return (
        <Combobox
            multiple
            autoHighlight
            items={items}
            value={value}
            onValueChange={onValueChange}
            itemToStringLabel={itemToLabel}
            isItemEqualToValue={(a, b) => itemKey(a) === itemKey(b)}
        >
            <ComboboxInput placeholder={placeholder} />
            <ComboboxContent>
                <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
                <ComboboxList>
                    {(item: T) => (
                        <ComboboxItem key={itemKey(item)} value={item}>
                            {itemToLabel(item)}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}