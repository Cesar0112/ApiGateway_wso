# 1. Pasos siguientes recomendados para robustecer el API Gateway

## 1. Validación y limpieza de sesión

- **Destruir la sesión correctamente:**  
  Asegúrate de que la sesión se destruya tanto al hacer logout como cuando el token expire (esto ya lo gestiona el guard).
- **Endpoint de estado de sesión:**  
  Considera agregar un endpoint `/authenticate/status` que permita al frontend consultar si la sesión sigue activa y obtener información básica del usuario autenticado.

## 2. Mejorar la seguridad

- **Cookies seguras:**  
  Configura las cookies de sesión con `httpOnly: true` para evitar acceso desde JavaScript y `secure: true` para que solo se envíen por HTTPS en producción.
- **Expiración de sesión:**  
  Ajusta el parámetro `maxAge` de la cookie de sesión según el tiempo de inactividad permitido.
- **Validación de firma JWT:**  
  Si es posible, valida la firma del token JWT usando la clave pública de WSO2 para asegurarte de que no ha sido manipulado.
- **Evitar timming-attack**  
  Dándole la misma cantidad de tiempo tanto para los 200 del login como los 401 y 500 y 400

## 3. Auditoría y logs

- **Registrar eventos importantes:**  
  Agrega logs para login, logout, expiración de sesión, intentos fallidos y cualquier acceso no autorizado.
- **Monitoreo:**  
  Considera integrar herramientas de monitoreo para detectar patrones sospechosos o problemas de seguridad.

## 4. Pruebas

- **Pruebas unitarias:**  
  Escribe pruebas para los endpoints de autenticación, el guard y el interceptor de sesión.
- **Pruebas de integración:**  
  Simula el flujo completo: login, acceso a rutas protegidas, expiración de sesión y logout.
- **Pruebas de seguridad:**  
  Verifica que no se pueda acceder a rutas protegidas sin sesión válida y que el token no se exponga nunca al frontend.

## 5. Documentación

- **Actualizar rutas:**  
  Mantén el archivo `ROUTES.md` actualizado con todas las rutas y su propósito.
- **Flujo de autenticación:**  
  Documenta cómo funciona el proceso de login, manejo de sesión y protección de rutas para facilitar el onboarding de nuevos desarrolladores.

## 6. Manejo de errores

- **Mensajes claros:**  
  Personaliza los mensajes de error para casos como expiración de sesión, token inválido o falta de permisos.
- **Respuestas consistentes:**  
  Asegúrate de que el frontend reciba respuestas claras y estructuradas para cada caso de error.

## 7. Revisión de permisos

- **Control de acceso:**  
  Si tu aplicación usa permisos, revisa que se apliquen correctamente en los endpoints que lo requieran, usando guards adicionales si es necesario.

## 8. Revisión de permisos

- **Optimizaciones:**  
  Optimizar la búsqueda de los permisos requridos por parte del usuario para hacer peticiones a los endpoints, agregando un Árbol de prefijos en lugar de un simple HASH MAP cambiar la estructura y carga del routes.json para que sea fácil de serializar/deserializar para mejorar la velocidad cuando los endpoints sean muchos, puede que en el futuro sea configurable este aspecto

---

## 9. TODOs

1. **Terminar la autenticación local**

# 2. Apartado: Flujo de negocio recomendado

## Flujo general de la aplicación

1. **El frontend nunca maneja tokens ni datos sensibles.**

   - El usuario solo interactúa con la interfaz y envía peticiones (por ejemplo, login, acciones, consultas) al backend a través de la API Gateway.

2. **El frontend hace todas las peticiones a través de la API Gateway.**

   - Ejemplo: `/apigateway/monitoring`, `/apigateway/users`, etc.

3. **La API Gateway valida todo:**

   - **Sesión:** Verifica que la sesión esté activa y el token no haya expirado.
   - **Permisos:** Verifica que el usuario tenga permisos para la acción solicitada.
   - **Autorización:** Si el usuario no tiene permisos o la sesión no es válida, responde con error (401 o 403).

4. **El backend nunca expone el token ni datos sensibles al frontend.**

   - Solo responde con información relevante para la UI (por ejemplo, éxito, error, datos de negocio, permisos si es necesario para mostrar u ocultar opciones).

5. **El frontend solo reacciona a la respuesta del backend.**
   - Si la respuesta es exitosa, muestra la información o redirige.
   - Si hay error de sesión o permisos, muestra un mensaje o redirige al login.

## Ventajas de este flujo

- **Seguridad:** El token y la sesión nunca salen del backend.
- **Centralización:** Todas las reglas de negocio, permisos y sesiones se controlan en un solo lugar.
- **Simplicidad en el frontend:** El frontend solo se preocupa por mostrar información y reaccionar a respuestas.

## Consideraciones para el despliegue 
  - Para que la Api-Gateway llegue por la red a WSO2 IS tiene que estar fuera del proxy

# 🛠️ Guía de despliegue en producción: WSO2 Identity Server + PostgreSQL con Docker

## 📦 Requisitos previos

- Docker y Docker Compose instalados
- PostgreSQL driver JDBC (`postgresql-42.x.x.jar`)
- Scripts SQL de inicialización (`postgresql.sql`, `identity/postgresql.sql`, `consent/postgresql.sql`)
- Certificados SSL válidos (opcional pero recomendado)
- Acceso a dominio público si se usará fuera de localhost

---

## 🔐 Seguridad y configuración

1. Define variables sensibles en `.env`:

   ```env
   DB_NAME=testdb
   DB_USER=wso2admin
   DB_PASS=una_contraseña_segura

2. Usa estas variables en docker-compose.yml:
  environment:
    POSTGRES_DB: ${DB_NAME}
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PASS}

3. Configura deployment.toml para que todas las bases apunten a testdb:
  name = "testdb"
  username = "wso2admin"
  password = "una_contraseña_segura"

4. Cambia credenciales por defecto (admin/admin) en la sección [super_admin].
5. Reemplaza el keystore autofirmado (wso2carbon.jks) por certificados SSL reales si usas dominios públicos.

🧱 Persistencia y volúmenes
1. Usa volumen pgdata para persistir datos de PostgreSQL:
  volumes:
  - pgdata:/var/lib/postgresql/data

2. Monta los scripts SQL en initdb/ para inicialización automática:
  volumes:
  - ./initdb:/docker-entrypoint-initdb.d

🔁 Puertos y conectividad
1. Expon ambos puertos en wso2is minimo el 9443 para frontend y back
  ports:
  - "9443:9443"  # backend OAuth2
  - "9444:9444"  # frontend SPA /console

2. Asegúrate de que el Service Provider "Console" tenga registrada esta URL:
  https://localhost:9444/console/login

📊 Monitoreo y logs
1. Monta logs en volúmenes persistentes si deseas conservarlos:
  volumes:
  - ./logs:/home/wso2carbon/wso2is-7.0.0/repository/logs

2. Integra observabilidad con Grafana + Prometheus o ELK Stack.

3. Activa el módulo de auditoría en WSO2 IS si necesitas trazabilidad.

⚙️ Automatización y mantenimiento

  1. Usa scripts para registrar Service Providers vía API REST de WSO2 IS.

  2. Configura backups automáticos de PostgreSQL (por ejemplo, con pg_dump + cron).

  3. Usa docker container prune regularmente para limpiar contenedores detenidos.

  4. Documenta todos los cambios en un changelog técnico.