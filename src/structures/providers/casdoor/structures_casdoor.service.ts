import {
    Injectable, Logger,
    Inject,
    forwardRef,
    BadRequestException,
    NotFoundException
} from '@nestjs/common';
import { CreateStructureDto } from '../../dto/create-structure.dto';
import { UpdateStructureDto } from '../../dto/update-structure.dto';
import { Structure } from '../../../entities/structure.entity';
import { User } from '../../../entities/user.entity';
import { ConfigService } from '../../../config/config.service';
import { BaseStructureServiceProvider } from '../../interface/structure.interface';
import { UsersCasdoorService } from '../../../users/providers/casdoor/users_casdoor.service';
import { ICasdoorBaseInterfaceService } from '../../../common/casdoorbase.interface.service';
import { CasdoorBaseService } from '../../../common/casdoorbase.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StructureCasdoorMapper } from './structure.mapper';
import { ICasdoorStructure } from './structure.casdoor.interface';

@Injectable()
export class StructuresCasdoorService extends BaseStructureServiceProvider implements ICasdoorBaseInterfaceService {
    readonly _baseUrl: string;
    readonly _logger = new Logger(StructuresCasdoorService.name);
    casdoorBaseObject: CasdoorBaseService;

    constructor(readonly configService: ConfigService, @Inject(forwardRef(() => UsersCasdoorService)) readonly usersService: UsersCasdoorService, private readonly httpService: HttpService) {
        super(configService, usersService);
        const casdoorConfig = this.configService.getConfig().CASDOOR;
        this._baseUrl = casdoorConfig.ENDPOINT;
        this.casdoorBaseObject = new CasdoorBaseService(this.configService);
        this.casdoorBaseObject.owner = casdoorConfig.ORG_NAME || 'built-in';
    }

