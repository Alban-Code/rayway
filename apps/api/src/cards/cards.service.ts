import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CardQueryDto } from "./dto/card-query.dto";
import { Prisma } from "../../generated/prisma/client";

@Injectable()
export class CardsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: CardQueryDto) {
        const { colors, type, tags, q, page = 1, limit = 20 } = query;

        const where = {
            ...(colors?.length && { colors: { hasSome: colors } }),
            ...(type && { type }),
            ...(q && { name: { contains: q, mode: Prisma.QueryMode.insensitive } }),
            ...(tags?.length && { tags: { some: { tag: { in: tags } } } })
        };

        const [data, total] = await Promise.all([
            this.prisma.card.findMany({
                where,
                include: { variants: true, tags: { select: { tag: true, confidence: true } } },
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.card.count({ where })
        ]);

        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }

    };

    async findOne(code: string) {
        const card = await this.prisma.card.findUnique({ where: { code }, include: { variants: true, tags: true } });

        if (!card) throw new NotFoundException(`Card ${code} not found`);
        return card;
    }


}
