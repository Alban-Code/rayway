import { ApiProperty, OmitType } from "@nestjs/swagger";
import { CardTypeDto, CardVariantDto } from "../../cards/dto/card-response.dto.js";
import { Attribute, Category, Color, Rarity } from "../../generated/prisma/enums.js";

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

export class DeckLeaderDetailDto extends DeckLeaderDto {
    @ApiProperty({ isArray: true, enum: Attribute })
    attributes!: Attribute[];

    @ApiProperty({ type: [CardTypeDto] })
    types!: CardTypeDto[];

    @ApiProperty({ type: String, nullable: true })
    effect!: string | null;

    @ApiProperty({ type: Number, nullable: true })
    power!: number | null;

    @ApiProperty({ type: Number })
    life!: number | null;
}

export class DeckCardDto {
    @ApiProperty({ type: String, example: "Nami" })
    name!: string;

    @ApiProperty({ type: String, description: "Language this occurrence was added in", example: "en" })
    languageCode!: string;

    @ApiProperty({ type: CardVariantDto })
    variant!: CardVariantDto;

    @ApiProperty({ type: Number, minimum: 1, maximum: 4, description: "Number of copies of this card (1-4)" })
    quantity!: number;

    @ApiProperty({ isArray: true, enum: Attribute })
    attributes!: Attribute[];

    @ApiProperty({ enum: Rarity })
    rarity!: Rarity;

    @ApiProperty({ type: [CardTypeDto] })
    types!: CardTypeDto[];

    @ApiProperty({ type: String, nullable: true })
    effect!: string | null;

    @ApiProperty({ type: String, nullable: true })
    triggerEffect!: string | null;

    @ApiProperty({ enum: Category, example: "Leader" })
    category!: Category;

    @ApiProperty({ isArray: true, enum: Color })
    colors!: Color[];

    @ApiProperty({ type: Number, nullable: true })
    cost!: number | null;

    @ApiProperty({ type: Number, nullable: true })
    counterAmount!: number | null;

    @ApiProperty({ type: Number, nullable: true })
    power!: number | null;
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

export class DeckDetailDto extends OmitType(DeckListItemDto, ['leader'] as const) {
    @ApiProperty({ type: DeckLeaderDetailDto })
    leader!: DeckLeaderDetailDto;

    @ApiProperty({ type: [DeckCardDto] })
    cards!: DeckCardDto[];
}