import {
    Injectable, Logger,
    Inject,
    forwardRef
} from '@nestjs/common';
import { CreateStructureDto } from '../../dto/create-structure.dto';
import { UpdateStructureDto } from '../../dto/update-structure.dto';
import { Structure } from '../../../entities/structure.entity';
import { ConfigService } from '../../../config/config.service';
import { BaseStructureServiceProvider } from '../../interface/structure.interface';
import { UsersCasdoorService } from '../../../users/providers/casdoor/users_casdoor.service';

//FIXME Arreglar que no se mapee directamente desde aquí sino desde el controller
@Injectable()
export class StructuresCasdoorService extends BaseStructureServiceProvider {
    findAll(token: string): Promise<Structure[]> {
        throw new Error('Method not implemented.');
    }
    findOne(id: string, token: string, include?: string) {
        throw new Error('Method not implemented.');
    }
    findOneByName(name: string, token: string, include?: string) {
        throw new Error('Method not implemented.');
    }
    findByIds(ids: string[], token: string): Promise<Structure[]> {
        throw new Error('Method not implemented.');
    }
    create(dto: CreateStructureDto, token: string): Promise<Structure> {
        throw new Error('Method not implemented.');
    }
    update(id: string, dto: UpdateStructureDto, token: string): Promise<Structure> {
        throw new Error('Method not implemented.');
    }
    remove(id: string, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getStructuresFromUser(userId: string, token: string): Promise<Structure[]> {
        throw new Error('Method not implemented.');
    }
    getParentStructure(displayName: string, token: string): Promise<Structure | null> {
        throw new Error('Method not implemented.');
    }
    findChildren(id: string, token: string): Promise<Structure[]> {
        throw new Error('Method not implemented.');
    }
    findChildrenByName(name: string, token: string): Promise<Structure[]> {
        throw new Error('Method not implemented.');
    }
    getStructureIdByName(name: string, token: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    addUserToStructure(structureId: string, userId: string, username: string, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    removeUserFromStructure(structureId: string, userId: string, token: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    readonly _baseUrl: string;
    readonly _logger = new Logger(StructuresCasdoorService.name);
    constructor(readonly configService: ConfigService, @Inject(forwardRef(() => UsersCasdoorService)) readonly usersService: UsersCasdoorService) {
        super(configService, usersService);
        const casdoorConfig = this.configService.getConfig().CASDOOR;
        this._baseUrl = casdoorConfig.ENDPOINT;
    }

}
