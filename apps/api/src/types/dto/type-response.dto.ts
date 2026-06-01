import { ApiProperty } from "@nestjs/swagger"

export class TypeDto {
    @ApiProperty({ example: "straw-hat-crew" })
    code!: string

    @ApiProperty({ example: "Straw Hat Crew" })
    label!: string
}