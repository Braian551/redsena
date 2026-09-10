# Plan 001 — Login y registro con Firebase

**Spec:** [spec.md](spec.md)  
**Estado:** implementado con pendientes explícitos  
**Orden SDD:** spec → plan → task → implementación → verificación

## Decisiones

1. **Firebase Auth en frontend:** el requerimiento pide una primera entrega de login/registro con Firebase. Se mantiene el proveedor detrás de `firebase.js` y `AuthContext` para que `App.jsx` no quede acoplado al SDK.
2. **Email/Password + Google:** email/contraseña cubre registro e inicio de sesión; Google conserva la capacidad previa sin forzar un segundo flujo de registro.
3. **Foto de perfil:** Google aporta la foto inicial; una foto propia se carga con el SDK nativo de Firebase Storage en una ruta fija por `uid` y actualiza el `photoURL` del usuario autenticado. La restauración recupera la foto del proveedor Google o deja el avatar por iniciales.
4. **Tailwind como plugin Vite:** se usa `tailwindcss` + `@tailwindcss/vite`, que es el flujo oficial para el Vite existente. No se agrega una librería de componentes.
5. **Compose integrado:** el `compose.yaml` orquesta PostgreSQL, Redis, backend, frontend, media y Nginx; la base y los uploads usan volúmenes, y PostgreSQL/Redis permanecen en la red interna.
6. **PostgreSQL persistente, Redis efímero:** la base de dominio debe sobrevivir al ciclo de contenedores; Redis aún no guarda datos críticos ni necesita volumen.

## Fases

### Fase 1 — Contrato SDD

- Completar `spec.md` con RF/RNF, alcance, aceptación y estado real.
- Crear `redsena-sdd` para repetir el flujo en nuevas capacidades.

### Fase 2 — Adaptador Firebase

- Eliminar fallback de configuración hardcodeada.
- Añadir casos de uso de email/contraseña y manejo de errores.
- Mantener `onAuthStateChanged` como única fuente de sesión en UI.

### Fase 3 — Interfaz

- Integrar Tailwind al pipeline Vite.
- Componer login/registro en una vista accesible y responsive.
- Incluir estados loading, error, disabled y sesión activa.

### Fase 3.1 — Foto de perfil

- Mostrar `photoURL` de Firebase, que inicialmente corresponde a Google cuando está disponible.
- Permitir seleccionar una foto propia y cargarla en Firebase Storage con validación de tipo y tamaño.
- Actualizar el `photoURL` del perfil Firebase y ofrecer restauración de la imagen del proveedor.
- Aplicar reglas versionadas de Storage sin exponer nombres originales ni credenciales privadas.

### Fase 4 — Backend social y frontera autenticada

- Mantener el monolito modular con capas de dominio, aplicación, infraestructura y presentación.
- Validar Firebase ID tokens de forma opcional mediante `FIREBASE_PROJECT_ID` y derivar el usuario desde `SecurityContext`.
- Persistir users, posts, media, comments y likes con Flyway/JPA.
- Exponer GraphQL con cursor, límite de página y `@BatchMapping` para evitar N+1.
- Implementar uploads multipart detrás de `MediaStorage`, idempotencia y rate limit con Redis.

### Fase 5 — Infraestructura local

- Definir PostgreSQL y Redis con versiones explícitas.
- Añadir variables de desarrollo, red, volumen y health checks.
- Mantener el driver PostgreSQL del backend y el smoke test con Testcontainers PostgreSQL.
- Integrar Dockerfiles multi-stage, media estático, Nginx reverse proxy, volúmenes y health checks.

### Fase 6 — Verificación

- Ejecutar `npm run lint` y `npm run build`.
- Ejecutar `docker compose config` y, si Docker está disponible, levantar servicios y revisar `docker compose ps`.
- Ejecutar suite backend con Testcontainers PostgreSQL/Redis y revisar schema GraphQL.
- Revisar diff, secretos, documentación y pendientes de Firebase real, Vitest/RTL, Playwright y producción.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Variables Firebase ausentes | El adaptador no inicializa Firebase y la UI muestra una instrucción accionable. |
| Errores de autenticación revelan información | Mensajes seguros y compatibles con protección de enumeración. |
| Confundir sesión Firebase con autenticación de API | El backend valida el Bearer token cuando `FIREBASE_PROJECT_ID` está configurado; sin él solo existe modo local explícito. |
| Redis se vuelve fuente de verdad | No se persiste dominio en Redis y se deja explícito en Compose/spec. |
| Cambios previos no relacionados | Se conserva el código existente y se limita el diff a esta capacidad. |
