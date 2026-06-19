import { Controller, Get, Param, Query } from "@nestjs/common";
import { DecksService } from "./decks.service.js";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { DeckQueryDto } from "./dto/deck-query.dto.js";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { auth } from "../auth/auth.js";
import { DeckDetailDto, PaginatedDecksDto } from "./dto/deck-response.dto.js";

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
}