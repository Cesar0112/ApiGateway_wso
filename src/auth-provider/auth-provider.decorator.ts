export const AUTH_PROVIDER_METADATA = Symbol('AUTH_PROVIDER_TYPE');

/**
 * Decorador que marca un servicio de autenticación con su tipo (wso2, casdoor, local).
 * Usado por AuthServiceProvider para descubrir dinámicamente qué backend usar.
 * 
 * @param type - Tipo de proveedor ('wso2', 'casdoor', 'local')
 * 
 * @example
 * @AuthProvider('wso2')
 * @Injectable()
 * export class AuthWSO2Service extends BaseAuthenticationService { ... }
 */
export function AuthProvider(type: string) {
    return (target: Function) => {
        Reflect.defineMetadata(AUTH_PROVIDER_METADATA, type.toLowerCase(), target);
    };
}