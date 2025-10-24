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
}
