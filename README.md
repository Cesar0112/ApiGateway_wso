# API Gateway

API Gateway centralizado que maneja autenticación, sesiones, permisos y proxy a servicios downstream.

## Arquitectura

- **Auth pluggable**: soporta WSO2, Casdoor y autenticación local mediante factory pattern.
- **Session-first**: tokens almacenados y validados server-side usando Redis o SQLite.
- **Proxy estratégico**: enrutamiento dinámico a canales HTTP, NATS u otros.
- **Permisos externalizados**: mapeo de rutas → permisos en `routes.json` y `routes-radix.json`.

## Quick Start

```bash
# Instalar dependencias
npm install

# Build
npm run build

# Desarrollo
npm run start:dev

# Producción
npm run start:prod

# Tests
npm test
npm run test:e2e
```

## Configuración

- `config.json` — configuración runtime (puerto, AUTH_TYPE, SESSION strategy, proxy settings).
- `routes.json` / `routes-radix.json` — mapeo de rutas → permisos requeridos.
- `NODE_ENV` — dev/prod/test (controla logging y comportamiento).

## Estructura de carpetas

```
src/
├── main.ts                  # Bootstrap, CORS, Swagger, prefijo /apigateway
├── app/app.module.ts        # Composición top-level
├── auth/                    # Backends de autenticación pluggables
├── session/                 # Manejo de sesiones (Redis/SQLite)
├── permissions/             # Guards y evaluación de permisos
├── proxy/                   # Estrategias de proxy (HTTP, NATS)
├── users/                   # Servicios de usuarios
├── structures/              # Servicios de estructuras
├── roles/                   # Servicios de roles
├── common/                  # Excepciones, filtros, utilidades
└── config/                  # Lectura y validación de config.json
```

---

## Tareas futuras

### 1. **Centralizar mensajes de error y excepciones**

- **Descripción**: Crear archivo centralizado `src/common/exceptions/error-messages.ts` con mensajes por dominio (STRUCTURES, USERS, AUTH, SESSION, etc.).
- **Beneficio**: Cambios de mensajes en un único lugar; facilita i18n (internacionalización).
- **Afecta**: Todos los controllers y servicios que lanzan excepciones.
- **Prioridad**: Media.
- **Archivos a crear/modificar**:
  - `src/common/exceptions/error-messages.ts` (nuevo)
  - `src/common/exceptions/app.exceptions.ts` (nuevo, excepciones personalizadas)
  - `src/structures/structures.controller.ts`
  - `src/users/users.controller.ts`
  - `src/auth/auth.controller.ts`

### 2. **Mapping DTO en StructuresController**

- **FIXME ubicado en**: `src/structures/structures.controller.ts` (línea ~29)
- **Descripción**: No enviar entidad `Structure` directamente; mapear a DTO usando `StructureMapper` (patrón similar a otros controllers).
- **Estado actual**: algunos endpoints devuelven entidades sin mapear.
- **Prioridad**: Alta (seguridad e inconsistencia).
- **Archivos a modificar**:
  - `src/structures/structures.controller.ts` (aplicar mapper en todos los endpoints)
  - `src/structures/dto/` (revisar/completar DTOs si es necesario)

### 3. **Validación null en StructuresController**

- **FIXME ubicado en**: `src/structures/structures.controller.ts`
- **Descripción**: Endpoints `findOne()`, `findOneByName()`, `update()` pueden retornar `null`. Agregar validaciones antes de mapear.
- **Patrón**: lanzar `StructureNotFoundException` si el resultado es null.
- **Prioridad**: Alta (TypeScript strict mode + runtime safety).
- **Archivos a modificar**:
  - `src/structures/structures.controller.ts` (agregar if-checks con excepciones centralizadas)

### 4. **Inyección dinámica de servicios en StructuresController**

- **FIXME ubicado en**: `src/structures/structures.controller.ts` (línea ~23)
- **Descripción**: El controlador actualmente inyecta `StructuresWSO2Service` directamente. Debe cambiar dinámicamente entre `StructuresWSO2Service` y `StructuresCasdoorService` según `API_GATEWAY.AUTH_TYPE`.
- **Solución**: Implementar factory provider con token `STRUCTURES_SERVICE_TOKEN` (similar a `AUTH_SERVICE_TOKEN` en `AuthenticateModule`).
- **Prioridad**: Alta (arquitectura limpia).
- **Archivos a crear/modificar**:
  - `src/structures/providers/structures.service.provider.ts` (nuevo, factory)
  - `src/structures/structures.module.ts` (registrar provider factory)
  - `src/structures/structures.controller.ts` (inyectar vía token, no clase directa)

