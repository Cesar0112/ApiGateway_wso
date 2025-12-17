import { Structure } from "../../../entities/structure.entity";
import { User } from "../../../entities/user.entity";
import { CreateStructureDto } from "../../dto/create-structure.dto";
import { ICasdoorStructure } from "./structure.casdoor.interface";

export class StructureCasdoorMapper {
    static StructureToCasdoorGroup(struct: CreateStructureDto): ICasdoorStructure {
        let data: ICasdoorStructure;
        data = {
            name: struct.name,
        } as ICasdoorStructure;
        return data;
    }
    static CasdoorGroupToStructure(casdoorGroup: ICasdoorStructure, parent?: Structure, children?: Structure[], users?: User[]): Structure {
        let data: Structure;
        data = {
            id: casdoorGroup.owner + "/" + casdoorGroup.name,
            name: casdoorGroup.name,
            displayName: casdoorGroup.displayName,
        } as Structure;
        if (casdoorGroup.parentId) {
            data.parentId = casdoorGroup.parentId;
        }
        if (casdoorGroup.haveChildren && children) {
            data.children = children;
        }
        if (users && users.length > 0) {
            data.users = users;
        }
        return data;
    }
}