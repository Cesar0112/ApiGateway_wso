// ../users/services/users.wso2.service.ts
import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable, Logger,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import { User } from '../../../entities/user.entity';
import { CreateUsersDto } from '../../dto/create-users.dto';
import { IUsersProvider } from '../../interfaces/users.interface.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserCasdoorMapper } from './user.casdoor.mapper';
import { CasdoorResponse, ICasdoorUser } from './users.casdoor.interface';
import { StructuresCasdoorService } from '../../../structures/providers/casdoor/structures_casdoor.service';
import { RoleCasdoorService } from '../../../roles/providers/casdoor/role_casdoor.service';
import { ICasdoorBaseInterfaceService } from '../../../common/casdoorbase.interface.service';
import { CasdoorBaseService } from '../../../common/casdoorbase.service';
@Injectable()
export class UsersCasdoorService implements IUsersProvider, ICasdoorBaseInterfaceService {
    private readonly _logger = new Logger(UsersCasdoorService.name);
    private readonly baseUrl: string;
    private readonly owner: string;
    casdoorBaseObject: CasdoorBaseService;
    constructor(private readonly configService: ConfigService, private readonly httpService: HttpService, @Inject(forwardRef(() => StructuresCasdoorService)) private readonly structuresService: StructuresCasdoorService, @Inject(forwardRef(() => RoleCasdoorService)) private readonly rolesService: RoleCasdoorService) {
        const cfg = this.configService.getConfig().CASDOOR;
        this.baseUrl = cfg.ENDPOINT;
        this.owner = cfg.ORG_NAME || 'built-in';
        this.casdoorBaseObject = new CasdoorBaseService(this.configService);
    }
    public get headers() {
        return this.casdoorBaseObject.headers;
    }

    public getAuthHeaders(token: string) {
        return this.casdoorBaseObject.getAuthHeaders(token);
    }
    public buildApiUrl(path: string): string {
        return this.casdoorBaseObject.buildApiUrl(path);
    }

    public handleError(error: any, context: string) {
        this.casdoorBaseObject.handleError(error, context);
    }

