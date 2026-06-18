import { ApiProperty } from "@nestjs/swagger";
import { CardVariantDto } from "../../cards/dto/card-response.dto.js";
import { Color } from "../../generated/prisma/enums.js";

export class DeckLeaderDto {
    @ApiProperty({ type: String, description: "Variant code of the deck's leader", example: "OP01-001" })
    variantCode!: string;

    @ApiProperty({ type: String, example: "Monkey D. Luffy" })
    name!: string;

    @ApiProperty({ type: String, description: "Language the leader was added in", example: "en" })
    languageCode!: string;

    @ApiProperty({ type: String, nullable: true, description: "Resolved in the leader's stored language; null if no image exists for that language" })
    imageUrl!: string | null;

    @ApiProperty({ isArray: true, enum: Color })
    colors!: Color[];
}

export class DeckCardDto {
    @ApiProperty({ type: String, description: "Language this occurrence was added in", example: "en" })
    languageCode!: string;

    @ApiProperty({ type: CardVariantDto })
    variant!: CardVariantDto;

    @ApiProperty({ type: Number, minimum: 1, maximum: 4, description: "Number of copies of this card (1-4)" })
    quantity!: number;
}

export class DeckListItemDto {
    @ApiProperty({ type: String })
    id!: string;

    @ApiProperty({ type: String })
    name!: string;

    @ApiProperty({ type: String, nullable: true })
    description!: string | null;

    @ApiProperty({ type: DeckLeaderDto })
    leader!: DeckLeaderDto;

    @ApiProperty({ type: Boolean })
    isPublic!: boolean;

    @ApiProperty({ type: Number, description: "Sum of card quantities (leader excluded)" })
    cardCount!: number;

    @ApiProperty({ type: String, format: "date-time" })
    createdAt!: Date;

    @ApiProperty({ type: String, format: "date-time" })
    updatedAt!: Date;
}

export class PaginatedDecksDto {
    @ApiProperty({ type: [DeckListItemDto] })
    items!: DeckListItemDto[];

    @ApiProperty({ type: Number })
    total!: number;

    @ApiProperty({ type: Number })
    page!: number;

    @ApiProperty({ type: Number })
    limit!: number;
}

export class DeckDetailDto {
    @ApiProperty({ type: String })
    id!: string;

    @ApiProperty({ type: String })
    name!: string;

    @ApiProperty({ type: String, nullable: true })
    description!: string | null;

    @ApiProperty({ type: DeckLeaderDto })
    leader!: DeckLeaderDto;

    @ApiProperty({ type: [CardVariantDto] })
    cards!: CardVariantDto[]

    @ApiProperty({ type: Boolean })
    isPublic!: boolean;

    @ApiProperty({ type: Number, description: "Sum of card quantities (leader excluded)" })
    cardCount!: number;

    @ApiProperty({ type: String, format: "date-time" })
    createdAt!: Date;

    @ApiProperty({ type: String, format: "date-time" })
    updatedAt!: Date;
}