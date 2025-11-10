// ../users/services/users.wso2.service.ts
import {
    BadRequestException,
    Injectable, Logger,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import { User } from '../../entities/user.entity';
import { CreateUsersDto } from '../../dto/create-users.dto';
import { IUsersService } from '../users.interface.service';
import { UpdateUsersDto } from 'src/users/dto/update-users.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserMapper } from 'src/users/services/wso2/user.wso2.mapper';
@Injectable()
export class UsersCasdoorService implements IUsersService {
    private readonly _logger = new Logger(UsersCasdoorService.name);
    private readonly baseUrl: string;
    private readonly owner: string;
    constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
        const cfg = this.configService.getConfig().CASDOOR;
        this.baseUrl = cfg.ENDPOINT;
        this.owner = cfg.ORG_NAME || 'built-in';
    }
    private get headers() {
        return {
            'Content-Type': 'application/json',
        };
    }

    private getAuthHeaders(token: string) {
        return {
            ...this.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    // === HELPERS ===
    private buildUrl(path: string): string {
        return `${this.baseUrl}${path}`;
    }

    private handleError(error: any, context: string) {
        this._logger.error(`${context} failed:`, error.response?.data || error.message);
        if (error.response?.status === 401) throw new UnauthorizedException('Invalid token');
        if (error.response?.status === 404) throw new NotFoundException(`${context} not found`);
        throw new BadRequestException(`${context} failed`);
    }

    async getUserById(id: string, token: string): Promise<User | null> {
        try {
            const url = this.buildUrl('/api/get-user');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { id, owner: this.owner },
                    headers: this.getAuthHeaders(token),
                }),
            );
            return UserMapper.fromCasdoorToUser(response.data);
        } catch (error) {
            this.handleError(error, `Get user by ID ${id}`);
        }
    }
    getUserByUsername(username: string, token: string): Promise<User | null> {
        throw new Error('Method not implemented.');
    }
    getUsers(token: string): Promise<User[]> {
        throw new Error('Method not implemented.');
    }
    create(userData: CreateUsersDto, token: string): Promise<User> {
        throw new Error('Method not implemented.');
    }
    update(id: string, updateData: Partial<CreateUsersDto>, token: string): Promise<User> {
        throw new Error('Method not implemented.');
    }
    delete(id: string, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    deleteByUsername(username: string, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getUsersFromStructure(structId: string, token: string): Promise<User[]> {
        throw new Error('Method not implemented.');
    }
    getUsersFromStructureName(structName: string, token: string): Promise<User[]> {
        throw new Error('Method not implemented.');
    }
    updateUserStructuresByIds(userId: string, structuresIds: string[], token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    updateByUsername(username: string, dto: UpdateUsersDto, token: string): Promise<User> {
        throw new Error('Method not implemented.');
    }
    disableOrEnableUser(userId: string, active: boolean, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
