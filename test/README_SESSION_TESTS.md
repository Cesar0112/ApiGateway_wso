# Tests de Sesión para API Gateway

Este directorio contiene tests de extremo a extremo (e2e) para verificar el funcionamiento correcto de las sesiones en el API Gateway.

## Tests Disponibles

### 1. `session-persistence.e2e-spec.ts`

Verifica que el sessionId se mantenga constante a lo largo de múltiples peticiones.

**Casos de prueba:**

- Login exitoso y creación de sesión
- Mantenimiento de sessionId en peticiones subsiguientes
- Acceso a endpoints protegidos con la misma sesión
- Rechazo de peticiones sin cookie de sesión
- Rechazo de peticiones con cookie inválida
- Mantenimiento de sesión a través de múltiples peticiones

### 2. `session-config.e2e-spec.ts`

Verifica la configuración correcta de las cookies de sesión.

**Casos de prueba:**

- Configuración correcta de SameSite
- Flag HttpOnly presente
- MaxAge correcto según configuración

### 3. `frontend-like-session.e2e-spec.ts`

Simula el comportamiento típico de un frontend Vue2 con axios y `withCredentials: true`.

**Casos de prueba:**

- Flujo completo de autenticación
- Acceso a endpoints protegidos con cookie
- Rechazo de peticiones sin cookie (simulando `withCredentials: false`)
- Mantenimiento de sesión en múltiples llamadas API
- Logout e invalidación de sesión
- Comportamiento CORS con diferentes orígenes

## Cómo Ejecutar los Tests

### Ejecutar todos los tests e2e:

```bash
npm run test:e2e
```

### Ejecutar solo los tests de sesión:

```bash
npm run test:e2e -- test/session-persistence.e2e-spec.ts
npm run test:e2e -- test/session-config.e2e-spec.ts
npm run test:e2e -- test/frontend-like-session.e2e-spec.ts
```

### Ejecutar en modo observador:

```bash
npm run test:watch -- test/session-persistence.e2e-spec.ts
```

### Ejecutar con cobertura:

```bash
npm run test:cov
```

### Ejecutar con debug:

```bash
npm run test:debug -- test/session-persistence.e2e-spec.ts
```

## Requisitos Previos

Antes de ejecutar los tests, asegúrate de:

1. **Redis está corriendo en el puerto 7000:**

   ```bash
   redis-cli -p 7000 ping
   ```

   Debería responder con `PONG`.

2. **Configuración de sesión correcta en `config.json`:**

   ```json
   {
     "SESSION": {
       "STRATEGY": "redis",
       "HOST": "redis://127.0.0.1:7000",
       "TTL_SECONDS": 86400,
       "COOKIE_NAME": "apigateway_sid"
     }
   }
   ```

3. **No hay conflictos de puertos:**
   - El API Gateway no debería estar corriendo en el puerto configurado
   - O bien, usar un puerto diferente para los tests

## Problemas Comunes

### Los tests fallan con "Connection refused"

Asegúrate de que Redis está corriendo en el puerto correcto.

### Los tests fallan con "Unauthorized"

Verifica que la configuración de CORS y cookies sea correcta.

### Los tests fallan con "Session regenerated"

Revisa que:

- La configuración de cookies sea consistente
- El frontend envíe `withCredentials: true`
- La configuración CORS permita credenciales

## Depuración

Para depurar los tests, puedes agregar `console.log` statements en los archivos de test:

```typescript
console.log('[TEST] Session ID:', sessionId);
console.log('[TEST] Cookies:', cookies);
```

También puedes ejecutar los tests con el flag de debug para usar breakpoints en tu IDE:

```bash
npm run test:debug -- test/session-persistence.e2e-spec.ts
```

## Integración con CI/CD

Estos tests pueden integrarse en tu pipeline de CI/CD para verificar que los cambios no rompan el manejo de sesiones:

```yaml
test:
  script:
    - npm ci
    - npm run test:e2e
  artifacts:
    when: always
    reports:
      junit: coverage/junit.xml
```
