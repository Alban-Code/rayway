import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { DecksService } from "./decks.service.js";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { DeckQueryDto } from "./dto/deck-query.dto.js";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { auth } from "../auth/auth.js";
import { DeckDetailDto, PaginatedDecksDto } from "./dto/deck-response.dto.js";
import { CreateDeckDto } from "./dto/create-deck.dto.js";

@ApiTags('decks')
@Controller('decks')
export class DecksController {
    constructor(private readonly decksService: DecksService) { }

    @Get()
    @ApiOperation({ summary: "List of decks of a connected user " })
    @ApiOkResponse({ type: PaginatedDecksDto })
    @ApiUnauthorizedResponse()
    findAll(@Query() query: DeckQueryDto, @Session() session: UserSession<typeof auth>): Promise<PaginatedDecksDto> {
        return this.decksService.findAll(session.user.id, query);
    }

    @Get(':id')
    @ApiOperation({ summary: "Details of a specific deck" })
    @ApiOkResponse({ type: DeckDetailDto })
    @ApiUnauthorizedResponse()
    @ApiNotFoundResponse()
    findbyId(@Param('id') id: string, @Session() session: UserSession<typeof auth>): Promise<DeckDetailDto> {
        return this.decksService.findById(session.user.id, id)
    }

    @Post()
    @ApiOperation({ summary: "Creation of a deck" })
    @ApiCreatedResponse({ type: DeckDetailDto })
    @ApiUnauthorizedResponse()
    @ApiBadRequestResponse()
    createDeck(@Body() createDeckDto: CreateDeckDto, @Session() session: UserSession<typeof auth>): Promise<DeckDetailDto> {
        return this.decksService.create(session.user.id, createDeckDto);
    }

    @Put(':id')
    @ApiOperation({ summary: "Update an existing deck" })
    @ApiOkResponse({ type: DeckDetailDto })
    @ApiUnauthorizedResponse()
    @ApiNotFoundResponse()
    updateDeck(@Body() updatedDeckDto: CreateDeckDto, @Param('id') deckId: string, @Session() session: UserSession<typeof auth>): Promise<DeckDetailDto> {
        return this.decksService.update(deckId, session.user.id, updatedDeckDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: "Delete an existing deck" })
    @ApiUnauthorizedResponse()
    @ApiNotFoundResponse()
    @ApiNoContentResponse()
    deleteDeck(@Param('id') deckId: string, @Session() session: UserSession<typeof auth>): Promise<void> {
        return this.decksService.delete(deckId, session.user.id);
    }
}