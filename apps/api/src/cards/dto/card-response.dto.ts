import { ApiProperty } from "@nestjs/swagger";
import { Category, Color, Attribute, Rarity, VariantType } from "../../generated/prisma/enums";

export class CardTypeDto {
    @ApiProperty({ example: "straw-hat-crew" })
    code!: string;

    @ApiProperty({ example: "Straw Hat Crew" })
    label!: string;
}

export class CardVariantDto {
    @ApiProperty({ type: String, example: "OP01-001_r1" })
    variantCode!: string;

    @ApiProperty({ example: "Regular", enum: VariantType })
    variantType!: VariantType;

    @ApiProperty({ type: Boolean })
    isPromo!: boolean;

    @ApiProperty({ type: Boolean })
    isStarter!: boolean;

    @ApiProperty({ description: "URL of the image of the card in the selected language", type: String, nullable: true })
    imageUrl!: string | null;
}

export class CardListItemDto {
    @ApiProperty({ type: String, example: "OP01-001" })
    code!: string;

    @ApiProperty({ type: String, example: "Monkey D. Luffy" })
    name!: string;

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

    @ApiProperty({ type: Number, nullable: true })
    life!: number | null;

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

    @ApiProperty({ type: [CardVariantDto] })
    variants!: CardVariantDto[];

    @ApiProperty({ type: String, example: "OP01" })
    setCode!: string;

    @ApiProperty({ type: String, example: "fr" })
    language!: string;
}

export class PaginatedCardsDto {
    @ApiProperty({ type: [CardListItemDto] })
    items!: CardListItemDto[];

    @ApiProperty()
    total!: number;

    @ApiProperty()
    page!: number;

    @ApiProperty()
    limit!: number;
}