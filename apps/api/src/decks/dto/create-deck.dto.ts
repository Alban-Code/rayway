import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

class DeckLeaderInputDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: "OP01-001" })
    variantCode!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: "en" })
    languageCode!: string;
}

class DeckCardInputDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: "OP01-016_p1" })
    variantCode!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: "en" })
    languageCode!: string;

    @IsInt()
    @Min(1)
    @Max(4)
    @ApiProperty({ minimum: 1, maximum: 4, example: 4 })
    quantity!: number;
}

export class CreateDeckDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: "Red Luffy Aggro" })
    name!: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    description?: string;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ default: false })
    isPublic?: boolean;

    @ValidateNested()
    @Type(() => DeckLeaderInputDto)
    @ApiProperty({ type: DeckLeaderInputDto })
    leader!: DeckLeaderInputDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DeckCardInputDto)
    @ApiProperty({ type: [DeckCardInputDto] })
    cards!: DeckCardInputDto[];
}