import { DeckGrid } from "@/components/decks/list/DeckGrid"
import { DecksSkeleton } from "@/components/decks/list/DecksSkeleton"
import { EmptyDecks } from "@/components/decks/list/EmptyDecks"
import { useDecks } from "@/lib/hooks/useDecks"

export function DecksPage() {
    const { data, isError, isPending } = useDecks({})

    function renderContent() {
        if (isPending) return <DecksSkeleton />
        if (isError) return <p className="text-destructive text-center p-10">Could not load decks</p>
        if (data.items.length === 0) return <EmptyDecks />
        return <DeckGrid decks={data} />
    }
    return (
        <div className="flex flex-col h-full">
            <header className="shrink-0 flex items-center justify-between px-7 pt-5 pb-3 border-b border-border">
                <h1 className="text-3xl font-bold tracking-tight">My decks</h1>
                {/* bouton "New deck" ici */}
            </header>
            <div className="flex-1 overflow-auto p-6">
                {renderContent()}
            </div>
        </div>
    )
}