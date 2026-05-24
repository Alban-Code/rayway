import { isCategory, isColor, type Category, type Color } from "@/api/cards";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router";

export function useCardsFilter() {
    const [searchParams, setSearchParams] = useSearchParams()
    const colors = searchParams.getAll('colors').filter(isColor)
    const categoryRaw = searchParams.get('category')
    const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined

    function setCategoryFilter(value: Category | undefined) {
        setSearchParams((prev) => {
            if (!value) prev.delete('category')
            else prev.set('category', value)
            return prev
        })

    }

    function handleColorClick(color: Color) {
        const active = colors.includes(color)
        setSearchParams((prev) => {
            prev.delete('colors')
            const next = active ? colors.filter(x => x !== color) : [...colors, color]
            next.forEach(x => prev.append('colors', x))
            return prev
        })
    }

    return { colors, category, handleColorClick, setCategoryFilter }
}