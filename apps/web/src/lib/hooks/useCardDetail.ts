import { fetchCard } from "@/api/cards";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useCardDetail(code: string, lang: string) {
    return useQuery({
        queryKey: ['card', code, lang],
        queryFn: () => fetchCard(code, lang),
        placeholderData: keepPreviousData,
    })
}