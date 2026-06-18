import { Transform, Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Color } from "../../generated/prisma/enums.js";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class DeckQueryDto {
    @IsOptional()
    @IsArray()
    @IsEnum(Color, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @ApiPropertyOptional({ enum: Color, isArray: true, example: ["Red", "Blue"] })
    colors?: Color[];

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: "Recherche sur le nom du deck ou du Leader" })
    q?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @ApiPropertyOptional({ minimum: 1, default: 1 })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
    limit?: number = 20;

}