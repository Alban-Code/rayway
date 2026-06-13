import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CardQueryDto } from './dto/card-query.dto.js';
import { CardListItemDto, PaginatedCardsDto } from './dto/card-response.dto.js';
import { DEFAULT_LANG } from '../common/constants.js';
import { cardInclude } from './internal/card-include.js';
import { buildCardWhere } from './internal/card-where.js';
import { mapCard } from './internal/card-mapper.js';

@Injectable()
export class CardsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: CardQueryDto): Promise<PaginatedCardsDto> {
        const { limit = 30, page = 1 } = query;
        const lang = query.lang ?? DEFAULT_LANG;

        const where = buildCardWhere(query);
        const include = cardInclude(lang);

        const skip = (page - 1) * limit;
        const take = limit;

        const [cards, total] = await this.prisma.$transaction([this.prisma.card.findMany({ where, include, skip, take, orderBy: { code: 'asc' } }), this.prisma.card.count({ where })]);

        return { items: cards.map((c) => mapCard(c, lang)), total, page, limit };
    }

    async findOne(code: string, lang: string = DEFAULT_LANG): Promise<CardListItemDto> {
        const card = await this.prisma.card.findUnique({ where: { code }, include: cardInclude(lang) });
        if (!card) {
            throw new NotFoundException(`Card ${code} not found`);
        }

        return mapCard(card, lang);

    }


}
