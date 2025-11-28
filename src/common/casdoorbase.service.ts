import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "../config/config.service";

@Injectable()
export class CasdoorBaseService {

    private readonly logger: Logger;
    private readonly baseUrl: string;
    private readonly owner: string;
    constructor(protected readonly configService: ConfigService) {
        this.baseUrl = this.configService.getConfig().CASDOOR.ENDPOINT;
        this.owner = this.configService.getConfig().CASDOOR.ORG_NAME || 'built-in';
    }



    public get headers() {
        return {
            'Content-Type': 'application/json',
        };
    }

    public getAuthHeaders(token: string) {
        return {
            ...this.headers,
            Authorization: `Bearer ${token}`,
        };
    }

    public buildApiUrl(path: string): string {
        if (path.startsWith("/api/"))
            path = path.split("/api/")[1];
        return `${this.baseUrl}/api/${path}`;
    }

    public handleError(error: any, context: string) {
        this.logger.error(`${context} failed:`, error.response?.data || error.message);
        if (error.response?.status === 401) throw new UnauthorizedException('Invalid token');
        if (error.response?.status === 404) throw new NotFoundException(`${context} not found`);
        throw new BadRequestException(`${context} failed`);
    }
}