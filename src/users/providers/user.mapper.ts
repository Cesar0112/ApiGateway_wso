
import { UserResponseDto } from "../dto/user-response.dto";
import { User } from "../../entities/user.entity";
import { Structure } from "../../entities/structure.entity";
import { StructureMapper } from "../../structures/structure.mapper";
import { CreateUsersDto } from "../dto/create-users.dto";
import { Role } from "../../entities/role.entity";

export class UserMapper {
    static toResponseDto(user: User): UserResponseDto {
        return {
            id: user.id,
            userName: user.userName,
            email: user.email ?? '',
            isActive: user.isActive ?? false,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            roles:
                user.roles?.map((role: Role) => ({
                    id: role.id ?? '',
                    name: role.name,
                    permissions: role.permissions?.map((p) => p.value) ?? [],
                })) ?? [],
            /*structures:
              user.structures?.map((s: Structure) => ({
                id: s.id ?? '',
                name: s.name,
                parent: 
                children: null,
                users: null
              })) ?? [],*/
            structures: user.structures?.map((s: Structure) => StructureMapper.fromStructureToStructureDto(s)) ?? [],
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
    static fromUserToCreateUserDto(user: User): CreateUsersDto {
        const { password, roles, structures, ...rest } = user;
        return {
            ...rest,
            plainCipherPassword: password,
            roleIds: roles?.map((r) => r.id),
            structureIds: structures?.map((s) => s.id),
        };
    }
}