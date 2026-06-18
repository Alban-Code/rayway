import { Prisma } from "../../generated/prisma/client.js";
import { DeckQueryDto } from "../dto/deck-query.dto.js";

export function buildDeckWhere(query: DeckQueryDto): Prisma.DeckWhereInput {
    const { q, colors } = query;
    return {
        ...(colors?.length && { leaderVariant: { card: { colors: { hasSome: colors } } } }),
        ...(q && {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                {
                    leaderVariant: {
                        card: {
                            translations: { some: { name: { contains: q, mode: "insensitive" } } }
                        }
                    }
                }
            ]
        })
    }
}