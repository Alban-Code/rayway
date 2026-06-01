import { IsOptional, IsEnum, IsInt, Min, Max, IsArray, IsString, Length } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Attribute, Category, Color } from "../../generated/prisma/enums.js";
import { DEFAULT_LANG } from "../../common/constants.js";

export class CardQueryDto {
    @IsOptional()
    @IsArray()
    @IsEnum(Color, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @ApiPropertyOptional({ enum: Color, isArray: true, example: ["Red", "Blue"] })
    colors?: Color[];

    @IsOptional()
    @IsEnum(Category)
    @ApiPropertyOptional({ enum: Category, example: "Leader" })
    category?: Category;

    @IsOptional()
    @IsEnum(Attribute)
    @ApiPropertyOptional({ enum: Attribute, example: "Slash" })
    attribute?: Attribute

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @ApiPropertyOptional({ type: String, isArray: true, example: ["drawer", "searcher"] })
    tags?: string[];

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: "Recherche full-text sur le nom et l'effet" })
    q?: string;

    @IsOptional()
    @IsString()
    @Length(2, 5)
    @ApiPropertyOptional({ default: "en", example: "fr" })
    lang: string = DEFAULT_LANG;

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