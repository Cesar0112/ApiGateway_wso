import { Structure } from "../../../entities/structure.entity";
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
    static CasdoorGroupToStructure(casdoorGroup: ICasdoorStructure, parent?: Structure, children?: Structure[]): Structure {
        let data: Structure;
        data = {
            id: casdoorGroup.owner + "/" + casdoorGroup.name,
            name: casdoorGroup.name,
            displayName: casdoorGroup.displayName,
        } as Structure;
        if (parent) {
            data.parent = parent;
            data.parentId = parent.id;
        }
        if (children) {
            data.children = children;
        }
        return data;
    }
}