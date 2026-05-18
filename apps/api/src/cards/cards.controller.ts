import { Controller, Get, Query } from '@nestjs/common';
import { CardsService } from './cards.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedCardsDto } from './dto/card-response.dto';
import { CardQueryDto } from './dto/card-query.dto';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @Get()
    @ApiOperation({ summary: "Liste paginée des cartes avec filtres " })
    @ApiOkResponse({ type: PaginatedCardsDto })
    findAll(@Query() query: CardQueryDto): Promise<PaginatedCardsDto> {
        return this.cardsService.findAll(query);
    }
}