    async getUserById(id: string, token: string): Promise<User | null> {
        try {
            const url = this.buildApiUrl('get-user');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { userId: id },
                    headers: this.getAuthHeaders(token),
                }),
            );
            if (!response.data.data) return null;
            const structures = await this.structuresService.findAll(token);
            const roles = await this.rolesService.getRoles(token);
            return UserCasdoorMapper.fromCasdoorToUser(response.data.data, roles, structures);
        } catch (error) {
            this.handleError(error, `Get user by ID ${id}`);
            return null;
        }
    }

    async getUserByUsername(username: string, token: string): Promise<User | null> {
        try {
            const url = this.buildApiUrl('get-user-by-name');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { name: username, owner: this.owner },
                    headers: this.getAuthHeaders(token),
                }),
            );
            return UserCasdoorMapper.fromCasdoorToUser(response.data);
        } catch (error) {
            if (error.response?.status === 404) return null;
            this.handleError(error, `Get user by username ${username}`);
            return null;
        }
    }

    async getUsers(token: string): Promise<User[]> {
        try {
            const url = this.buildApiUrl('get-users');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { owner: this.owner, pageSize: 100 },
                    headers: this.getAuthHeaders(token),
                }),
            );
            if (!response.data.data) return [];
            return response.data.data.map((u) => UserCasdoorMapper.fromCasdoorToUser(u));
        } catch (error) {
            this.handleError(error, 'Get all users');
            return [];
        }
    }

    async create(userData: CreateUsersDto, token: string): Promise<User> {
        try {
            const url = this.buildApiUrl('add-user');
            const payload = {
                ...userData,
                owner: this.owner,
                signupApplication: this.configService.getConfig().CASDOOR.APP_NAME || 'app-gateway',
            };
            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: this.getAuthHeaders(token),
                }),
            );
            const { status, msg, data } = response.data as CasdoorResponse<ICasdoorUser>;
            if (status !== 'ok') throw new BadRequestException(msg);

            const user = UserCasdoorMapper.fromCasdoorToUser(data);
            if (!user) throw new BadRequestException('Failed to map user data');
            return user;
        } catch (error) {
            this.handleError(error, 'Create user');
            throw error;
        }
    }

    async update(id: string, updateData: Partial<CreateUsersDto>, token: string): Promise<User> {
        try {
            const url = this.buildApiUrl('update-user');
            const payload = {
                ...updateData,
                id,
                owner: this.owner,
            };
            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: this.getAuthHeaders(token),
                }),
            );
            const { status, msg, data } = response.data as CasdoorResponse<ICasdoorUser>;
            if (status !== 'ok') throw new BadRequestException(msg);

            const user = UserCasdoorMapper.fromCasdoorToUser(data);
            if (!user) throw new BadRequestException('Failed to map user data');
            return user;
        } catch (error) {
            this.handleError(error, `Update user ${id}`);
            throw error;
        }
    }

    async delete(id: string, token: string): Promise<void> {
        try {
            const user = await this.getUserById(id, token);
            if (!user) throw new NotFoundException(`User ${id} not found`);

            const url = this.buildApiUrl('delete-user');
            await firstValueFrom(
                this.httpService.post(
                    url,
                    { id, owner: this.owner },
                    { headers: this.getAuthHeaders(token) },
                ),
            );
        } catch (error) {
            this.handleError(error, `Delete user ${id}`);
        }
    }

    async deleteByUsername(username: string, token: string): Promise<void> {
        try {
            const user = await this.getUserByUsername(username, token);
            if (!user) throw new NotFoundException(`User ${username} not found`);
            await this.delete(user.id, token);
        } catch (error) {
            this.handleError(error, `Delete user by username ${username}`);
        }
    }

    async getUsersFromStructure(structId: string, token: string): Promise<User[]> {
        // Casdoor no tiene "estructura" → asumimos es un grupo/rol
        return this.getUsersByGroup(structId, token);
    }

    async getUsersFromStructureName(structName: string, token: string): Promise<User[]> {
        return this.getUsersByGroup(structName, token);
    }

    private async getUsersByGroup(group: string, token: string): Promise<User[]> {
        try {
            const url = this.buildApiUrl('get-users');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { owner: this.owner, pageSize: 100 },
                    headers: this.getAuthHeaders(token),
                }),
            );
            const { status, msg, data } = response.data as CasdoorResponse<ICasdoorUser[]>;
            let users = data.filter((u) => u.groups?.includes(group));
            return users
                .map((u) => UserCasdoorMapper.fromCasdoorToUser(u))
                .filter((u): u is User => u !== null);
        } catch (error) {
            this.handleError(error, `Get users from group ${group}`);
            throw error;
        }
    }

    async updateUserStructuresByIds(
        userId: string,
        structuresIds: string[],
        token: string,
    ): Promise<void> {
        try {
            const user = await this.getUserById(userId, token);
            if (!user) throw new NotFoundException(`User ${userId} not found`);

            const updated = { ...user, groups: structuresIds };
            await this.update(userId, updated, token);
        } catch (error) {
            this.handleError(error, `Update user structures ${userId}`);
        }
    }

    async updateByUsername(
        username: string,
        dto: Partial<CreateUsersDto>,
        token: string,
    ): Promise<User | null> {
        let user: User | null;
        try {
            user = await this.getUserByUsername(username, token);
            if (!user) throw new NotFoundException(`User ${username} not found`);
            return this.update(user.id, dto, token);
        } catch (error) {
            this.handleError(error, `Update user by username ${username}`);
            return null;
        }
    }

    async disableOrEnableUser(userId: string, active: boolean, token: string): Promise<void> {
        try {
            const user = await this.getUserById(userId, token);
            if (!user) throw new NotFoundException(`User ${userId} not found`);

            await this.update(userId, { isActive: !active }, token);
        } catch (error) {
            this.handleError(error, `Toggle user ${userId} active=${active}`);
        }
    }

}
