import { Permission } from "../../../entities/permission.entity";
import { IPermissionCasdoor } from "./permission.casdoor.interface";

export class PermissionCasdoorMapper {
    static toPermissionEntity(casdoorPermission: IPermissionCasdoor): Permission {
        const permission = new Permission();
        permission.id = casdoorPermission.owner + '/' + casdoorPermission.name;
        permission.description = casdoorPermission.description;
        permission.displayName = casdoorPermission.displayName;
        permission.value = casdoorPermission.name;
        return permission;
    }
}