    async findAll(token: string): Promise<Structure[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(this.casdoorBaseObject.buildApiUrl('get-groups'), {
                    params: { owner: this.casdoorBaseObject.owner, pageSize: 1000 },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (response.data.status !== 'ok') {
                throw new BadRequestException(response.data.msg || 'Failed to fetch groups');
            }

            return await Promise.all(
                response.data.data.map(async (casdoorGroup: ICasdoorStructure) => {
                    const parent = (casdoorGroup.parentId && casdoorGroup.parentId !== this.casdoorBaseObject.owner) ? await this.findOne(casdoorGroup.parentId, token) : undefined;
                    const children = casdoorGroup.haveChildren ? await this.findChildrenByName(casdoorGroup.name, token) : undefined;
                    let users: User[] | undefined = undefined;
                    if (casdoorGroup.users) {
                        const fetchedUsers = await Promise.all(casdoorGroup.users.map(
                            async (id: string) => await this.usersService.getUserByUsername(id.split('/')[1], token)
                        ));
                        // filter out potential nulls returned by getUserByUsername
                        users = fetchedUsers.filter(u => u !== null);
                    }
                    return StructureCasdoorMapper.CasdoorGroupToStructure(casdoorGroup, parent, children, users);
                }
                )
            );

        } catch (error) {
            this._logger.error('findAll failed', error);
            throw error;
        }
    }
    async findOne(id: string, token: string, include?: string): Promise<Structure> {
        try {

            if (!id.startsWith(this.casdoorBaseObject.owner + "/")) {
                id = this.casdoorBaseObject.owner + "/" + id;
            }
            const response = await firstValueFrom(
                this.httpService.get(this.casdoorBaseObject.buildApiUrl('get-group'), {
                    params: { id },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );

            if (response.data.status !== 'ok') {
                throw new NotFoundException(`Structure ${id} not found`);
            }

            return StructureCasdoorMapper.CasdoorGroupToStructure(response.data.data,
                await (response.data.data.parentId && response.data.data.parentId !== this.casdoorBaseObject.owner ? this.findOne(response.data.data.parentId, token) : undefined),
                await (response.data.data.haveChildren ? this.findChildrenByName(response.data.data.name, token) : undefined),
                await (response.data.data.users ? Promise.all(response.data.data.users.map((username: string) => this.usersService.getUserByUsername(username, token))).then(fetchedUsers => fetchedUsers.filter(u => u !== null)) : undefined)
            );


        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this._logger.error(`findOne(${id}) failed`, error);
            throw error;
        }
    }
    async findOneByName(name: string, token: string, include?: string): Promise<Structure | null> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(this.casdoorBaseObject.buildApiUrl('get-group'), {
                    params: { id: this.casdoorBaseObject.owner + "/" + name },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );

            if (response.data.status !== 'ok') {
                throw new NotFoundException(`Structure ${name} not found`);
            }
            return StructureCasdoorMapper.CasdoorGroupToStructure(response.data.data,
                await (response.data.data.parentId && response.data.data.parentId !== this.casdoorBaseObject.owner ? this.findOne(response.data.data.parentId, token) : undefined),
                await (response.data.data.haveChildren ? this.findChildrenByName(response.data.data.name, token) : undefined),
                await (response.data.data.users ? Promise.all(response.data.data.users.map((username: string) => this.usersService.getUserByUsername(username, token))).then(fetchedUsers => fetchedUsers.filter(u => u !== null)) : undefined)
            );
        } catch (error) {
            this._logger.warn(`findOneByName(${name}) failed`, error);
            return null;
        }
    }
    async findByIds(ids: string[], token: string): Promise<Structure[]> {
        try {
            const response = await Promise.all(ids.map(async id => await this.findOne(id, token)));

            if (response.length === 0) {
                throw new BadRequestException('Failed to fetch groups');
            }

            return response;

        } catch (error) {
            this._logger.error('findAll failed', error);
            throw error;
        }
    }
    async create(dto: CreateStructureDto, token: string): Promise<Structure> {
        try {
            const body = {
                owner: this.casdoorBaseObject.owner,
                name: dto.name,
                displayName: dto.name,
                type: 'virtual',
                isEnabled: true,
            } as ICasdoorStructure;
            if (dto.parentId) {
                body.parentId = dto.parentId;
            }
            if (dto.children) {
                body.children = dto.children.map(child => child.name);
            }

            const response = await firstValueFrom(
                this.httpService.post(this.casdoorBaseObject.buildApiUrl('add-group'), body, {
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );

            if (response.data.status !== 'ok') {
                throw new BadRequestException(response.data.msg || 'Failed to create structure');
            }

            return StructureCasdoorMapper.CasdoorGroupToStructure(response.data.data,
                await (response.data.data.parentId && response.data.data.parentId !== this.casdoorBaseObject.owner ? this.findOne(response.data.data.parentId, token) : undefined),
                await (response.data.data.haveChildren ? this.findChildrenByName(response.data.data.name, token) : undefined),
                await (response.data.data.users ? Promise.all(response.data.data.users.map((username: string) => this.usersService.getUserByUsername(username, token))).then(fetchedUsers => fetchedUsers.filter(u => u !== null)) : undefined)
            );
        } catch (error) {
            this._logger.error('create structure failed', error);
            throw error;
        }
    }
    async update(id: string, dto: UpdateStructureDto, token: string): Promise<Structure> {
        try {
            let payload = {};
            const current = await this.findOne(id, token);
            if (!current) throw new NotFoundException(`Structure ${id} not found`);

            if (dto.name && dto.name !== current.name) {
                payload['name'] = dto.name;
                payload['displayName'] = dto.name;
            }
            if (dto.parentName && dto.parentName !== current.parent?.name) payload["parentName"] = dto.parentName;

            if (dto.childrenIds) payload["children"] = dto.childrenIds;//Esto es así si el id de los hijos tiene la forma owner/id

            if (dto.users) {
                payload["users"] = dto.users;
            }

            const response = await firstValueFrom(
                this.httpService.post(this.casdoorBaseObject.buildApiUrl('update-group'), payload, {
                    params: { id },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );

            if (response.data.status !== 'ok') {
                throw new BadRequestException(response.data.msg);
            }
            return StructureCasdoorMapper.CasdoorGroupToStructure(response.data.data,
                await (response.data.data.parentId && response.data.data.parentId !== this.casdoorBaseObject.owner ? this.findOne(response.data.data.parentId, token) : undefined),
                await (response.data.data.haveChildren ? this.findChildrenByName(response.data.data.name, token) : undefined),
                await (response.data.data.users ? Promise.all(response.data.data.users.map((username: string) => this.usersService.getUserByUsername(username, token))).then(fetchedUsers => fetchedUsers.filter(u => u !== null)) : undefined)
            );
        } catch (error) {
            this._logger.error(`update structure ${id} failed`, error);
            throw error;
        }
    }
    async remove(id: string, token: string): Promise<void> {
        try {

            const current = await this.findOne(id, token);
            if (!current) throw new NotFoundException(`Structure ${id} not found`);
            const body = {
                owner: this.casdoorBaseObject.owner,
                name: current.name,
                displayName: current.displayName,
                type: 'virtual',
                isEnabled: true,
            } as ICasdoorStructure;
            if (current.parentId) {
                body.parentId = current.parentId;
            }
            if (current.children) {
                body.children = current.children.map(child => child.name);
            }
            await firstValueFrom(
                this.httpService.post(
                    this.casdoorBaseObject.buildApiUrl('delete-group'),
                    body,
                    { headers: this.casdoorBaseObject.getAuthHeaders(token) },
                ),
            );
        } catch (error) {
            this._logger.error(`remove structure ${id} failed`, error);
            throw error;
        }
    }
    async getStructuresFromUser(userId: string, token: string): Promise<Structure[]> {
        /*const user = await this.usersService.getUserById(userId, token);
        if (!user?.structures?.length) return [];*///FIXME Esto crea un bucle infinito arreglar

        const allStructures = await this.findAll(token);
        return allStructures.filter(s => s.users?.some(u => u.id === userId));
    }
    async getParentStructure(displayName: string, token: string): Promise<Structure | null> {
        const all = await this.findAll(token);
        return all.find(s => s.displayName === displayName) || null;
    }
    async findChildren(id: string, token: string): Promise<Structure[]> {
        const all = await this.findAll(token);
        return all.filter(s => s.parentId === id);
    }
    async findChildrenByName(name: string, token: string): Promise<Structure[]> {
        const parent = await this.findOneByName(name, token);
        if (!parent) return [];
        return this.findChildren(parent.id, token);
    }
    async getStructureIdByName(name: string, token: string): Promise<string> {
        const structure = await this.findOneByName(name, token);
        if (!structure) throw new NotFoundException(`Structure ${name} not found`);
        return structure.id;
    }
    async addUserToStructure(structureId: string, userId: string, username: string, token: string): Promise<void> {
        const structure = await this.findOne(structureId, token);
        if (!structure) throw new NotFoundException('Structure not found');

        const currentUsers = structure.users?.map(u => u.userName) || [];
        if (currentUsers.includes(username)) return;

        const updatedUsers = [...currentUsers, username];

        await this.update(structureId, { users: updatedUsers } as any, token);
    }
    async removeUserFromStructure(structureId: string, userId: string, token: string): Promise<void> {
        const structure = await this.findOne(structureId, token);
        if (!structure) throw new NotFoundException('Structure not found');

        const updatedUsers = (structure.users?.map(u => u.userName) || []).filter(n => n !== userId);

        await this.update(structureId, { users: updatedUsers } as any, token);
    }

}
