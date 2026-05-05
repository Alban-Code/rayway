// add-card.dto.ts
import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCardDto {
    @IsString()
    @IsNotEmpty()
    cardVariantId!: string;

    @IsInt()
    @Min(1)
    @Max(4)
    @Type(() => Number)
    quantity!: number;
}