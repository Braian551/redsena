# RedSENA

RedSENA es una red social en evolución para publicaciones e interacción entre usuarios. El repositorio contiene un monolito modular Spring Boot y un frontend React/Vite, con autenticación Firebase en el cliente y una primera vertical social persistida en PostgreSQL.

## Estado actual

- Backend: Spring Boot 4.1.1 con migraciones Flyway, usuarios sincronizados desde el `sub` autenticado, posts, media, comentarios, likes, GraphQL, caché/idempotencia/rate limit Redis y Actuator.
- Frontend: React/Vite con login y registro mediante Firebase Email/Password, acceso Google, persistencia de sesión y cierre de sesión; al autenticarse consume el feed y las mutaciones sociales por GraphQL con Bearer.
- Perfil: foto de Google por defecto y foto propia opcional en Firebase Storage, con reglas versionadas; el nombre visible se sincroniza con Firebase Auth y nombre/bio se persisten en PostgreSQL mediante GraphQL cuando el backend social está activo.
- Administración: dashboard Tailwind protegido por el rol `ADMIN`, con publicaciones paginadas por cursor, autores/contadores cargados en batch y eliminación transaccional de posts, asociaciones y archivos del volumen de uploads. El rol se resuelve en backend mediante `ADMIN_EMAILS` o claims/autoridades administrativas; el frontend no autoriza por correo.
- Compose: `backend/demo/compose.yaml` orquesta PostgreSQL 16, Redis 7.4, backend, frontend Nginx, media Nginx y reverse proxy Nginx, con red, health checks y volúmenes de PostgreSQL/uploads.
- El feed usa paginación keyset (`created_at DESC, id DESC`) y `@BatchMapping` para autores, contadores, likes del lector y comentarios, evitando N+1 evidente. Las variantes cacheadas incluyen el `sub` autenticado porque `likedByViewer` es específico de la sesión.
- Vitest/React Testing Library/Playwright aún no están declarados; el frontend se valida con los scripts reales `npm run lint` y `npm run build`.
- Despliegue: existe un módulo aislado en [`deploy/`](deploy/), documentado en [`dos/deployment-ubuntu-ssh.md`](dos/deployment-ubuntu-ssh.md) y respaldado por la [`investigación de despliegue`](dos/deployment-research.md). En la VPS compartida usa `172.17.0.1:18080`; el edge existente publica `redsena.online` sin alterar las rutas de Angelow.

No asumir que una capacidad de la arquitectura objetivo ya está disponible solo porque aparece documentada.

## Stack declarado

| Área | Tecnología y versión observada |
|---|---|
| Backend | Java 21, Spring Boot 4.1.1, Maven Wrapper 3.9.16 |
| Backend actual | JPA, PostgreSQL JDBC, GraphQL, Security resource server, Redis/cache, Flyway, Actuator, Spring Test, Testcontainers PostgreSQL/Redis |
| Frontend | JavaScript ES modules, React 19.2.8, React DOM 19.2.8 |
| Tooling frontend | Vite 8.3.0, `@vitejs/plugin-react` 6.1.1, Oxlint 1.81.0, Firebase 12.19.0, Tailwind CSS 4.x + `@tailwindcss/vite` |
| Objetivo de infraestructura | PostgreSQL, Redis, Docker Compose, Nginx y volumen persistente para uploads |
| Objetivo de pruebas | JUnit 5, Mockito, Testcontainers, GraphQlTester, Vitest, React Testing Library y Playwright |

Las versiones del `pom.xml`, `package.json` y lockfiles son la fuente concreta. No se actualizan dependencias mayores automáticamente.

## Estructura

```text
.
├── AGENTS.md
├── dos/constitution.md
├── .agents/skills/
│   ├── redsena-core/
│   ├── redsena-quality/
│   ├── redsena-design/
│   ├── redsena-backend/
│   ├── redsena-frontend/
│   ├── redsena-testing/
│   └── redsena-sdd/
├── .agents/specs/
│   ├── 001-login-specs/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── task.md
│   ├── 002-editprofile-specs/
│   └── 006-responsive-specs/
│       ├── spec.md
│       ├── plan.md
│       └── task.md
├── backend/demo/
│   ├── Dockerfile
│   ├── compose.yaml
│   ├── pom.xml
│   ├── docker/
│   └── src/
└── frontend/redsena/
    ├── package.json
    ├── package-lock.json
    └── src/
```

La arquitectura prevista mantiene un monolito modular:

```text
com.redsena.demo/
├── config/ security/ shared/
├── auth/ users/
├── posts/ comments/ likes/ feed/ media/
```

Cada módulo usa únicamente las capas que necesite: `presentation`, `application`, `domain` e `infrastructure`. En React, las pantallas componen features y las features agrupan componentes, hooks, estado y acceso a datos de una capacidad.

## Desarrollo local

### Backend

Desde `backend/demo`:

```powershell
.\mvnw.cmd test
```

El comando usa el Maven Wrapper del proyecto.

Para levantar todo el stack integrado:

```powershell
Copy-Item .env.example .env
# Completa FIREBASE_PROJECT_ID y VITE_FIREBASE_* antes de una prueba autenticada.
docker compose up --build -d
docker compose ps
```

