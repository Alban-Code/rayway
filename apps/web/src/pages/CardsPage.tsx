import { ActiveFilterChips } from "@/components/cards/ActiveFilterChips";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardsSkeleton } from "@/components/cards/CardsSkeleton";
import { useCards } from "@/lib/hooks/useCards";
import { useCardsFilter } from "@/lib/hooks/useCardsFilter";
import { cn } from "@/lib/utils";
import { Outlet, useMatch } from "react-router";

export function CardsPage() {

    const filters = useCardsFilter()
    const { data, isPending, isError } = useCards({ limit: 30, colors: filters.colors, category: filters.category })
    const isDetailOpen = !!useMatch('/cards/:code')

    return (
        <div className="grid grid-cols-[260px_1fr] h-dvh overflow-hidden">
            <CardFilters />
            <main
                className={cn(
                    "flex flex-col overflow-hidden transition-[padding] duration-300 ease-out",
                    isDetailOpen && "sm:pr-[min(100vw,42rem)]"
                )}
            >
                <header className="flex items-end justify-between px-7 pt-5 pb-3 border-b border-border">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Cards
                        {data && (<span className="text-sm font-mono text-muted-foreground ml-2 font-normal"> · {data.total} results</span>)}
                    </h1>
                </header>
                <ActiveFilterChips />

                <div className="flex-1 overflow-auto p-6">
                    {isPending ? (
                        <CardsSkeleton />
                    ) : isError ? (
                        <p className="text-destructive text-center p-10">Could not load cards</p>
                    ) : (
                        <CardGrid cards={data} />
                    )}
                </div>
            </main>
            <Outlet />

        </div>
    )
}