import { Skeleton } from "@/components/ui/skeleton"

export function CardsSkeleton() {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[0.715/1] rounded-xl" />
            ))}
        </div>
    )
}