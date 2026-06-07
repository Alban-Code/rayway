import type { CardListItemDto } from "@/api/cards"

type CardDetailVariantsProps = {
    card: CardListItemDto
}

export function CardDetailVariants({ card }: CardDetailVariantsProps) {
    if (card.variants.length === 0) return null

    return (
        <section className="px-3.5 py-3 bg-card border border-border rounded-xl flex flex-col gap-2.5">
            <h3 className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold">
                Variants ({card.variants.length})
            </h3>
            <ul className="grid grid-cols-4 gap-2">
                {card.variants.map(v => (
                    <li
                        key={v.variantCode}
                        className="group relative aspect-[0.715/1] rounded-lg overflow-hidden border border-border bg-background"
                        title={`${v.variantCode} · ${v.variantType}${v.isPromo ? ' · Promo' : ''}${v.isStarter ? ' · Starter' : ''}`}
                    >
                        {v.imageUrl ? (
                            <img
                                src={v.imageUrl}
                                alt={v.variantCode}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-black/65 backdrop-blur-sm text-[8.5px] font-mono font-semibold text-white text-center tracking-wide">
                            {v.variantType}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}