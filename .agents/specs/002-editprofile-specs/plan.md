# Plan 002 — Edición de perfil persistente y entrega desplegable

**Spec:** [spec.md](spec.md)  
**Estado:** implementado y desplegado con pendiente de smoke autenticado Firebase  
**Orden SDD:** spec → plan → task → implementación → verificación

## Decisiones

1. **Persistencia en PostgreSQL:** el nombre visible y la bio son estado de dominio del usuario y no deben depender de `localStorage` cuando el backend social está habilitado.
2. **Mutación explícita y autenticada:** `updateProfile` recibe nombre/bio; `CurrentUserService` deriva la cuenta desde `SecurityContext`, por lo que el cliente no puede elegir el propietario.
3. **Migración incremental:** `V002__add_user_bio.sql` agrega una columna no nula con un valor por defecto compatible con las cuentas ya existentes.
4. **Límite en aplicación y UI:** la UI usa `maxLength=120/180` para feedback inmediato y el servicio valida otra vez para proteger el contrato del servidor.
5. **Caché post-commit:** la mutación limpia `posts` y `feed` después del commit, porque las vistas cacheadas incluyen la información del autor.
6. **Frontera de feature:** la persistencia de perfil vive en `features/profile/model`; posts conserva solo su acceso a posts.
7. **Despliegue aislado:** se conserva `deploy/docker-compose.prod.yml` como único proyecto `redsena-prod`, con PostgreSQL/Redis internos, volumen de uploads y Nginx detrás del edge compartido.
8. **HTTPS en el edge:** el Compose no intenta ocupar `80/443`; el edge compartido conserva TLS y enruta a `172.17.0.1:18080`.
9. **Sincronización de identidad:** Firebase Auth actualiza el nombre visible y fuerza la renovación del ID token; GraphQL persiste la misma intención en la cuenta social autenticada.

## Fases

### Fase 1 — Baseline e investigación

- Leer reglas, constitución y estado real.
- Revisar el Compose local/productivo, scripts y topología de la VPS.
- Documentar las decisiones de health checks, volúmenes, reverse proxy, Actuator y Firebase.

### Fase 2 — Backend vertical

- Mantener el `displayName` editable en el agregado `UserAccount` y agregar `bio`.
- Crear migración Flyway `V002`.
- Exponer `displayName`, `bio`, `UpdateProfileInput` y `updateProfile` en GraphQL.
- Delegar la escritura a `UserProfileService` con validación, transacción e invalidación post-commit.
- Cubrir persistencia y recorte con `GraphQlTester`/Testcontainers.

### Fase 3 — Frontend vertical

- Mover `getProfile/saveProfile` fuera del repositorio de posts.
- Implementar `loadProfile/saveProfile` remoto con fallback local explícito.
- Mantener el flujo de edición de foto en Firebase Storage y conectar nombre/bio al backend.
- Actualizar el nombre en Firebase Auth, refrescar el token y conservar estados loading/error/success/cancel con límites visibles de 120/180 caracteres.

### Fase 4 — Entrega y despliegue

- Ejecutar lint/build frontend, tests backend y validación Compose.
- Transferir únicamente el snapshot necesario a `/opt/redsena-prod`, sin `.env.production` ni secretos.
- Ejecutar `deploy/scripts/deploy.sh` remoto.
- Verificar servicios, volúmenes, `/`, `/health` y el dominio público.

### Fase 5 — Cierre

- Revisar diff y búsqueda de secretos.
- Actualizar README y estado de spec/task.
- Dejar como pendiente explícito la configuración Firebase real y el smoke autenticado.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Una cuenta existente no tiene columna bio | Migración con `NOT NULL DEFAULT`. |
| La mutación actualiza la cuenta equivocada | Solo usa el subject autenticado; no acepta `userId`. |
| Perfil cacheado en posts muestra bio/nombre viejo | Invalidación de `posts` y `feed` tras commit. |
| Firebase y PostgreSQL no son una transacción única | La foto continúa en Firebase; la bio se guarda por separado y los errores se muestran para reintentar. |
| Firebase y PostgreSQL pueden fallar en momentos distintos al cambiar el nombre | Se actualiza Firebase, se refresca el token y se intenta persistir GraphQL; el error queda visible para reintentar sin perder el estado de Firebase. |
| Build frontend recibe configuración incompleta | Compose exige explícitamente las seis variables Firebase públicas obligatorias. |
| Despliegue afecta a Angelow | Proyecto, red, volúmenes y binding de RedSENA son propios; no se usa `down -v` ni prune. |
| El edge público no enruta el dominio | Smoke directo al binding y smoke HTTPS separados; el routing del edge queda documentado como prerrequisito. |
