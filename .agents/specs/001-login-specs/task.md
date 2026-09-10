# Tareas 001 — Login y registro con Firebase

Cada tarea se vincula a requisitos de [spec.md](spec.md).

## Contrato y skill

- [x] `T001` Investigar SDD y documentar el flujo adoptado. — `RF-SYS-004`, `RNF-MAINT-002`
- [x] `T002` Crear `.agents/skills/redsena-sdd/SKILL.md`. — `RNF-MAINT-002`
- [x] `T003` Registrar alcance, requisitos, no funcionales, aceptación y pendientes en `spec.md`. — `RF-SYS-003`, `RNF-*`

## Firebase y estado de sesión

- [x] `T004` Mantener la configuración Firebase detrás de `src/lib/firebase.js` y variables `VITE_*`. — `RF-AUTH-010`, `RF-SYS-002`, `RNF-SEC-001`
- [x] `T005` Implementar registro con email, contraseña, confirmación y nombre visible. — `RF-AUTH-002`, `RF-AUTH-003`
- [x] `T006` Implementar inicio de sesión con email/contraseña. — `RF-AUTH-004`
- [x] `T007` Conservar login Google y cierre de sesión. — `RF-AUTH-005`, `RF-AUTH-007`
- [x] `T008` Observar sesión con `onAuthStateChanged` y mostrar loading/sesión activa. — `RF-AUTH-006`, `RF-AUTH-009`
- [x] `T009` Mapear errores de Firebase y evitar información sensible. — `RF-AUTH-008`, `RNF-SEC-001`, `RNF-UX-002`

## UI React + Tailwind

- [x] `T010` Integrar `tailwindcss` y `@tailwindcss/vite` en Vite. — `RF-SYS-001`
- [x] `T011` Construir formulario accesible de login/registro y estados de validación. — `RF-AUTH-001`, `RF-AUTH-002`, `RNF-A11Y-001`
- [x] `T012` Mantener layout responsive y reducción de movimiento. — `RNF-A11Y-002`, `RNF-UX-001`

## Foto de perfil Firebase Storage

- [x] `T012-A` Usar `photoURL` de Google como avatar inicial y conservar la referencia del proveedor. — `RF-AUTH-011`
- [x] `T012-B` Subir foto propia con Firebase Storage, validación JPG/PNG/WebP y límite de 5 MB. — `RF-AUTH-012`, `RNF-SEC-004`
- [x] `T012-C` Permitir restaurar la foto de Google o volver a iniciales y reflejar el cambio en Posts. — `RF-AUTH-013`
- [x] `T012-D` Versionar `firebase.json` y `storage.rules` con acceso limitado por `uid`. — `RNF-SEC-004`, `RNF-OPS-003`

## Compose integrado y persistencia

- [x] `T013` Definir PostgreSQL 16 con variables, volumen y health check. — `RF-INFRA-001`, `RF-INFRA-003`, `RF-INFRA-004`
- [x] `T014` Definir Redis 7.4 efímero con health check y red interna. — `RF-INFRA-002`, `RF-INFRA-004`, `RNF-OPS-002`
- [x] `T015` Añadir `.env.example` de desarrollo y documentación de arranque. — `RF-INFRA-005`, `RNF-OPS-001`

- [x] `T015-A` Añadir Dockerfiles multi-stage para backend y frontend y Nginx para SPA/API/media. — `RNF-OPS-001`
- [x] `T015-B` Añadir volúmenes `postgres_data` y `redsena_uploads`, red interna y healthchecks encadenados. — `RF-INFRA-003`, `RF-INFRA-004`, `RNF-OPS-001`

## Primer vertical social

- [x] `T020` Crear entidades JPA/migración Flyway para users, posts, media, comments y likes. — `RF-SOCIAL-*`
- [x] `T021` Exponer queries/mutations GraphQL de post/feed/comment/like con paginación por cursor. — `RF-SOCIAL-*`
- [x] `T022` Resolver relaciones GraphQL con `@BatchMapping` y consultas batch para evitar N+1. — `RNF-PERF-*`
- [x] `T023` Implementar uploads multipart con `MediaStorage`, validación MIME/tamaño y volumen persistente. — `RNF-SEC-004`, `RNF-OPS-001`
- [x] `T024` Implementar cache-aside, idempotencia y rate limiting con Redis sin convertirlo en fuente de verdad. — `RNF-OPS-002`, `RNF-SEC-*`
- [x] `T025` Integrar el frontend con GraphQL/uploads y mantener fallback local explícito para desarrollo. — `RF-SYS-*`

## Verificación

- [ ] `T016` Ejecutar flujo real contra un proyecto Firebase con Email/Password y Google habilitados. — `RF-AUTH-003` a `RF-AUTH-006`
- [ ] `T017` Añadir pruebas Vitest/React Testing Library cuando se incorporen esas dependencias. — `RNF-MAINT-002`
- [x] `T018` Levantar Compose y verificar `healthy` con Docker Desktop disponible. — `RF-INFRA-001` a `RF-INFRA-004`, `RNF-OPS-001`
- [x] `T019` Implementar validación Firebase ID token en Spring Security y sincronización `users`. — `RNF-SEC-003`; falta prueba contra Firebase Console real
- [x] `T026` Ejecutar suite backend con Testcontainers, lint/build frontend y validación de schema GraphQL. — `RNF-MAINT-*`, `RNF-PERF-*`
