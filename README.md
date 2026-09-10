# RedSENA

RedSENA es una red social en evolución para publicaciones e interacción entre usuarios. El repositorio contiene un scaffold de Spring Boot y React/Vite, con una primera vertical de autenticación Firebase en el frontend y una base de infraestructura local con PostgreSQL y Redis.

## Estado actual

- Backend: aplicación Spring Boot mínima en `backend/demo`, con una clase de arranque y un test de contexto. La validación Firebase ID token en Spring Security aún está pendiente.
- Frontend: React/Vite con login y registro mediante Firebase Email/Password, acceso Google, persistencia de sesión y cierre de sesión.
- Compose: `backend/demo/compose.yaml` define PostgreSQL 16 y Redis 7.4 con red, health checks y volumen persistente para PostgreSQL.
- Persistencia de dominio, GraphQL, Security backend, Flyway, Actuator, métricas y funcionalidades sociales todavía no están implementados. Redis está preparado como dependencia local, pero aún no lo consume el backend.
- Las pruebas de frontend y E2E están previstas, pero sus dependencias y scripts aún no están declarados.

No asumir que una capacidad de la arquitectura objetivo ya está disponible solo porque aparece documentada.

## Stack declarado

| Área | Tecnología y versión observada |
|---|---|
| Backend | Java 21, Spring Boot 4.1.1, Maven Wrapper 3.9.16 |
| Backend actual | Spring Data JPA, Thymeleaf, Docker Compose runtime, Spring Test, Testcontainers JUnit |
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
│   └── 001-login-specs/
│       ├── spec.md
│       ├── plan.md
│       └── task.md
├── backend/demo/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
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

Para levantar las dependencias de la etapa actual:

```powershell
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

Para ejecutar la aplicación durante la etapa actual:

```powershell
.\mvnw.cmd spring-boot:run
```

### Frontend

Desde `frontend/redsena`:

```bash
npm ci
npm run dev
```

Antes de iniciar, copia `frontend/redsena/.env.example` como `.env.local` y completa la configuración Web de Firebase. En Firebase Console habilita los proveedores Email/Password y Google, y autoriza el dominio local.

Comprobaciones disponibles actualmente:

```bash
npm run lint
npm run build
```

Los scripts de tests frontend y E2E se agregarán cuando se incorporen sus dependencias; no uses `npm test` hasta que exista en `package.json`.

## Principios de arquitectura

- PostgreSQL será la fuente de verdad; Redis será secundario para caché y datos efímeros.
- Backend modular con MVC: presentación, aplicación, dominio e infraestructura.
- GraphQL será la interfaz principal cuando se implemente, en `/graphql`, con esquemas separados y carga batch para evitar N+1.
- Los feeds usarán paginación limitada, preferiblemente por cursor/keyset.
- Las escrituras sensibles a reintentos usarán idempotencia y restricciones de base de datos.
- Los uploads usarán almacenamiento persistente y un contrato `MediaStorage`; los binarios no se guardarán en Git.
- Docker Compose evolucionará gradualmente hacia PostgreSQL, Redis, backend, frontend, media y Nginx con health checks.
- La interfaz React será modular, accesible, responsive y rápida, sin dependencias innecesarias.

## Documentación para agentes

Lee en este orden:

1. [`AGENTS.md`](AGENTS.md), reglas operativas completas.
2. [`dos/constitution.md`](dos/constitution.md), principios y Definition of Done.
3. `.agents/skills/redsena-core/SKILL.md`, enrutamiento de contexto.
4. El skill especializado en backend, frontend, diseño, calidad o testing que corresponda a la tarea.

Los skills locales están separados por responsabilidad para mantener las tareas rápidas y cargar solo el contexto necesario.

## Roadmap técnico

1. Completar la base de configuración y Compose con PostgreSQL, Redis y health checks. **Completado para la etapa local.**
2. Incorporar autenticación backend, usuarios/perfiles y migraciones Flyway. **Pendiente.**
3. Implementar publicaciones, media persistente, feed paginado, comentarios y likes idempotentes.
4. Añadir GraphQL, batch loading, caché, rate limiting, observabilidad y manejo de errores consistente.
5. Incorporar la batería proporcional de unitarios, integración, GraphQL, frontend y E2E.
6. Validar builds reproducibles, smoke tests y despliegue mediante Compose.

Cada etapa debe conservar el alcance pequeño, probar el flujo vertical y documentar lo que realmente quedó implementado.

## Flujo SDD

La capacidad 001 se mantiene como artefactos Markdown trazables:

```text
spec.md → plan.md → task.md → implementación → verificación
```

El skill reutilizable está en [`.agents/skills/redsena-sdd/SKILL.md`](.agents/skills/redsena-sdd/SKILL.md). La spec completa, incluidos requisitos funcionales, no funcionales, aceptación y pendientes, está en [`001-login-specs/spec.md`](.agents/specs/001-login-specs/spec.md).
