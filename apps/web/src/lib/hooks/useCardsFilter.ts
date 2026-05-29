import { isCategory, isColor, type Category, type Color } from "@/api/cards";
import { useSearchParams } from "react-router";

export function useCardsFilter() {
    const [searchParams, setSearchParams] = useSearchParams()
    const colors = searchParams.getAll('colors').filter(isColor)
    const categoryRaw = searchParams.get('category')
    const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined
    const pageRaw = searchParams.get('page')
    const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1

    const activeCount = colors.length + (category ? 1 : 0)

    function setCategoryFilter(value: Category | undefined) {
        setSearchParams((prev) => {
            prev.delete('page')
            if (!value) prev.delete('category')
            else prev.set('category', value)
            return prev
        })

    }

    function handleColorClick(color: Color) {
        const active = colors.includes(color)
        setSearchParams((prev) => {
            prev.delete('page')
            prev.delete('colors')
            const next = active ? colors.filter(x => x !== color) : [...colors, color]
            next.forEach(x => prev.append('colors', x))
            return prev
        })
    }

    function setPage(n: number | undefined) {
        setSearchParams((prev) => {
            if (!n) prev.delete('page')
            else prev.set('page', String(n))
            return prev
        })
    }

    function clearAll() {
        setSearchParams((prev) => {
            prev.delete('colors')
            prev.delete('category')
            prev.delete('page')
            return prev
        })
    }

    return { colors, category, activeCount, page, handleColorClick, setCategoryFilter, clearAll, setPage }
}