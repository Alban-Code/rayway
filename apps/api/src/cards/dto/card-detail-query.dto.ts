import { IsOptional, IsString, Length } from "class-validator";
import { DEFAULT_LANG } from "../../common/constants";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class CardDetailQueryDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ default: "en", example: "fr" })
    @Length(2, 5)
    lang: string = DEFAULT_LANG;
}