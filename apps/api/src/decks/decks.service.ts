import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { DeckQueryDto } from "./dto/deck-query.dto.js";
import { DeckDetailDto, PaginatedDecksDto } from "./dto/deck-response.dto.js";
import { deckDetailInclude, deckInclude } from "./internal/deck-include.js";
import { mapDeck } from "./internal/deck-mapper.js";
import { buildDeckWhere } from "./internal/deck-where.js";

@Injectable()
export class DecksService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, query: DeckQueryDto): Promise<PaginatedDecksDto> {

        const { limit = 20, page = 1 } = query;

        const where = { userId, ...buildDeckWhere(query) };
        const include = deckInclude();

        const skip = (page - 1) * limit;
        const take = limit;

        const [decks, total] = await this.prisma.$transaction([
            this.prisma.deck.findMany({ where, include, skip, take }),
            this.prisma.deck.count({ where })]);

        return { items: decks.map((d) => mapDeck(d)), total, page, limit }
    }

    async findById(userId: string, deckId: string): Promise<DeckDetailDto> {

        const include = deckDetailInclude()

        const deck = await this.prisma.deck.findUnique({ where: { id: deckId }, include });
        if (!deck || (deck.userId !== userId && !deck.isPublic)) {
            throw new NotFoundException(`Deck ${deckId} not found`);
        }

        return mapDeckDetail(deck);

    }
}