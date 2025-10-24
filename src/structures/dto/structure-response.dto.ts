import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "src/users/dto/user-response.dto";

export class StructureResponseDto {
    @ApiProperty({ example: 'aab54598-e9f0-41fd-9e7b-c11e1cc08753' })
    id: string;

    @ApiProperty({ example: 'Xetid' })
    name: string;

    @ApiProperty({ example: StructureResponseDto })
    parent: StructureResponseDto;

    @ApiProperty({ example: [StructureResponseDto] })
    children: StructureResponseDto[];

    @ApiProperty({ example: [UserResponseDto] })
    users: UserResponseDto[];
}