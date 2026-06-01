import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";
import { DEFAULT_LANG } from "../../common/constants.js";

export class TypeQueryDto {

    @IsOptional()
    @IsString()
    @Length(2, 5)
    @ApiPropertyOptional({ default: "en", example: "fr" })
    lang: string = DEFAULT_LANG;
}