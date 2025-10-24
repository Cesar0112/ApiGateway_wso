import { ApiProperty } from '@nestjs/swagger';
import { StructureResponseDto } from 'src/structures/dto/structure-response.dto';
class RoleDto {
  @ApiProperty({ example: '53ea3301-d42c-4989-bf13-15bcbdcc25df' })
  id: string;

  @ApiProperty({ example: 'admin' })
  name: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '17e8e4a7-84af-4a38-9795-ee2f78311d8c' })
  id: string;

  @ApiProperty({ example: 'admin' })
  userName: string;

  @ApiProperty({ example: 'Carlos' })
  firstName: string;

  @ApiProperty({ example: 'Perez' })
  lastName: string;

  @ApiProperty({ example: 'jdoe@corp.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [StructureResponseDto] })
  structures: StructureResponseDto[];

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];

  @ApiProperty({ example: '2025-06-11T20:03:16.574Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-07-28T15:20:22.717Z' })
  updatedAt: Date;
}
