import { fetchCards, type CardListParams } from "@/api/cards";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useCards(params: CardListParams = {}) {
    return useQuery({
        queryKey: ['cards', params],
        queryFn: () => fetchCards(params),
        placeholderData: keepPreviousData,
    })
}