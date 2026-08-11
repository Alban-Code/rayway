import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { DeckQueryDto } from "./dto/deck-query.dto.js";
import { DeckDetailDto, PaginatedDecksDto } from "./dto/deck-response.dto.js";
import { deckDetailInclude, deckInclude, ResolvedVariant } from "./internal/deck-include.js";
import { mapDeck, mapDeckDetail } from "./internal/deck-mapper.js";
import { buildDeckWhere } from "./internal/deck-where.js";
import { CreateDeckDto } from "./dto/create-deck.dto.js";
import { assertDeckRules, Line } from "./internal/deck-rules.js";
import { Prisma } from "../generated/prisma/client.js";

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

    async create(userId: string, dto: CreateDeckDto): Promise<DeckDetailDto> {
        const codes = this.getCodesAndCheckDuplicates(dto);

        const { lines, leaderVariant } = await this.checkDeckRules(codes, dto)

        try {
            const created = await this.prisma.deck.create({
                data: {
                    userId: userId,
                    name: dto.name,
                    description: dto.description,
                    isPublic: dto.isPublic,
                    leaderVariantId: leaderVariant.id,
                    leaderLanguageCode: dto.leader.languageCode,
                    cards: {
                        create: lines.map(line => ({
                            variantId: line.variant.id,
                            languageCode: line.languageCode,
                            quantity: line.quantity
                        }))
                    }
                },
                include: deckDetailInclude()
            });

            return mapDeckDetail(created);

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") throw new BadRequestException("Duplicated line")
                if (err.code === "P2003") throw new BadRequestException("Unknown language")
            }
            throw err;
        }
    }

    async update(deckId: string, userId: string, dto: CreateDeckDto): Promise<DeckDetailDto> {
        await this.assertOwnership(deckId, userId);

        const codes = this.getCodesAndCheckDuplicates(dto);
        const { lines, leaderVariant } = await this.checkDeckRules(codes, dto)


        try {
            const updated = await this.prisma.deck.update({
                where: { id: deckId },
                data: {
                    name: dto.name,
                    description: dto.description,
                    isPublic: dto.isPublic,
                    leaderVariantId: leaderVariant.id,
                    leaderLanguageCode: dto.leader.languageCode,
                    cards: {
                        deleteMany: {},
                        create: lines.map(line => ({
                            variantId: line.variant.id,
                            languageCode: line.languageCode,
                            quantity: line.quantity
                        }))
                    }
                },
                include: deckDetailInclude()
            });

            return mapDeckDetail(updated);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") throw new BadRequestException("Duplicated line")
                if (err.code === "P2003") throw new BadRequestException("Unknown language")
            }
            throw err;
        }
    }

    async delete(deckId: string, userId: string): Promise<void> {
        await this.assertOwnership(deckId, userId);

        await this.prisma.deck.delete({
            where: { id: deckId }
        })
    }

    private async assertOwnership(deckId: string, userId: string) {
        const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
        if (deck === null) throw new NotFoundException(`deck ${deckId} not found`);

        // Does it belong to the current user ?
        if (deck.userId !== userId) throw new NotFoundException(`deck ${deckId} not found`);
    }

    private getCodesAndCheckDuplicates(dto: CreateDeckDto): string[] {
        const codes = [dto.leader.variantCode, ...dto.cards.map(c => c.variantCode)];

        const seen = new Set<string>();
        for (const line of dto.cards) {
            const key = `${line.variantCode}|${line.languageCode}`;
            if (seen.has(key)) throw new BadRequestException(`Duplicated line: ${line.variantCode} (${line.languageCode})`)
            seen.add(key)
        }

        return codes
    }

    private async checkDeckRules(codes: string[], dto: CreateDeckDto): Promise<{ lines: Line[], leaderVariant: ResolvedVariant }> {
        const variants = await this.prisma.cardVariant.findMany({
            where: { variantCode: { in: codes } },
            include: { card: { select: { id: true, code: true, category: true, colors: true } } }
        });

        const byCode = new Map(variants.map(v => [v.variantCode, v]));

        const missing = codes.filter(c => !byCode.has(c))
        if (missing.length) throw new BadRequestException(`Unknown variant(s): ${missing.join(", ")}`);

        const leaderVariant = byCode.get(dto.leader.variantCode)!;

        const lines = dto.cards.map(c => ({
            variant: byCode.get(c.variantCode)!,
            quantity: c.quantity,
            languageCode: c.languageCode
        }));

        assertDeckRules(leaderVariant, lines);

        return { lines, leaderVariant };
    }
}