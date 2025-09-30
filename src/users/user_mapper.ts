import { CreateUsersDto } from "./dto/create-users.dto";
import { UpdateUsersDto } from "./dto/update-users.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { User } from "./entities/user.entity";

// Mapeador entre DTO/User y el payload SCIM2 de WSO2
export class UserMapper {
    static toWSO2PayloadForCreate(dto: CreateUsersDto): any {
        return {
            userName: dto.username, // tu DTO tiene `name`, no `userName`
            name: {
                givenName: dto.firstName ?? "",
                familyName: dto.lastName ?? "",
            },
            emails: dto.email ? [{ value: dto.email, primary: true }] : [],
            password: dto.plainCipherPassword,
            active: dto.isActive ?? true,
        };
    }

    static toWSO2PayloadForUpdate(dto: UpdateUsersDto): any {
        const payload: any = {};

        if (dto.username) {
            payload.userName = dto.username;
        }
        if (dto.firstName || dto.lastName) {
            payload.name = {
                givenName: dto.firstName ?? "",
                familyName: dto.lastName ?? "",
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
    static fromWSO2Response(data: any): User {
        return {
            id: data.id,
            username: data.userName,
            email: data.emails?.[0]?.value,
            isActive: data.active,
        } as User;
    }
    static toResponseList(users: User[]): UserResponseDto[] {
        return users.map((user) => this.toResponseDto(user));
    }
    static toDto(user: User): UserResponseDto {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            roles: user.roles?.map((role) => ({
                id: role.id,
                name: role.name,
                permissions: role.permissions?.map((p) => p.name) ?? [],
            })) ?? [],
            structures: user.structures?.map((s) => ({
                id: s.id,
                name: s.name,
            })) ?? [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    static toList(users: User[]): UserResponseDto[] {
        return users.map((u) => this.toDto(u));
    }
}
