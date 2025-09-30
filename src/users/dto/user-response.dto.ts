// users/dto/user-response.dto.ts
import { RoleResponseDto } from '../../roles/dto/role-response.dto';
import { StructureResponseDto } from '../../structures/dto/structure-response.dto';

export class UserResponseDto {
    id: string;
    username: string;
    email?: string;
    isActive: boolean;
    roles: RoleResponseDto[];
    structures: StructureResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}
