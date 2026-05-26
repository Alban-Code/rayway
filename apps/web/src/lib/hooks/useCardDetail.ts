import { fetchCard } from "@/api/cards";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useCardDetail(code: string) {
    return useQuery({
        queryKey: ['card', code],
        queryFn: () => fetchCard(code),
        placeholderData: keepPreviousData,
    })
}