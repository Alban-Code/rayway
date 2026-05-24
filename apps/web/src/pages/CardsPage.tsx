import { CardFilters } from "@/components/cards/CardFilters";
import { useCards } from "@/lib/hooks/useCards";
import { useCardsFilter } from "@/lib/hooks/useCardsFilter";

export function CardsPage() {

    const filters = useCardsFilter()
    const { data, isPending, isError } = useCards({ limit: 12, colors: filters.colors, category: filters.category })

    if (isPending) return <div>Loading...</div>

    if (isError) return <div>Error</div>

    return (<div className="flex gap-5">
        <CardFilters />
        <div>
            {data.items.map((card) => <div key={card.code}>{card.name}</div>)}
        </div>

    </div>)
}