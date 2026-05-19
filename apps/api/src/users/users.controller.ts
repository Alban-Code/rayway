import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { UserResponseDto } from "./dto/user-response.dto.js";
import { UsersService } from "./users.service.js";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { auth } from "../auth/auth.js";

@ApiTags('users')
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: "Retourne les infos utilisateurs de l'utilisateur" })
    @ApiOkResponse({ type: UserResponseDto })
    @ApiUnauthorizedResponse()
    async findMe(@Session() session: UserSession<typeof auth>): Promise<UserResponseDto> {
        return this.usersService.findById(session.user.id);
    }
}