La aplicación queda disponible en `http://localhost:8080`; GraphQL está en `/graphql`, uploads en `/api/uploads` y media en `/media/*`. PostgreSQL y Redis solo están publicados dentro de la red Compose. `docker compose down` conserva los volúmenes; evita `down -v` si quieres conservar datos.

Para ejecutar solo el backend durante desarrollo:

```powershell
.\mvnw.cmd spring-boot:run
```

### Frontend

Desde `frontend/redsena`:

```bash
npm ci
npm run dev
```

Antes de iniciar, copia `frontend/redsena/.env.example` como `.env.local` y completa la configuración Web de Firebase, incluido `VITE_FIREBASE_STORAGE_BUCKET`. En Firebase Console habilita los proveedores Email/Password, Google y Storage, y autoriza el dominio local. Para desarrollo con Vite, el proxy apunta al backend en `localhost:8080`; usa el Compose integrado si necesitas servir media.

Para habilitar administradores en el backend, define `ADMIN_EMAILS` como una lista separada por comas. En producción se configura únicamente en `deploy/.env.production`; no se guarda en el repositorio ni se usa como una decisión de autorización en React.

Comprobaciones disponibles actualmente:

```bash
npm run lint
npm run build
```

La prueba backend completa incluye contexto, migración, cursor y GraphQL contra PostgreSQL/Redis Testcontainers:

```powershell
cd backend/demo
.\mvnw.cmd test
docker compose -f compose.yaml config
```

## Principios de arquitectura

- PostgreSQL será la fuente de verdad; Redis será secundario para caché y datos efímeros.
- Backend modular con MVC: presentación, aplicación, dominio e infraestructura.
- GraphQL es la interfaz principal de posts, feed, comentarios y likes en `/graphql`, con esquemas separados y carga batch para evitar N+1.
- Los feeds usarán paginación limitada, preferiblemente por cursor/keyset.
- Las escrituras sensibles a reintentos usarán idempotencia y restricciones de base de datos.
- Los uploads usarán almacenamiento persistente y un contrato `MediaStorage`; los binarios no se guardarán en Git.
- `MediaStorage` aplica Strategy para que el volumen local pueda sustituirse por object storage sin acoplar el dominio; no se agregan abstracciones GoF sin una necesidad concreta.
- Docker Compose ya integra PostgreSQL, Redis, backend, frontend, media y Nginx con health checks; el despliegue productivo debe inyectar secretos y no publicar bases de datos.
- La interfaz React será modular, accesible, responsive y rápida, sin dependencias innecesarias.

## Documentación para agentes

Lee en este orden:

1. [`AGENTS.md`](AGENTS.md), reglas operativas completas.
2. [`dos/constitution.md`](dos/constitution.md), principios y Definition of Done.
3. `.agents/skills/redsena-core/SKILL.md`, enrutamiento de contexto.
4. El skill especializado en backend, frontend, diseño, calidad o testing que corresponda a la tarea.

Los skills locales están separados por responsabilidad para mantener las tareas rápidas y cargar solo el contexto necesario.

## Roadmap técnico

1. Base de configuración y Compose con PostgreSQL, Redis, frontend, media, Nginx y health checks. **Completado.**
2. Autenticación backend opcional con Firebase JWT, usuarios y migraciones Flyway. **Completado; requiere `FIREBASE_PROJECT_ID` para validar tokens reales.**
3. Publicaciones, media persistente, feed paginado, comentarios y likes explícitos. **Completado en primera vertical.**
4. GraphQL batch loading, caché, idempotencia, rate limiting, Actuator y errores consistentes. **Completado en primera vertical.**
5. Ampliar cobertura de frontend y E2E con Vitest/RTL/Playwright. **Pendiente.**
6. Despliegue productivo con secretos, HTTPS del edge compartido y smoke público. **Validado en `https://redsena.online` el 10-sep-2026**; queda pendiente el smoke autenticado manual con una cuenta real y la sustitución opcional del volumen local por object storage.

7. Edición de perfil con nombre visible y bio persistentes en PostgreSQL. **Implementado en la Spec 002**; Firebase Auth conserva la identidad visible y Firebase Storage continúa siendo el proveedor de la foto.
8. Dashboard de administración para moderar posts y sus media. **Implementado**; incluye rol backend, cursor keyset, consultas batch y limpieza post-commit del volumen. La gestión de usuarios, seguimiento y reportes administrativos queda fuera de este corte.
9. Publicaciones responsive con wrap seguro, marcos 4:3 y grilla adaptativa. **Implementado en la Spec 006**; queda pendiente el smoke visual autenticado con datos extremos.

Cada etapa debe conservar el alcance pequeño, probar el flujo vertical y documentar lo que realmente quedó implementado.

## Flujo SDD

Las capacidades se mantienen como artefactos Markdown trazables:

```text
spec.md → plan.md → task.md → implementación → verificación
```

El skill reutilizable está en [`.agents/skills/redsena-sdd/SKILL.md`](.agents/skills/redsena-sdd/SKILL.md). Las specs completas están en [`001-login-specs/spec.md`](.agents/specs/001-login-specs/spec.md), [`002-editprofile-specs/spec.md`](.agents/specs/002-editprofile-specs/spec.md) y [`006-responsive-specs/spec.md`](.agents/specs/006-responsive-specs/spec.md).
