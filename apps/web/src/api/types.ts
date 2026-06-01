import { api } from "./client"

export type TypeParamsDto = {
    lang?: string
}

export type TypeDto = {
    code: string
    label: string
}

export async function fetchTypes(params: TypeParamsDto): Promise<TypeDto[]> {
    const qs = params.lang && params.lang !== "en" ? `?lang=${params.lang}` : ''
    const path = `/types${qs}`

    return api<TypeDto[]>(path)

}