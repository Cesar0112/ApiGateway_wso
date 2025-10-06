import { PermissionResponseDto } from '../../permissions/dto/permission-response.dto';

export class RoleResponseDto {
  id: string;
  name: string;
  permissions: PermissionResponseDto[]; // si quieres expandir permisos
}
