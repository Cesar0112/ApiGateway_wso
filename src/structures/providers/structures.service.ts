import { Provider } from "@nestjs/common";
import { BaseStructureServiceProvider, STRUCTURE_SERVICE_PROVIDER } from "../interface/structure.interface";
import { StructuresCasdoorService } from "./casdoor/structures_casdoor.service";
import { StructuresWSO2Service } from "./wso2/structures_wso2.service";
import { ModuleRef } from '@nestjs/core';
import { AUTH_TYPE_TOKEN } from "../../auth/auth.interface";
export const StructuresServiceProvider: Provider = {
    provide: STRUCTURE_SERVICE_PROVIDER,
    useFactory: async (type: string, moduleRef: ModuleRef): Promise<BaseStructureServiceProvider> => {

        switch (type) {
            case 'wso2':
                return await moduleRef.create(StructuresWSO2Service);
            case 'casdoor':
                return await moduleRef.create(StructuresCasdoorService);
            case 'local':
            default:
                return await moduleRef.create(StructuresWSO2Service);
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};