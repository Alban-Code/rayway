import { ActiveFilterChips } from "@/components/cards/ActiveFilterChips";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardsSkeleton } from "@/components/cards/CardsSkeleton";
import { useCards } from "@/lib/hooks/useCards";
import { useCardsFilter } from "@/lib/hooks/useCardsFilter";
import { cn } from "@/lib/utils";
import { Outlet, useMatch } from "react-router";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationEllipsis, PaginationPrevious } from "@/components/ui/pagination";
import { useEffect, useRef } from "react";

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
    // Cas A : peu de pages, on affiche tout
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    // Cas B : on est près du début
    if (current <= 4) {
        return [1, 2, 3, 4, 5, 'ellipsis', total]
    }

    // Cas C : on est près de la fin
    if (current >= total - 3) {
        return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total]
    }

    // Cas D : au milieu
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
}

export function CardsPage() {

    const filters = useCardsFilter()
    const { data, isPending, isError } = useCards({ limit: 30, colors: filters.colors, category: filters.category, page: filters.page })
    const totalPages = data ? Math.ceil(data.total / data.limit) : 0
    const isFirstPage = filters.page === 1
    const isLastPage = filters.page === totalPages
    const pageRange = totalPages > 1 ? getPageRange(filters.page, totalPages) : []
    const isDetailOpen = !!useMatch('/cards/:code')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, [filters.page])

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

                <div ref={scrollRef} className="flex-1 overflow-auto p-6">
                    {isPending ? (
                        <CardsSkeleton />
                    ) : isError ? (
                        <p className="text-destructive text-center p-10">Could not load cards</p>
                    ) : (
                        <CardGrid cards={data} />
                    )}
                </div>
                {totalPages > 1 && (
                    <Pagination className="border-t border-border py-3">
                        <PaginationContent>
                            <PaginationItem><PaginationPrevious
                                href="#"
                                aria-disabled={isFirstPage}
                                tabIndex={isFirstPage ? -1 : 0}
                                className={cn(isFirstPage && "pointer-events-none opacity-50")}
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (!isFirstPage) filters.setPage(filters.page - 1)
                                }} />
                            </PaginationItem>

                            {pageRange.map((p, i) =>
                                p === 'ellipsis' ? (
                                    <PaginationItem key={`ellipsis-${i}`}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                ) : (
                                    <PaginationItem key={p}>
                                        <PaginationLink
                                            href="#"
                                            isActive={p === filters.page}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                filters.setPage(p)
                                            }}
                                        >
                                            {p}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            )}


                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    aria-disabled={isLastPage}
                                    tabIndex={isLastPage ? -1 : 0}
                                    className={cn(isLastPage && "pointer-events-none opacity-50")}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (!isLastPage) filters.setPage(filters.page + 1)
                                    }}
                                />
                            </PaginationItem>

                        </PaginationContent>
                    </Pagination>
                )
                }
            </main>
            <Outlet />

        </div >
    )
}