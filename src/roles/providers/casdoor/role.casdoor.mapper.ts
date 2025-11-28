import { Permission } from "../../../entities/permission.entity";
import { Role } from "../../../entities/role.entity";
import { IRoleCasdoor } from "./role.casdoor.interface";

export class RoleCasdoorMapper {
    static fromCasdoorToRole(data: IRoleCasdoor, permissions: Permission[] = []): Role {
        return {
            id: `${data.owner}/${data.name}`,
            name: data.displayName,
            permissions
        } as Role;
    }
}