import { fetchDeck } from "@/api/decks";
import { useQuery } from "@tanstack/react-query";

export function useDeckDetail(deckId: string) {
    return useQuery({
        queryKey: ['deck', deckId],
        queryFn: () => fetchDeck(deckId),
    })
}