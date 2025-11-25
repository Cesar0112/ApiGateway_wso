import { Role } from "../../entities/role.entity";
import { IRoleServiceProvider } from "../../interfaces/role.service.interface";

export class RoleCasdoorService implements IRoleServiceProvider {
    createRole(data: Partial<Role>, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    getRoles(token: string): Promise<Role[]> {
        throw new Error("Method not implemented.");
    }
    getRoleById(id: string, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    updateRole(id: string, data: Partial<Role>, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    deleteRole(id: string, token: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}