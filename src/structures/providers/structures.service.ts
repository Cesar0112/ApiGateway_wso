import { Provider } from "@nestjs/common";
import { STRUCTURE_SERVICE_PROVIDER } from "../interface/structure.interface";
import { StructuresCasdoorService } from "./casdoor/structures_casdoor.service";
import { StructuresWSO2Service } from "./wso2/structures_wso2.service";
import { ModuleRef } from '@nestjs/core';
import { AUTH_TYPE_TOKEN } from "../../auth/auth.interface";

export const StructuresServiceProvider: Provider = {
    provide: STRUCTURE_SERVICE_PROVIDER,
    useFactory: (type: string, wso2: StructuresWSO2Service, casdoor: StructuresCasdoorService) => {

        switch (type) {
            case 'wso2':
                return wso2;
            case 'casdoor':
                return casdoor;
            default:
                return wso2;
        }
    },
    inject: [AUTH_TYPE_TOKEN, StructuresWSO2Service, StructuresCasdoorService],
};