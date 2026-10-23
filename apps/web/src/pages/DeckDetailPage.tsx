import { DeckCardGrid } from "@/components/decks/detail/DeckCardGrid";
import { DeckHeader } from "@/components/decks/detail/DeckHeader";
import { DeckStats } from "@/components/decks/detail/DeckStats";
import { useDeckDetail } from "@/lib/hooks/useDeckDetail";
import { idColorStyle } from "@/lib/idStyle";
import { Outlet, useParams } from "react-router"

export function DeckDetailPage() {

    const { id } = useParams<{ id: string }>();

    const { data, isPending, isError } = useDeckDetail(id!);

    if (isPending) return (<div>Loading</div>);

    if (isError) return (<div>Error</div>)

    return (
        <div className="deck-detail" style={idColorStyle(data.leader.colors)}>
            <DeckHeader deck={data} />
            <div className="deck-detail__body">
                <main className="deck-detail__main">
                    <DeckCardGrid cards={data.cards} />
                </main>
                <aside className="deck-detail__aside">
                    <DeckStats cards={data.cards} />
                </aside>
            </div>
            <Outlet />
        </div>
    )
}
