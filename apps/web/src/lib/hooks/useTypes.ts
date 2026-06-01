import { fetchTypes, type TypeParamsDto } from "@/api/types";
import { useQuery } from "@tanstack/react-query";

export function useTypes(params: TypeParamsDto) {
    return useQuery({
        queryKey: ['types', params],
        queryFn: () => fetchTypes(params)
    })
}