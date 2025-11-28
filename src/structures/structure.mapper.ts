import { StructureResponseDto } from "./dto/structure-response.dto";
import { Structure } from "../entities/structure.entity";
import { StructureNameHelper } from "./structure.helper";
/**
 * Esta clase mapeadora convierte:
 * 1. De respuestas de peticiones relacionadas con las estructuras a entidades del dominio que van a los servicios.
 * 2. De respuestas de los servicios a lo que recibe el controlador de estructura
 * 3. De respuestas de controlador a lo que debe recibir el consumidor
 * 
 * En fin la responsabilidad de esta clase es ser el unico punto de acople entre front -> controller -> servicio -> repositorio/wso2/cualquier forma de crear datos/otra api incluso
 * para que no halla que cambiar otro archivo cuando cambie un contrato entre las distintas capas
 * 
 */
//TODO Me quede por aqui 22/10/25
export class StructureMapper {
    static fromStructureToStructureDto(struct: Structure): StructureResponseDto {
        const parts = struct.displayName.split(StructureNameHelper.GROUP_DELIMITER);
        const name = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join(StructureNameHelper.GROUP_DELIMITER) : null;

        return {
            id: struct.id,
            name,
            parent: struct.parent ? this.fromStructureToStructureDto(struct.parent) : null,
            children: struct.children ?? [],
            users: struct.users ?? [],
        } as StructureResponseDto;
    }
    static mapFromWSO2(data: any): Structure {
        const parts = data.displayName.split(StructureNameHelper.GROUP_DELIMITER);
        const name = parts[parts.length - 1];
        const parentName = parts.length > 1 ? parts.slice(0, -1).join(StructureNameHelper.GROUP_DELIMITER) : null;

        return {
            id: data.id,
            name,
            displayName: data.displayName,
            parent: null,
            parentId: null,
            // path completo del padre (opcional)
            children: [],
            users: [],
        };
    }
}