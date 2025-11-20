import { Inject, Injectable, Logger } from "@nestjs/common";
import { IUsersService, USERS_SERVICE_PROVIDER_TOKEN } from "./interfaces/users.interface.service";
import { ConfigService } from "../config/config.service";


@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @Inject(USERS_SERVICE_PROVIDER_TOKEN)
        private readonly usersProvider: IUsersService,
        private readonly configService: ConfigService,
    ) {
        this.logger.log(
            `UsersService initialized with provider: ${usersProvider.constructor.name}`,
        );
    }
}