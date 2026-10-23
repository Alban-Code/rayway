import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useDeckDetail } from "@/lib/hooks/useDeckDetail"
import { idColorStyle } from "@/lib/idStyle"
import { useNavigate, useParams } from "react-router"
import { DeckCardDetail } from "./DeckCardDetail"

export function DeckCardSheet() {
    const { id, variantCode } = useParams<{ id: string; variantCode: string }>()
    const navigate = useNavigate()

    // Same query key as the page → served from cache, no extra request.
    const { data, isPending } = useDeckDetail(id!)
    const card = data?.cards.find((c) => c.variant.variantCode === variantCode)

    return (
        <Sheet
            modal={false}
            open={true}
            onOpenChange={(open) => { if (!open) navigate(`/decks/${id}`) }}
        >
            <SheetContent
                side="right"
                showOverlay={false}
                onInteractOutside={(e) => e.preventDefault()}
                className="w-full sm:max-w-xl overflow-y-auto"
                style={card ? idColorStyle(card.colors) : undefined}
            >
                {isPending && <div className="p-6 text-muted-foreground">Chargement…</div>}
                {!isPending && !card && (
                    <div className="p-6 text-destructive">Carte introuvable dans ce deck.</div>
                )}
                {card && (
                    <div key={variantCode} className="flex flex-col gap-5 p-6 animate-in fade-in-50 duration-200">
                        {card.variant.imageUrl && (
                            <img
                                src={card.variant.imageUrl}
                                alt={card.name}
                                className="w-full max-w-[360px] self-center rounded-xl"
                            />
                        )}
                        <DeckCardDetail card={card} />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
