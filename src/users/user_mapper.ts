import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Structure } from '../structures/entities/structure.entity';
import { RoleMapper } from '../roles/role.mapper';
import { Permission } from 'src/permissions/entities/permission.entity';

export class UserMapper {
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
      emails: dto.email
        ? [{ value: dto.email, type: 'work', primary: true }]
        : [],
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

  /*static fromUpdateUsersDtoToWSO2Payload(dto: UpdateUsersDto): any {
    const payload: any = {};

    if (dto.userName) {
      payload.userName = dto.userName;
    }
    if (dto.firstName || dto.lastName) {
      payload.name = {
        givenName: dto.firstName ?? '',
        familyName: dto.lastName ?? '',
      };
    }
    if (dto.email) {
      payload.emails = [{ value: dto.email, primary: true }];
    }
    if (dto.isActive !== undefined) {
      payload.active = dto.isActive;
    }

    return payload;
  }*/
  static fromUpdateUsersDtoToWSO2Payload(dto: UpdateUsersDto): any {
    const payload: any = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    };

    if (dto.userName) payload.userName = dto.userName;

    if (dto.firstName || dto.lastName) {
      payload.name = {};
      if (dto.firstName) payload.name.givenName = dto.firstName;
      if (dto.lastName) payload.name.familyName = dto.lastName;

      /*payload['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] = {
        givenName: dto.firstName ?? '',
        familyName: dto.lastName ?? '',
      };*/
    }

    if (dto.email) payload.emails = [{ value: dto.email, primary: true }];

    if (dto.isActive !== undefined) payload.active = dto.isActive;

    return payload;
  }

  // ------------------------
  // FROM WSO2 RESPONSE → ENTITY
  // ------------------------

  static fromWSO2ResponseToUser(
    data: WSO2Response,
    roles: Role[] = [],
    groups: Structure[] = [],
  ): User {
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

  // ------------------------
  // TO RESPONSE DTO
  // ------------------------
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.userName,
      email: user.email ?? '',
      isActive: user.isActive,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      roles:
        user.roles?.map((role: Role) => ({
          id: role.id ?? '',
          name: role.name,
          permissions: role.permissions?.map((p) => p.value) ?? [],
        })) ?? [],
      structures:
        user.structures?.map((s: Structure) => ({
          id: s.id ?? '',
          name: s.name,
        })) ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }

  // ------------------------
  // TO ENTITY (CREATE/UPDATE)
  // ------------------------
  /*static fromCreateDto(dto: CreateUsersDto): User {
        return {
            id: "",
            username: dto.username,
            password: dto.plainCipherPassword,
            email: dto.email,
            isActive: dto.isActive ?? true,
            roles: dto.roleIds ?? [],
            structures: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;
    }*/

  /*static fromUpdateDto(dto: UpdateUsersDto, existingUser: User): User {
        return {
            ...existingUser,
            username: dto.username ?? existingUser.username,
            email: dto.email ?? existingUser.email,
            isActive: dto.isActive ?? existingUser.isActive,
            updatedAt: new Date(),
        } as User;
    }*/

  // ------------------------
  // HELPERS (ROLES/STRUCTURES)
  // ------------------------
  static mapRoles(
    roles: Role[],
  ): { id: string; name: string; permissions: string[] }[] {
    return roles.map((role) => ({
      id: role.id ?? '',
      name: role.name,
      permissions: role.permissions?.map((p) => p.value) ?? [],
    }));
  }

  static mapStructures(
    structures: Structure[],
  ): { id: string; name: string }[] {
    return structures.map((s) => ({
      id: s.id ?? '',
      name: s.name,
    }));
  }
}
export class WSO2Response {
  id: string;
  userName: string;
  emails: string[];
  active: boolean;
  meta: { created: any; lastModified: any };
  displayName?: string;
  permissions?: Permission[];
  name?: { givenName: string; familyName: string };
}
export class WSO2Payload {
  schemas: [
    'urn:ietf:params:scim:schemas:core:2.0:User',
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
  ];
  userName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
    givenName: string;
    familyName: string;
  };
  emails: [{ value: string; type: 'work' | 'personal'; primary?: boolean }];
  password: string;
  active: boolean;
  phoneNumbers?: [{ value: string; type: 'mobile' }];
  displayName?: string;
}
