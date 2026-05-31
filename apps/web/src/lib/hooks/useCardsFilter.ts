import { isCategory, isColor, isLang, type Category, type Color, type LangCode } from "@/api/cards";
import { useSearchParams } from "react-router";

export function useCardsFilter() {
    const [searchParams, setSearchParams] = useSearchParams()
    const colors = searchParams.getAll('colors').filter(isColor)
    const categoryRaw = searchParams.get('category')
    const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined
    const pageRaw = searchParams.get('page')
    const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1
    const q = searchParams.get('q') ?? ''
    const langRaw = searchParams.get('lang')
    const lang = langRaw && isLang(langRaw) ? langRaw : "en"

    const activeCount = colors.length + (category ? 1 : 0) + (q.length > 0 ? 1 : 0)

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
            prev.delete('q')
            return prev
        })
    }

    function setSearch(value: string) {
        setSearchParams((prev) => {
            prev.delete('page')
            if (value.length > 0) prev.set('q', value)
            else prev.delete('q')
            return prev
        }, { replace: true })
    }

    function setLang(value: LangCode) {
        setSearchParams((prev) => {
            if (value == "en") prev.delete('lang')
            else prev.set('lang', value)
            return prev
        })
    }

    return { colors, category, activeCount, page, q, lang, handleColorClick, setCategoryFilter, clearAll, setPage, setSearch, setLang }
}