### 5. **Manejo de errores global con filter**

- **Descripción**: Crear `src/common/filters/http-exception.filter.ts` que estandarice respuestas de error.
- **Beneficio**: Formato consistente en todas las respuestas de error (mensaje, statusCode, timestamp, path).
- **Afecta**: Toda la aplicación.
- **Prioridad**: Media.
- **Archivos a crear/modificar**:
  - `src/common/filters/http-exception.filter.ts` (nuevo)
  - `src/main.ts` (registrar filter global con `app.useGlobalFilters()`)

### 6. **Validar null en endpoints restantes**

- **Descripción**: Revisar y agregar validaciones null en otros controllers (UsersController, RolesController, etc.).
- **Patrón**: Usar excepciones centralizadas + HTTP 404.
- **Prioridad**: Media-Alta.
- **Archivos a revisar**:
  - `src/users/users.controller.ts`
  - `src/roles/roles.controller.ts`
  - `src/permissions/permissions.controller.ts`

### 7. **Documentación de rutas y permisos**

- **Descripción**: Crear/actualizar `ROUTES.md` con tabla de endpoints, métodos, permisos requeridos y descripción.
- **Beneficio**: Referencia centralizada para desarrolladores y testing.
- **Prioridad**: Baja (documentación).
- **Archivos a crear**:
  - `docs/ROUTES.md` (nuevo)

### 8. **Tests unitarios para servicios de structures**

- **Descripción**: Completar cobertura de tests para `StructuresWSO2Service` y `StructuresCasdoorService`.
- **Prioridad**: Media.
- **Archivos a crear**:
  - `src/structures/providers/wso2/structures_wso2.service.spec.ts`
  - `src/structures/providers/casdoor/structures_casdoor.service.spec.ts`

### 9. **Implementar endpoints bulk pendientes**

- **Descripción**: `POST /apigateway/structures/bulk` y `GET /apigateway/structures/bulk/:jobId` actualmente lanzan `NotFoundException`. Implementar con Job queue (Bull + Redis).
- **Estado actual**: placeholder con FIXME.
- **Prioridad**: Baja (feature futura).
- **Archivos a modificar**:
  - `src/structures/structures.controller.ts`
  - `src/structures/services/structures.service.ts`

### 10. **Reflection-based auth provider discovery (opcional)**

- **Descripción**: Reemplazar factory switch en `AuthenticateModule` con metadata reflection y decorador `@AuthProvider('tipo')`.
- **Beneficio**: Agregar nuevos backends sin tocar el factory (zero-touch extensibility).
- **Prioridad**: Baja (refactor de arquitectura).
- **Archivos a crear/modificar**:
  - `src/auth/decorators/auth-provider.decorator.ts` (nuevo)
  - `src/auth/providers/auth.service.ts` (reemplazar factory)
  - `src/auth/providers/wso2/auth_wso2.service.ts` (decorar con `@AuthProvider('wso2')`)
  - `src/auth/providers/casdoor/auth_casdoor.service.ts` (decorar con `@AuthProvider('casdoor')`)

---

## Dependencias circulares resueltas

- ✅ AuthenticateModule ↔ UsersModule (forwardRef + orden de importación)
- ✅ StructuresModule ↔ UsersModule (forwardRef, StructuresModule no importa UsersModule en providers)
- ✅ RolesModule → AuthenticateModule (removida, no necesaria)

## Patrones y convenciones

- **Global prefix**: `/apigateway` (ver `src/main.ts`)
- **Session server-side**: tokens NO se envían al frontend crudos; validación server-side
- **Excepciones centralizadas**: usar `src/common/exceptions/error-messages.ts` y `app.exceptions.ts`
- **Mappers DTOs**: siempre mapear entidades a DTOs antes de responder (ej: `StructureMapper`)
- **Auth pluggable**: factory pattern en `AuthenticateModule` (fácil agregar WSO2, Casdoor, Local, OAuth2, etc.)

## Debugging

- Morgan logs HTTP requests en dev mode (check `NODE_ENV`).
- Inspeccionar `src/proxy/proxy.service.ts` para flujos de proxy.
- Verificar `dist/config.json` coincida con runtime config después de `npm run build`.
- Tests: `npm test`, `npm run test:e2e`.

---

**Última actualización**: 2025-01-27
