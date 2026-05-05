// create-deck.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeckDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    leaderId!: string; // code de la carte leader ex: "OP01-001"

    @IsString()
    description?: string;
}