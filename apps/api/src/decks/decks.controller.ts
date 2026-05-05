// decks.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { AddCardDto } from './dto/add-card.dto';

@Controller('decks')
export class DecksController {
    constructor(private readonly decksService: DecksService) { }

    @Get()
    findAll() {
        return this.decksService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.decksService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDeckDto) {
        return this.decksService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeckDto) {
        return this.decksService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.decksService.remove(id);
    }

    @Post(':id/cards')
    addCard(@Param('id', ParseIntPipe) id: number, @Body() dto: AddCardDto) {
        return this.decksService.addCard(id, dto);
    }

    @Delete(':id/cards/:cardCode')
    removeCard(@Param('id', ParseIntPipe) id: number, @Param('cardCode') cardCode: string) {
        return this.decksService.removeCard(id, cardCode);
    }
}