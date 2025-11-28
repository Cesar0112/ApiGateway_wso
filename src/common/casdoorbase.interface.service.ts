import { CasdoorBaseService } from "./casdoorbase.service";

export interface ICasdoorBaseInterfaceService {
    casdoorBaseObject: CasdoorBaseService;

    getheaders?(): Object;
    getAuthHeaders?(token: string): {
        'Content-Type': string,
        Authorization: string,
    };
    buildApiUrl?(path: string): string;
    handleError?(error: any, context: string): void;
}