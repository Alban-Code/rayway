// update-deck.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateDeckDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}