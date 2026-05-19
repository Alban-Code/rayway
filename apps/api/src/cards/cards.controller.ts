import { Controller, Get, Param, Query } from '@nestjs/common';
import { CardsService } from './cards.service.js';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardListItemDto, PaginatedCardsDto } from './dto/card-response.dto.js';
import { CardQueryDto } from './dto/card-query.dto.js';
import { CardDetailQueryDto } from './dto/card-detail-query.dto.js';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('cards')
@Controller('cards')
@AllowAnonymous()
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @Get()
    @ApiOperation({ summary: "Liste paginée des cartes avec filtres " })
    @ApiOkResponse({ type: PaginatedCardsDto })
    findAll(@Query() query: CardQueryDto): Promise<PaginatedCardsDto> {
        return this.cardsService.findAll(query);
    }

    @Get(':code')
    @ApiOperation({ summary: "Détail d'une carte par son code" })
    @ApiOkResponse({ type: CardListItemDto })
    @ApiNotFoundResponse({ description: "Card not found" })
    findOne(@Param('code') code: string, @Query() query: CardDetailQueryDto): Promise<CardListItemDto> {
        return this.cardsService.findOne(code, query.lang);
    }
}
