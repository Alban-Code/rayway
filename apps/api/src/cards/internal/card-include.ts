import { DEFAULT_LANG } from "../../common/constants.js";
import { Prisma } from "../../generated/prisma/client.js";

export const cardInclude = (lang: string) => ({
    set: true,
    translations: {
        where: { languageCode: { in: [lang, DEFAULT_LANG] } }
    },
    types: {
        include: {
            type: {
                include: {
                    translations: {
                        where: { languageCode: { in: [lang, DEFAULT_LANG] } }
                    }
                }
            }
        },
        orderBy: { order: 'asc' }
    },
    variants: {
        include: {
            images: {
                where: { languageCode: { in: [lang, DEFAULT_LANG] } }
            }
        },
        orderBy: [{ variantType: 'asc' }, { variantCode: 'asc' }]
    }
} satisfies Prisma.CardInclude);

export type CardWithRelations = Prisma.CardGetPayload<{ include: ReturnType<typeof cardInclude> }>;