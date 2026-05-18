import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CardQueryDto } from './dto/card-query.dto';
import { PaginatedCardsDto } from './dto/card-response.dto';
import { DEFAULT_LANG } from '../common/constants';
import { cardInclude } from './internal/card-include';
import { buildCardWhere } from './internal/card-where';
import { mapCard } from './internal/card-mapper';

@Injectable()
export class CardsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: CardQueryDto): Promise<PaginatedCardsDto> {
        const { limit = 20, page = 1 } = query;
        const lang = query.lang ?? DEFAULT_LANG;

        const where = buildCardWhere(query);
        const include = cardInclude(lang);

        const skip = (page - 1) * limit;
        const take = limit;

        const [cards, total] = await this.prisma.$transaction([this.prisma.card.findMany({ where, include, skip, take, orderBy: { code: 'asc' } }), this.prisma.card.count({ where })]);

        return { items: cards.map((c) => mapCard(c, lang)), total, page, limit };
    }


}
