import { CardDetailView } from "@/components/cards/CardDetailView"
import { useCardDetail } from "@/lib/hooks/useCardDetail"
import { useLocation, useNavigate, useParams } from "react-router"
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CardDetailSkeleton } from "@/components/cards/CardDetailSkeleton";
import { useCardsFilter } from "@/lib/hooks/useCardsFilter";

export function CardDetailSheet() {

    const { lang } = useCardsFilter()
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { data, isPending, error } = useCardDetail(code!, lang);
    const location = useLocation()

    return (
        <Sheet
            modal={false}
            open={true}
            onOpenChange={(open) => { if (!open) navigate({ pathname: '/cards', search: location.search }); }}
        >
            <SheetContent
                side="right"
                showOverlay={false}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-2xl w-full overflow-y-auto"
            >
                {isPending && !data && <CardDetailSkeleton />}
                {error && <div className="p-6 text-destructive">Erreur lors du chargement de la carte.</div>}
                {data && (
                    <div key={data.code} className="animate-in fade-in-50 duration-200">
                        <CardDetailView card={data} />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}