# AGENTS.md - Guía de Desarrollo del API Gateway

Este es un API Gateway basado en NestJS que centraliza autenticación, manejo de sesiones, verificación de permisos y proxy a servicios downstream. Este archivo proporciona guía comprensiva para agentes de IA de codificación que trabajan en este codebase.

## 1. Comandos de Inicio Rápido

### Flujo de Trabajo de Desarrollo

```bash
# Iniciar servidor de desarrollo en modo watch
npm run start:dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm run start:prod

# Modo debug con watch
npm run start:debug
```

### Calidad de Código

```bash
# Lint y auto-corrección de archivos TypeScript
npm run lint

# Formatear código con Prettier
npm run format

# Ejecutar ambos lint y format (recomendado antes de commits)
npm run lint && npm run format
```

## 2. Estrategia de Pruebas

### Ejecución de Pruebas

```bash
# Ejecutar todas las pruebas unitarias
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con coverage
npm run test:cov

# Ejecutar archivo de prueba específico
npm test -- auth.controller.spec.ts

# Ejecutar pruebas que coincidan con patrón
npm test -- --testNamePattern="Authentication"

# Debug de pruebas
npm run test:debug
```

### Pruebas E2E

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar pruebas E2E específicas de sesión
npm run test:session

# Ejecutar pruebas E2E tipo frontend
npm run test:frontend
```

### Patrones de Prueba

- Pruebas unitarias: `src/**/*.spec.ts` usando Jest con `Test.createTestingModule()`
- Pruebas E2E: `test/**/*.e2e-spec.ts` con supertest
- Siempre agregar pruebas para nuevas características de auth, sesión o permisos
- Usar patrón `Test.createTestingModule()` para pruebas de servicios NestJS

## 3. Estilo de Código y Formato

### Convenciones de Nomenclatura (Reglas ESLint)

```typescript
// Variables y funciones: camelCase
const userName = 'john';
const getUserById = (id: string) => {};

// Constantes: UPPER_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Clases: PascalCase
class AuthenticationService {}

// Interfaces: PascalCase con prefijo "I"
interface IUserProvider {}

// Propiedades privadas: camelCase con guion bajo inicial
private _userRepository: Repository;

// Miembros de enum: PascalCase
enum AuthType { WSO2, Casdoor, Local }
```

### Patrones de Importación/Exportación

```typescript
// Imports ES6 preferidos (especialmente para tipos)
import { Controller, Get } from '@nestjs/common';
import type { IUser } from './interfaces';

// Exportaciones barrel en archivos index.ts
export * from './auth.service';
export * from './auth.controller';

// Tokens de inyección personalizados para servicios pluggables
export const AUTH_SERVICE_TOKEN = Symbol('AUTH_SERVICE_TOKEN');
```

### Reglas de Formato (Prettier)

```typescript
// Comillas simples
const message = 'Hello world';

// Comas finales (all)
const user = {
  id: 1,
  name: 'John',
};

// Sin punto y coma (ASI)
const result = await service.getData();
```

## 4. Patrones de Arquitectura NestJS

### Composición de Módulos

```typescript
// Estructura del módulo principal de la app
@Module({
  imports: [
    AuthenticateModule,
    ProxyModule,
    SessionModule,
    PermissionsModule,
    UsersModule,
  ],
  providers: [
    // Proveedores globales
  ],
})
export class AppModule {}
```

### Patrones de Inyección de Dependencias

```typescript
// Factory providers para servicios pluggables
export const UsersServiceProviders: Provider = {
  provide: USERS_PROVIDER_TOKEN,
  useFactory: (authType: string, moduleRef: ModuleRef): IUsersProvider => {
    switch (authType) {
      case 'casdoor': return moduleRef.get(UsersCasdoorService);
      case 'wso2':
      default: return moduleRef.get(UsersWSO2Service);
    }
  },
  inject: [AUTH_TYPE_TOKEN, ModuleRef],
};

// Inyección basada en interfaces
constructor(
  @Inject(AUTH_SERVICE_TOKEN)
  private readonly authenticateService: BaseAuthenticationService,
) {}
```

### Patrones de Controlador

```typescript
@Controller('authenticate')
@UseInterceptors(EncryptionResponseInterceptor)
export class AuthenticateController {
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @UsePipes(new JoiValidationPipe(UserPasswordSchema))
  async login(
    @Session() session: Record<string, any>,
  ): Promise<AuthSuccessDto> {
    // Implementación
  }
}
```

## 5. Autenticación y Seguridad

### Seguridad Session-First

```typescript
// Patrón de manejo de sesión
session.username = user;
session.permissions = result.permissions.filter((p) => !p.startsWith('url:'));
session.urls = result.permissions.filter((p) => p.startsWith('url:')) ?? [];
session.token = result?.token;

// Nunca exponer tokens crudos al frontend
// Los datos de sesión son solo del lado del servidor
```

### Mapeo de Permisos

```typescript
// Permisos de ruta definidos en routes.json
// Actualizar ambos routes.json y routes-radix.json juntos
// Los guards dependen de estos archivos para verificación de permisos

// Filtrado de permisos
const permissions = result.permissions.filter((p) => !p.startsWith('url:'));
const urls = result.permissions.filter((p) => p.startsWith('url:')) ?? [];
```

### Configuración CORS

```typescript
// CORS manejado en main.ts con orígenes dinámicos
// Desarrollo permite localhost con cualquier puerto
// Producción usa orígenes configurados desde config.json
```

## 6. Patrones de Proxy y Routing

### Implementación de Patrón Strategy

```typescript
// Las estrategias de cliente deben implementar ClientStrategy interface
export interface ClientStrategy {
  sendRequest(request: ProxyRequest): Promise<ProxyResponse>;
}

