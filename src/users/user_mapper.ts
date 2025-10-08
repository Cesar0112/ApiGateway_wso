import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Structure } from '../structures/entities/structure.entity';
import { RoleMapper } from '../roles/role.mapper';

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
  static fromCreateUsersDtoToWSO2Payload(dto: CreateUsersDto): any {
    return {
      name: {
        givenName: dto.firstName ?? '',
        familyName: dto.lastName ?? '',
      },
      userName: dto.username,
      emails: dto.email ? [{ value: dto.email, primary: true }] : [],
      password: dto.plainCipherPassword,
    };
  }

  static fromUpdateUsersDtoToWSO2Payload(dto: UpdateUsersDto): any {
    const payload: any = {};

    if (dto.username) {
      payload.userName = dto.username;
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
  }

  // ------------------------
  // FROM WSO2 RESPONSE → ENTITY
  // ------------------------
  static fromWSO2ResponseToUser(
    data: any,
    roles: Role[] = [],
    groups: Structure[] = [],
  ): User {
    return {
      id: data.id,
      username: data.userName,
      password: '',
      email: data.emails?.[0] ?? null,
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
      username: user.username,
      email: user.email ?? '',
      isActive: user.isActive,
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
