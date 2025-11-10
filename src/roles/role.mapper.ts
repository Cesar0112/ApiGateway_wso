import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { BadRequestException } from '@nestjs/common';
import { WSO2Response } from 'src/users/services/wso2/user.wso2.mapper';

class WSORoleResponse {
  schemas?: String[] = ['urn:ietf:params:scim:schemas:extension:2.0:Role'];
  displayName!: String;
  permissions?: Permission[] = [];
}
export class RoleMapper {
  // De entidad local -> payload para WSO2
  static toWSO2Payload(role: Partial<Role>) {
    if (!role.name) {
      throw new BadRequestException('Role name is empty or undefined');
    }
    const payload: WSORoleResponse = {
      displayName: role.name,
    };

    if (role.permissions && role.permissions.length > 0) {
      payload.permissions = role.permissions.map((p: Permission) => ({
        value: p.value,
        display: p.displayName,
      }));
    }

    return payload;
  }

  // De respuesta de WSO2 -> entidad local
  static fromWSO2Response(data: WSO2Response): Role {
    const role = new Role();
    role.id = data.id;
    role.name = data.displayName ?? '';
    if (data.permissions) {
      role.permissions =
        data.permissions?.map((p: any) => {
          const perm = new Permission();
          perm.value = p.value;
          perm.displayName = p.display ?? p.displayName ?? '';
          return perm;
        }) ?? [];
    }
    return role;
  }
  static fromCreateDto(dto: CreateRoleDto): Role {
    const role = new Role();
    role.name = dto.name;

    // mapear los permisos si vienen
    if (dto.permissionDisplayableName && !dto.permissionValues) {
      role.permissions = dto.permissionDisplayableName.map((per) => {
        const permission = new Permission();
        permission.displayName = per;
        return permission;
      });
    }

    if (!dto.permissionDisplayableName && dto.permissionValues) {
      role.permissions = dto.permissionValues.map((per) => {
        const permission = new Permission();
        permission.value = per;
        return permission;
      });
    }
    return role;
  }
}
