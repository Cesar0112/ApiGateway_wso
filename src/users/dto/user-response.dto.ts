import { ApiProperty } from '@nestjs/swagger';
class RoleDto {
  @ApiProperty({ example: '53ea3301-d42c-4989-bf13-15bcbdcc25df' })
  id: string;

  @ApiProperty({ example: 'admin' })
  name: string;
}

class StructureDto {
  @ApiProperty({ example: 'aab54598-e9f0-41fd-9e7b-c11e1cc08753' })
  id: string;

  @ApiProperty({ example: 'Xetid' })
  name: string;
}
export class UserResponseDto {
  @ApiProperty({ example: '17e8e4a7-84af-4a38-9795-ee2f78311d8c' })
  id: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'Carlos' })
  firstName: string;

  @ApiProperty({ example: 'Perez' })
  lastName: string;

  @ApiProperty({ example: 'jdoe@corp.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [StructureDto] })
  structures: StructureDto[];

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];

  @ApiProperty({ example: '2025-06-11T20:03:16.574Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-07-28T15:20:22.717Z' })
  updatedAt: Date;
}
