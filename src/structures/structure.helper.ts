import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Structure } from "./entities/structure.entity";

export class StructureNameHelper {
  static readonly GROUP_DELIMITER: string = '-';
  static buildPath(parts: string[]): string {
    if (!parts || parts.length === 0) {
      throw new Error('Debe especificar al menos un nivel');
    }
    // Si solo hay un nivel → es raíz
    if (parts.length === 1) {
      return parts[0];
    }
    return parts.join(this.GROUP_DELIMITER);
  }

  static parsePath(path: string): string[] {
    if (!path) {
      throw new Error('El nombre no puede estar vacío');
    }
    return path
      .split(this.GROUP_DELIMITER)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  static getLeafName(path: string): string {
    const parts = this.parsePath(path);
    return parts[parts.length - 1];
  }

  static getParentPath(path: string): string | null {
    const parts = this.parsePath(path);
    if (parts.length <= 1) return null; // raíz no tiene padre
    return parts.slice(0, -1).join(this.GROUP_DELIMITER);
  }

  static isExisting(name: string, allExistingNames: string[]) {
    if (allExistingNames.includes(name)) {
      return true;
    }
    return false;
  }
  static isDescendantOf(childPath: string, ancestorPath: string): boolean {
    return childPath.startsWith(ancestorPath + this.GROUP_DELIMITER);
  }

  /**
  * Check if changing the parent of a structure produces a cycle in the hierarchy.
  * @param allStructures Full list of structures (findAll)
  * @param current Current structure (before change)
  * @param parentName New father's name
  */
  static async checkForCycles(
    movingNode: Structure, // Cambiar a recibir la estructura completa
    newParentName: string,
    allStructures: Structure[],
    token: string
  ): Promise<void> {
    // Caso 1: Auto-referencia
    if (newParentName === movingNode.name) {
      throw new BadRequestException(`Una estructura no puede ser padre de sí misma`);
    }

    // Caso 2: El nuevo padre es un descendiente del nodo que se está moviendo
    const movingNodeDescendants = await this.findAllDescendants(
      movingNode.displayName,
      allStructures
    );

    // Buscar si el nuevo padre está entre los descendientes
    const newParentStructure = allStructures.find(s => s.name === newParentName);
    if (!newParentStructure) {
      return; // Si no existe el nuevo padre, no hay ciclo
    }

    const isNewParentADescendant = movingNodeDescendants.some(
      desc => desc.id === newParentStructure.id
    );

    if (isNewParentADescendant) {
      throw new BadRequestException(
        `No se puede mover '${movingNode.name}' bajo '${newParentName}' porque '${newParentName}' es su descendiente`
      );
    }
    //FIXME Falta por verificar 
    // Caso 3: Verificar ciclos indirectos
    /*const wouldCreateCycle = await this.wouldCreateCycle(
      movingNode,
      newParentStructure,
      allStructures
    );

    if (wouldCreateCycle) {
      throw new BadRequestException(
        `La operación crearía un ciclo en la jerarquía de estructuras`
      );
    }*/
  }

  private static async wouldCreateCycle(
    movingNode: Structure,
    newParent: Structure,
    allStructures: Structure[]
  ): Promise<boolean> {
    const visited = new Set<string>();
    let current: Structure | undefined = newParent;

    // Seguir la cadena de padres hasta la raíz
    while (current) {
      // Si encontramos un ciclo (nodo ya visitado)
      if (visited.has(current.id)) {
        return true;
      }
      visited.add(current.id);

      // Si encontramos el nodo que estamos moviendo en la cadena de padres
      if (current.id === movingNode.id) {
        return true;
      }

      // Si el nodo actual no tiene padre, terminamos
      if (current.displayName.split(StructureNameHelper.GROUP_DELIMITER).length !== 1) {
        break;
      }

      // Buscar el siguiente padre en la jerarquía
      current = allStructures.find(s => s.name === current!.displayName.split(StructureNameHelper.GROUP_DELIMITER)?.[0]);
    }

    return false;
  }


  // Método auxiliar para obtener TODOS los descendientes
  private static findAllDescendants(
    nodeDisplayName: string,
    allStructures: Structure[]
  ): Structure[] {
    const delimiter = StructureNameHelper.GROUP_DELIMITER;
    const prefix = nodeDisplayName + delimiter;

    return allStructures.filter((s) =>
      s.displayName.startsWith(prefix) &&
      s.displayName !== nodeDisplayName
    );
  }
  private static async findChildren(
    nodeDisplayName: string,
    allStructures: Structure[]
  ): Promise<Structure[]> {
    const delimiter = StructureNameHelper.GROUP_DELIMITER;
    const prefix = nodeDisplayName + delimiter;

    return allStructures.filter((s) =>
      s.displayName.startsWith(prefix) &&
      s.displayName !== nodeDisplayName
    );
  }
  private static obtenerElementosEnProfundidad(roots: Structure[]) {
    const resultado: Structure[] = [];
    roots?.forEach(async (structure) => {
      let children = await this.findChildren(structure.name, roots);
      resultado.push(structure);
      if (children) {
        resultado.push(...this.obtenerElementosEnProfundidad(children));
      }
    });

    return resultado;
  }

  private static isDescendant(
    potentialDescendant: Structure,
    potentialAncestor: Structure,
    allStructures: Structure[]
  ): boolean {
    const delimiter = StructureNameHelper.GROUP_DELIMITER;
    const ancestorPrefix = potentialAncestor.displayName + delimiter;

    return potentialDescendant.displayName.startsWith(ancestorPrefix) &&
      potentialDescendant.displayName !== potentialAncestor.displayName;
  }
  private async rebuildDisplayNameFromHierarchy(
    nodeId: string,
    allStructures: Structure[],
    token: string
  ): Promise<string> {
    const node = allStructures.find(s => s.id === nodeId);
    if (!node) {
      return '';
    }

    // Si el nodo no tiene padre, su displayName es solo su nombre
    if (!node.displayName.split(StructureNameHelper.GROUP_DELIMITER)?.[0]) {
      return node.name;
    }

    // Buscar el padre en las estructuras
    const parent = allStructures.find(s => s.name === node.displayName.split(StructureNameHelper.GROUP_DELIMITER)?.[0]);
    if (!parent) {
      // Si el padre no existe, volver al nombre base
      return node.name;
    }

    // Construir el path desde el padre
    const delimiter = StructureNameHelper.GROUP_DELIMITER;
    return `${parent.displayName}${delimiter}${node.name}`;
  }
  static async validateChildrenAssignment(
    parentName: string,
    newChildrenIds: string[],
    allStructures: Structure[],
    token: string
  ): Promise<void> {
    if (!newChildrenIds || newChildrenIds.length === 0) {
      return; // No hay hijos para validar
    }

    // Obtener todos los descendientes del nodo padre
    const parentDescendants = await this.findChildren(
      parentName,
      allStructures
    );

    for (const childId of newChildrenIds) {
      const child = allStructures.find(s => s.id === childId);
      if (!child) {
        throw new NotFoundException(`Hijo con id ${childId} no encontrado`);
      }

      // Verificar que el hijo no sea el mismo nodo padre
      if (child.name === parentName) {
        throw new BadRequestException(
          `No puede asignar el nodo '${parentName}' como hijo de sí mismo`
        );
      }

      // Verificar que el hijo no sea un descendiente del padre
      const isDescendant = parentDescendants.some(desc => desc.id === childId);
      if (isDescendant) {
        throw new BadRequestException(
          `No se puede asignar '${child.name}' como hijo de '${parentName}' porque ya es un descendiente de este nodo`
        );
      }

      // Verificar que el padre no sea descendiente del hijo (ciclo indirecto)
      const childDescendants = await this.findChildren(
        child.displayName,
        allStructures
      );
      const isParentDescendantOfChild = childDescendants.some(
        desc => desc.name === parentName
      );

      if (isParentDescendantOfChild) {
        throw new BadRequestException(
          `No se puede asignar '${child.name}' como hijo de '${parentName}' porque '${parentName}' es descendiente de '${child.name}'`
        );
      }
    }
  }

}

class Node {
  name: string;
  parent: Node | null;
  children: Node[] | null;
}


