import { Prisma } from "../../generated/prisma/client.js";

export const deckInclude = () => ({
    leaderVariant: {
        include: {
            card: { include: { translations: true } },
            images: true
        }
    },
    cards: { select: { quantity: true } }
} satisfies Prisma.DeckInclude);

export type DeckWithRelations = Prisma.DeckGetPayload<{ include: ReturnType<typeof deckInclude> }>;

export const deckDetailInclude = () => ({
    cards: {
        include: {
            variant: { include: { card: { include: { translations: true } }, images: true } }
        }
    },
    leaderVariant: {
        include: {
            card: { include: { translations: true } },
            images: true
        }
    }
} satisfies Prisma.DeckInclude);

export type DeckDetailWithRelations = Prisma.DeckGetPayload<{ include: ReturnType<typeof deckDetailInclude> }>;