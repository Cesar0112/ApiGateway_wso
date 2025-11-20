import { CreateUsersDto } from '../../dto/create-users.dto';
import { UpdateUsersDto } from '../../dto/update-users.dto';
import { User } from '../../entities/user.entity';
import { Role } from '../../../roles/entities/role.entity';
import { Structure } from '../../../structures/entities/structure.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { StructureNameHelper } from 'src/structures/structure.helper';
import { ICasdoorUser } from './users.casdoor.interface';

export class UserCasdoorMapper {
  static fromRecordToCasdoor(user: Record<string, any>): ICasdoorUser {
    throw new Error('Method not implemented.');
  }
  static fromCreateDtoToCasdoor(dto: CreateUsersDto): ICasdoorUser {
    throw new Error('Method not implemented.');
  }
  static fromCasdoorToUser(casdoorUser: ICasdoorUser, existingRoles?: Role[], existingStructures?: Structure[]): User | null {
    if (!casdoorUser) return null;
    const user = new User();
    user.id = casdoorUser.id;
    user.userName = casdoorUser.name;
    user.email = casdoorUser.email || "";
    user.firstName = casdoorUser.firstName || "";
    user.lastName = casdoorUser.lastName || "";
    user.isActive = !casdoorUser.isForbidden && !casdoorUser.isDeleted;
    user.password = casdoorUser.password || ''; // Casdoor no expone hash, se gestiona aparte

    // === ROLES ===
    // Casdoor: roles: Role[] → { name, owner }
    // Tu dominio: roles: Role[] → entidades completas
    if (casdoorUser.roles && existingRoles) {
      const roleMap = new Map(existingRoles.map(r => [r.name, r]));

      user.roles = casdoorUser.roles
        .map((r) => roleMap.get(r.name))
        .filter((role): role is Role => role !== undefined);
    } else {
      user.roles = [];
    }
    // === ESTRUCTURAS (structures) ===
    // Casdoor: groups: string[] → nombres de grupos
    // Tu dominio: structures: Structure[] → entidades
    if (casdoorUser.groups && existingStructures) {
      const structureMap = new Map(existingStructures.map(s => [s.name, s]));

      user.structures = casdoorUser.groups
        .map(groupName => structureMap.get(groupName))
        .filter((structure): structure is Structure => structure !== undefined);
    } else {
      user.structures = [];
    }
    // Fechas (Casdoor devuelve string ISO)
    user.createdAt = casdoorUser.createdTime ? new Date(casdoorUser.createdTime) : new Date();
    user.updatedAt = casdoorUser.updatedTime ? new Date(casdoorUser.updatedTime) : new Date();

    return user;
  }
  static fromUserToCreateUserDto(user: User): CreateUsersDto {
    const { password, roles, structures, ...rest } = user;
    return {
      ...rest,
      plainCipherPassword: password,
      roleIds: roles?.map((r) => r.id),
      structureIds: structures?.map((s) => s.id),
    };
  }
  // ------------------------
  // TO WSO2 PAYLOAD
  // ------------------------
  static fromCreateUsersDtoToWSO2Payload(dto: CreateUsersDto): WSO2Payload {
    const payload: any = {
      userName: dto.userName,
      name: {
        givenName: dto.firstName ?? '',
        familyName: dto.lastName ?? '',
      },
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
        givenName: dto.firstName ?? '',
        familyName: dto.lastName ?? '',
      },
      emails: dto.email ? [dto.email] : [],
      password: dto.plainCipherPassword,
      active: dto.isActive ?? true,
    };

    if (dto.phoneNumber) {
      payload.phoneNumbers = [{ value: dto.phoneNumber, type: 'mobile' }];
    }

    if (dto.displayName) {
      payload.displayName = dto.displayName;
    }

    return payload;
  }
  static fromUpdateUsersDtoToWSO2Payload(dto: UpdateUsersDto): WSO2Payload {
    const payload: any = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    };

    if (dto.userName) payload.userName = dto.userName;

    if (dto.firstName || dto.lastName) {
      payload.name = {};
      if (dto.firstName) payload.name.givenName = dto.firstName;
      if (dto.lastName) payload.name.familyName = dto.lastName;
    }

    if (dto.email) {
      payload.emails = [dto.email];
    }

    if (dto.isActive !== undefined) payload.active = dto.isActive;

    return payload;
  }

  // ------------------------
  // FROM WSO2 RESPONSE → ENTITY
  // ------------------------
  //TODO Optimizar este metodo para que no tengas que pasarle los grupos y roles por parametro sino que ya vengan por el data
  static fromWSO2ResponseToUser(
    data: WSO2Response,
    roles: Role[] = [],
    groups: Structure[] = [],
  ): User {
    groups.forEach((s) => (s.name = StructureNameHelper.getLeafName(s.name)));
    return {
      id: data.id,
      userName: data.userName,
      password: '',
      email: data.emails?.[0] ?? null,
      firstName: data.name?.givenName,
      lastName: data.name?.familyName,
      isActive: data.active,
      roles,
      structures: groups,
      createdAt: data.meta?.created ? new Date(data.meta.created) : undefined,
      updatedAt: data.meta?.lastModified
        ? new Date(data.meta.lastModified)
        : undefined,
    } as User;
  }

}
export class WSO2Response {
  id: string;
  userName: string;
  emails: string[];
  active: boolean;
  meta: { created: any; lastModified: any };
  roles?: [{
    display: string | "everyone",
    value: string
  }];
  groups?: [{
    display: string,
    value: string,
  }]
  displayName?: string;
  permissions?: Permission[];
  name?: { givenName: string; familyName: string };
}

export class WSO2Payload {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'];
  userName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: string[];
  password: string;
  active: boolean;
  phoneNumbers?: [{ value: string; type: 'mobile' }];
  displayName?: string;
}