// Registrar nuevas estrategias en ProxyService.sendRequest
switch (channel) {
  case Channel.HTTP:
    return this.httpClientStrategy.sendRequest(request);
  case Channel.NATS:
    return this.natsClientStrategy.sendRequest(request);
  default:
    throw new Error(`Canal no soportado: ${channel}`);
}
```

### Prefijo Global de Ruta

```typescript
// Todas las rutas con prefijo /apigateway (configurado en main.ts)
// Al probar endpoints, incluir el prefijo
// Ejemplo: POST /apigateway/authenticate
```

## 7. Gestión de Configuración

### Uso de ConfigService

```typescript
// Leer configuración desde config.json
const cfg = this.configService.getConfig();
const port = cfg.API_GATEWAY?.PORT ?? 3000;
const authType = cfg.API_GATEWAY?.AUTH_TYPE;

// Después del build, dist/config.json debe coincidir con config runtime
```

### Archivos de Configuración Clave

- `config.json` - Configuración runtime (puertos, tipo auth, estrategia de sesión)
- `routes.json` - Mapeo de ruta a permisos
- `routes-radix.json` - Formato de árbol radix para guards de permisos

## 8. Organización de Archivos y Nomenclatura

### Estructura de Directorios

```
src/
├── main.ts                    # Bootstrap, CORS, Swagger, prefijo global
├── app/app.module.ts          # Composición de módulo de alto nivel
├── auth/                      # Backends de autenticación pluggables
├── session/                   # Manejo de sesión (Redis/SQLite)
├── permissions/              # Guards y evaluación de permisos
├── proxy/                     # Estrategias de proxy (HTTP, NATS)
├── users/                     # Servicios y proveedores de usuarios
├── common/                    # Utilidades compartidas y excepciones
├── config/                    # Gestión de configuración
├── entities/                  # Entidades TypeORM
├── guards/                    # Guards de autenticación y permisos
├── strategies/               # Implementaciones de estrategia de cliente
└── interceptors/             # Interceptors de request/response
```

### Patrones DTO y Validación

```typescript
// DTOs de request con decoradores de validación
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// DTOs de response separados
export class AuthSuccessDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;
}
```

## 9. Tareas Comunes de Desarrollo

### Agregar Nuevo Canal de Proxy

1. Implementar estrategia en `src/strategies/<channel>.ts`
2. Seguir patrón `HttpClientStrategy`
3. Agregar caso en `ProxyService.sendRequest`
4. Actualizar enum Channel si es necesario

### Agregar Nuevo Proveedor de Auth

1. Crear clase de proveedor en `src/auth/services/`
2. Implementar `BaseAuthenticationService` interface
3. Actualizar switch `AUTH_TYPE` en `AuthenticateModule`
4. Agregar proveedor a imports del módulo

### Agregar Rutas Protegidas

1. Actualizar `routes.json` con nuevos permisos de ruta
2. Mantener `routes-radix.json` sincronizado
3. Agregar controlador con guards apropiados
4. Documentar cambios de permisos en `ROUTES.md`

## 10. Tips de Debugging

### Problemas Comunes

- Verificar que `dist/config.json` coincida con config runtime después del build
- Logging de Morgan deshabilitado en modo test (verificar NODE_ENV)
- Nombre de cookie de sesión hardcoded en logout (FIXME en auth.controller.ts:98)
- Rechazos de origen CORS logueados a consola

### Archivos Clave para Inspeccionar

- `src/main.ts` - Bootstrap de aplicación y configuración global
- `src/app/app.module.ts` - Composición de módulos y wiring de proveedores
- `src/proxy/proxy.service.ts` - Flujo de proxy y selección de estrategia
- `src/auth/auth.module.ts` - Configuración de proveedor de autenticación
- `config.json` - Valores de configuración runtime

### Debugging de Pruebas

- Usar `npm run test:debug` para debugging de breakpoints
- Pruebas de sesión: `npm run test:session`
- Pruebas tipo frontend: `npm run test:frontend`
- Siempre ejecutar ambas pruebas unitarias y E2E para cambios de auth/sesión

## 11. Restricciones de Seguridad

### Nunca Hacer

- Exponer tokens de sesión crudos al frontend
- Almacenar datos sensibles en almacenamiento del lado del cliente
- Omitir verificaciones de permisos en routes.json
- Hardcodear valores de configuración (usar config.json)

### Siempre Hacer

- Seguir patrón de seguridad session-first
- Mantener routes.json y routes-radix.json sincronizados
- Usar ConfigService para todas las lecturas de configuración
- Agregar pruebas para cambios de auth/sesión/permisos
- Usar manejo de excepciones apropiado con excepciones NestJS

## 12. Integración con Reglas Existentes

Esta guía mejora las instrucciones existentes de `.github/copilot-instructions.md` con:

- Ejemplos de código y patrones detallados
- Estrategias de prueba comprensivas
- Flujos de trabajo de debugging específicos
- Cumplimiento de restricciones de seguridad
- Mejores prácticas de organización de archivos

Al hacer cambios, priorizar archivos listados en las instrucciones de Copilot y seguir los patrones delineados en esta guía comprensiva.
