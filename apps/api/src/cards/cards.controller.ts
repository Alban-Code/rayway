// cards.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardQueryDto } from './dto/card-query.dto';

@Controller('cards')
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @Get()
    findAll(@Query() query: CardQueryDto) {
        return this.cardsService.findAll(query);
    }

    @Get(':code')
    findOne(@Param('code') code: string) {
        return this.cardsService.findOne(code);
    }
}