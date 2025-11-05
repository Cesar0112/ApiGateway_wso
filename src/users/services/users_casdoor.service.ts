// ../users/services/users.wso2.service.ts
import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { ConfigService } from '../../config/config.service';
import { User } from '../entities/user.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UserMapper, WSO2Payload } from '../user.mapper';
import { Role } from '../../roles/entities/role.entity';
import { RoleWSO2Service } from '../../roles/services/role_wso2.service';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { StructuresService } from '../../structures/services/structures.service';
import { StructuresWSO2Service } from '../../structures/services/structures_wso2.service';
import { Structure } from '../../structures/entities/structure.entity';
import { ChangeUsernameInternalDto } from '../dto/change-username-internal.dto';

@Injectable()
export class UsersCasdoorService {
    private readonly _logger = new Logger(UsersCasdoorService.name);
    private readonly _baseUrl: string;

}
