import { fetchDecks, type DeckListParams } from "@/api/decks";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useDecks(params: DeckListParams) {
    return useQuery({
        queryKey: ['decks', params],
        queryFn: () => fetchDecks(params),
        placeholderData: keepPreviousData,
    })
}