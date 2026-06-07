import type { PropsWithChildren } from "react";

interface FilterSectionProps extends PropsWithChildren {
    title: string;
}

export function FilterSection({ title, children }: FilterSectionProps) {

    return (
        <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
                {children}
            </div>
        </section>
    )
}