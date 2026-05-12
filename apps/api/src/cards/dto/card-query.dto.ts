// dto/card-query.dto.ts
import { IsOptional, IsEnum, IsInt, Min, IsArray, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Color, CardType } from "../../generated/prisma/enums";

export class CardQueryDto {
    @IsOptional()
    @IsArray()
    @IsEnum(Color, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    colors?: Color[];

    @IsOptional()
    @IsEnum(CardType)
    type?: CardType;

    @IsOptional()
    @IsArray()
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    tags?: string[];

    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}