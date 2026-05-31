import { useCardsFilter } from "@/lib/hooks/useCardsFilter";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function CardSearch() {
    const { q, setSearch } = useCardsFilter()
    const [text, setText] = useState(q)
    const [prevQ, setPrevQ] = useState(q)

    if (q !== prevQ) {
        setPrevQ(q)
        setText(q)
    }

    const debounced = useDebounce(text, 300)
    useEffect(() => { setSearch(debounced) }, [debounced])

    return (
        <Input value={text} onChange={(e) => setText(e.target.value)} />
    )
}