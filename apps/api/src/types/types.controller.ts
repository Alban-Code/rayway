import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { TypesService } from "./types.service.js";
import { TypeQueryDto } from "./dto/type-query.dto.js";
import { TypeDto } from "./dto/type-response.dto.js";

@ApiTags('types')
@Controller('types')
@AllowAnonymous()
export class TypesController {

    constructor(private readonly typesService: TypesService) { }

    @Get()
    @ApiOperation({ summary: "Liste paginée des cartes avec filtres " })
    @ApiOkResponse({ type: TypeQueryDto })
    findAll(@Query() query: TypeQueryDto): Promise<TypeDto[]> {
        return this.typesService.findAll(query);
    }

}