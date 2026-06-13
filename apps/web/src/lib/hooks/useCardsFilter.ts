import { DEFAULT_PAGE_SIZE, isAttribute, isCategory, isColor, isCost, isCounter, isLang, isPageSize, type Attribute, type Category, type Color, type Cost, type Counter, type LangCode, type PageSize } from "@/api/cards";
import { useSearchParams } from "react-router";

export function useCardsFilter() {
    const [searchParams, setSearchParams] = useSearchParams()
    const colors = searchParams.getAll('colors').filter(isColor)
    const categoryRaw = searchParams.get('category')
    const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined
    const attributeRaw = searchParams.get('attribute')
    const attribute = attributeRaw && isAttribute(attributeRaw) ? attributeRaw : undefined
    const pageRaw = searchParams.get('page')
    const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1
    const q = searchParams.get('q') ?? ''
    const langRaw = searchParams.get('lang')
    const lang = langRaw && isLang(langRaw) ? langRaw : "en"
    const types = searchParams.getAll('types')
    const costs = searchParams.getAll('costs').map(Number).filter(isCost)
    const counters = searchParams.getAll('counters').map(Number).filter(isCounter)
    const sizeRaw = Number(searchParams.get('size'))
    const size = isPageSize(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE

    const activeCount = colors.length + (category ? 1 : 0) + (q.length > 0 ? 1 : 0) + (attribute ? 1 : 0) + types.length + costs.length + counters.length

    function setCategoryFilter(value: Category | undefined) {
        setSearchParams((prev) => {
            prev.delete('page')
            if (!value) prev.delete('category')
            else prev.set('category', value)
            return prev
        })
    }

    function setAttributeFilter(value: Attribute | undefined) {
        setSearchParams((prev) => {
            prev.delete('page')
            if (!value) prev.delete('attribute')
            else prev.set('attribute', value)
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
            prev.delete('attribute')
            prev.delete('types')
            prev.delete('costs')
            prev.delete('counters')
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
            prev.delete('page')
            if (value == "en") prev.delete('lang')
            else prev.set('lang', value)
            return prev
        })
    }

    function setTypes(types: string[]) {
        setSearchParams((prev) => {
            prev.delete('page')
            prev.delete('types')
            types.forEach((type: any) => prev.append('types', type))
            return prev
        })

    }

    function setCounter(c: Counter) {
        const active = counters.includes(c)
        setSearchParams((prev) => {
            prev.delete('page')
            prev.delete('counters')
            const next = active ? counters.filter(x => x !== c) : [...counters, c]
            next.forEach(x => prev.append('counters', String(x)))
            return prev
        })
    }

    function setCost(c: Cost) {
        const active = costs.includes(c)
        setSearchParams((prev) => {
            prev.delete('page')
            prev.delete('costs')
            const next = active ? costs.filter(x => x !== c) : [...costs, c]
            next.forEach(x => prev.append('costs', String(x)))
            return prev
        })
    }

    function setPageSize(value: PageSize) {
        setSearchParams((prev) => {
            prev.delete('page')
            if (value === DEFAULT_PAGE_SIZE) prev.delete('size')
            else (prev.set('size', String(value)))
            return prev
        })
    }

    return { colors, category, attribute, activeCount, page, q, lang, types, counters, costs, size, handleColorClick, setCategoryFilter, setAttributeFilter, clearAll, setPage, setSearch, setLang, setTypes, setCost, setCounter, setPageSize }
}