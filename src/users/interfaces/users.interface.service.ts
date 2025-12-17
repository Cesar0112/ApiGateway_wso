import { CreateUsersDto } from "../dto/create-users.dto";
import { UpdateUsersDto } from "../dto/update-users.dto";
import { User } from "../../entities/user.entity";

export interface IUsersProvider {
    getUserByUserId(id: string, token: string): Promise<User | null>;
    getUserByUsername(username: string, token: string): Promise<User | null>;
    getUsers(token: string): Promise<User[]>;
    create(userData: CreateUsersDto, token: string): Promise<User>;
    update(id: string, updateData: Partial<CreateUsersDto>, token: string): Promise<User>;
    delete(id: string, token: string): Promise<void>;
    deleteByUsername(username: string, token: string): Promise<void>;
    getUsersFromStructure(structId: string, token: string): Promise<User[]>;
    getUsersFromStructureName(structName: string, token: string): Promise<User[]>;
    updateUserStructuresByIds(userId: string, structuresIds: string[], token: string,): Promise<void>;
    updateByUsername(username: string, dto: UpdateUsersDto, token: string,): Promise<User | null>;
    disableOrEnableUser(userId: string, active: boolean, token: string,): Promise<void>;
}
export const USERS_PROVIDER_TOKEN = Symbol('USERS_PROVIDER');
