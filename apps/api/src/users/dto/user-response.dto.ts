import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {

    @ApiProperty({ type: String, nullable: false })
    id!: string;

    @ApiProperty({ type: String, nullable: false })
    email!: string;

    @ApiProperty({ type: String, nullable: false })
    name!: string;

    @ApiProperty({ type: Boolean, nullable: false })
    emailVerified!: boolean;

    @ApiProperty({ type: String, description: "URL of the profile picture", nullable: true })
    image!: string | null;

    @ApiProperty({ type: Date, nullable: false })
    createdAt!: Date;
}