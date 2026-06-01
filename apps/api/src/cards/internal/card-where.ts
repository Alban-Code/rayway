import { Prisma } from "../../generated/prisma/client.js";
import { CardQueryDto } from "../dto/card-query.dto.js";

export function buildCardWhere(query: CardQueryDto): Prisma.CardWhereInput {
    const { category, attribute, colors, q, tags, lang } = query;
    return {
        ...(category && { category }),
        ...(attribute && { attributes: { has: attribute } }),
        ...(colors?.length && { colors: { hasSome: colors } }),
        ...(tags?.length && { tags: { some: { tag: { code: { in: tags } } } } }),
        ...(q && {
            translations: {
                some: {
                    languageCode: lang,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { effect: { contains: q, mode: 'insensitive' } }
                    ]
                }
            }
        }),
        ...(lang && { variants: { some: { images: { some: { languageCode: lang } } } } })
    }
}