import { Toggle } from "@/components/ui/toggle";
import type React from "react";

type ToggleGroupFilterProps<T> = {
    options: readonly T[];
    isActive: (item: T) => boolean;
    onToggle: (item: T, pressed: boolean) => void;
    renderItem?: (item: T) => React.ReactNode;
    itemKey?: (item: T) => string | number
}

export function ToggleFilterGroups<T>({ options, isActive, onToggle, renderItem = (item) => String(item), itemKey = (item) => String(item) }: ToggleGroupFilterProps<T>) {
    return (<>
        {
            options.map((item) => (
                <Toggle
                    key={itemKey(item)}
                    size="sm"
                    pressed={isActive(item)}
                    onPressedChange={(pressed) => onToggle(item, pressed)}
                    className="border"
                >
                    {renderItem(item)}
                </Toggle>
            ))
        }
    </>)
}