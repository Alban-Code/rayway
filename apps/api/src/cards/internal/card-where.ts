import { Prisma } from "../../generated/prisma/client.js";
import { CardQueryDto } from "../dto/card-query.dto.js";

export function buildCardWhere(query: CardQueryDto): Prisma.CardWhereInput {
    const { category, colors, q, tags } = query;
    return {
        ...(category && { category }),
        ...(colors?.length && { colors: { hasSome: colors } }),
        ...(tags?.length && { tags: { some: { tag: { code: { in: tags } } } } }),
        ...(q && {
            translations: {
                some: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { effect: { contains: q, mode: 'insensitive' } }
                    ]
                }
            }
        })
    }
}