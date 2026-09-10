# Spec 002 — Edición de perfil persistente y entrega desplegable

**Estado:** implementado y desplegado; pendiente externo de Firebase real  
**Orden SDD:** spec → plan → task → implementación → verificación

## 1. Problema y objetivo

La vista de perfil ya permite administrar la foto del usuario, pero el nombre visible y la bio no tenían un flujo persistente completo: la bio se guardaba en `localStorage` incluso cuando el frontend usaba el backend social y el nombre no se podía editar desde la pantalla. Eso rompe la expectativa de PostgreSQL como fuente de verdad y deja desincronizada la identidad visible entre dispositivos.

Esta capacidad permite editar nombre visible y bio, sincroniza el nombre con Firebase Auth, persiste ambos datos mediante GraphQL y PostgreSQL, mantiene Firebase Storage como proveedor de fotos, y deja el stack listo para desplegarse de forma reproducible mediante el módulo aislado `deploy/`.

## 2. Investigación de despliegue

La investigación se registra en [`dos/deployment-research.md`](../../../dos/deployment-research.md). Las decisiones se apoyan en documentación primaria:

- Docker Compose espera a dependencias declaradas con `condition: service_healthy` cuando tienen un health check: [Control startup and shutdown order](https://docs.docker.com/compose/how-tos/startup-order/).
- Los volúmenes administrados por Docker sobreviven al ciclo de vida de los contenedores, pueden compartirse y admiten montajes de solo lectura: [Volumes](https://docs.docker.com/engine/storage/volumes/).
- Nginx puede terminar la entrada pública y reenviar rutas HTTP con `proxy_pass` y headers explícitos: [NGINX Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy).
- Actuator ofrece `/actuator/health`; la exposición pública debe limitarse y protegerse: [Spring Boot Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html) y [Health endpoint](https://docs.spring.io/spring-boot/api/rest/actuator/health.html).
- El dominio público debe estar autorizado en Firebase para los flujos web: [Google sign-in for web](https://firebase.google.com/docs/auth/web/google-signin).

Decisión: conservar PostgreSQL, Redis, backend, frontend, media y reverse proxy en un único Compose productivo, con red propia, puertos de base de datos no publicados, volumen persistente de uploads y el puerto privado `172.17.0.1:18080` para el edge compartido. HTTPS y el certificado siguen siendo responsabilidad del edge existente.

## 3. Alcance

### Incluido

- Consultar `displayName` y `bio` del usuario autenticado mediante `me`.
- Actualizar únicamente el perfil propio con `updateProfile`, sin aceptar un `userId`.
- Recortar espacios, exigir un nombre visible de 1 a 120 caracteres y aceptar una bio vacía de hasta 180 caracteres en el servidor.
- Actualizar `displayName` en Firebase Auth y refrescar el token antes de persistir la representación social en PostgreSQL.
- Persistir la bio en PostgreSQL mediante una migración Flyway nueva.
- Invalidar las vistas cacheadas de posts/feed después del commit porque contienen datos del autor.
- Usar el backend cuando `VITE_SOCIAL_BACKEND_ENABLED=true` y conservar `localStorage` solo como fallback explícito.
- Validar, construir, desplegar y ejecutar smoke checks sobre el Compose productivo aislado.

### Fuera de alcance

- Cambiar el correo, la contraseña o el proveedor de autenticación.
- Guardar la foto de perfil en PostgreSQL; Firebase Storage sigue siendo el proveedor de fotos definido en la Spec 001.
- Seguimiento, seguidores persistidos y perfiles sociales públicos.
- Object storage, CDN, Kubernetes, balanceo multi-host y backups automáticos.
- Smoke autenticado contra un proyecto Firebase real, porque requiere credenciales y configuración externa del equipo.

## 4. Actores

| Actor | Necesidad |
|---|---|
| Usuario autenticado | Consultar y guardar su nombre visible y bio sin perderlos entre dispositivos. |
| Backend | Validar identidad, longitud y persistencia del nombre visible y la bio. |
| Operador | Levantar una versión reproducible y verificar salud sin afectar otros proyectos de la VPS. |

## 5. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---:|
| RF-PROFILE-001 | `me` debe devolver `displayName` y `bio` para la identidad autenticada cuando existe una cuenta sincronizada. | Alta |
| RF-PROFILE-002 | `updateProfile(input: { displayName, bio })` debe actualizar solo la cuenta derivada del `SecurityContext`; no debe aceptar un `userId`. | Alta |
| RF-PROFILE-003 | El backend debe recortar espacios, exigir un `displayName` de 1 a 120 caracteres y persistir una bio de 0 a 180 caracteres. | Alta |
| RF-PROFILE-004 | El frontend debe mostrar guardar, cancelar, contador de caracteres, estado de carga, éxito y error. | Alta |
| RF-PROFILE-005 | Con backend social activo, la UI debe leer/escribir mediante GraphQL; con la bandera desactivada, debe usar el fallback local documentado. | Alta |
| RF-PROFILE-006 | El frontend debe sincronizar el nombre visible con Firebase Auth y refrescar el token antes de guardar el perfil social. | Alta |

## 6. Requisitos no funcionales

| ID | Requisito verificable | Criterio |
|---|---|---|
| RNF-SEC-001 | La identidad se obtiene del token autenticado y no de datos enviados por el cliente. | Prueba GraphQL autenticada y mutación sin `userId`. |
| RNF-DB-001 | El cambio de esquema debe usar una migración Flyway nueva y una columna no nula con valor por defecto. | `V002__add_user_bio.sql` aplicada en integración. |
| RNF-CACHE-001 | Una actualización de perfil debe invalidar posts/feed después del commit. | `CacheInvalidation.afterCommit` se invoca desde el servicio de aplicación. |
| RNF-SYNC-001 | La identidad de Firebase y la representación social deben recibir el mismo nombre visible al finalizar el flujo. | `updateProfile` de Firebase, `getIdToken(true)` y `updateProfile` GraphQL. |
| RNF-OPS-001 | El despliegue debe validar Compose, usar servicios aislados y conservar PostgreSQL/uploads en volúmenes nombrados. | `docker compose config`, `up --build`, `docker compose ps` y smoke checks. |
| RNF-OPS-002 | PostgreSQL y Redis no deben publicar puertos de host en producción. | El Compose productivo solo publica el binding privado del reverse proxy. |
| RNF-OPS-003 | El edge público debe ser verificable sin exponer detalles de Actuator. | `/health` devuelve el estado agregado y `/actuator` no se publica por Nginx. |
| RNF-MAINT-001 | El acceso a perfil no debe depender del módulo de posts. | Repositorio en `features/profile/model`. |

## 7. Contrato GraphQL

```graphql
type User {
  id: ID!
  displayName: String!
  email: String!
  photoURL: String
  bio: String!
}

input UpdateProfileInput {
  displayName: String
  bio: String
}

type Query {
  me: User
}

type Mutation {
  updateProfile(input: UpdateProfileInput!): User!
}
```

La mutación no es idempotente por clave porque es una operación de estado: repetir el mismo payload deja el mismo estado final y no crea nuevos registros.

## 8. Criterios de aceptación

### Lectura y actualización

```gherkin
Dado que existe una sesión autenticada
Cuando se consulta me { displayName bio }
Entonces se devuelve el nombre visible y la bio persistidos del usuario actual

Dado que existe una sesión autenticada
Cuando se ejecuta updateProfile con nombre y bio rodeados de espacios
Entonces se guardan ambos valores recortados en PostgreSQL
Y la respuesta devuelve ambos valores recortados
Y una consulta posterior a me devuelve los mismos valores
```

### Validación y autorización

```gherkin
Dado que el nombre visible supera 120 caracteres o la bio supera 180 caracteres
Cuando se ejecuta updateProfile
Entonces la mutación falla con el código de validación correspondiente
Y no se modifica el perfil persistido

Dado que no existe una autenticación válida
Cuando se ejecuta updateProfile
Entonces la mutación falla con UNAUTHENTICATED
```

### Frontend y fallback

```gherkin
Dado que VITE_SOCIAL_BACKEND_ENABLED=true
Cuando el usuario abre su perfil y guarda cambios
Entonces la pantalla actualiza Firebase Auth, usa me/updateProfile y muestra el estado de éxito

Dado que VITE_SOCIAL_BACKEND_ENABLED=false
Cuando el usuario guarda cambios
Entonces la pantalla conserva el nombre y la bio en el fallback local documentado
```

### Despliegue

```gherkin
Dado que Docker y las variables de producción están disponibles en la VPS
Cuando se ejecuta bash scripts/deploy.sh desde deploy/
Entonces solo se actualiza el proyecto Compose redsena-prod
Y backend, frontend, media, nginx, postgres y redis reportan healthy
Y / y /health responden HTTP 200
Y el health agregado reporta status UP
Y los volúmenes de PostgreSQL/uploads no se eliminan
```

## 9. Trazabilidad

| Requisito | Evidencia | Estado |
|---|---|---|
| RF-PROFILE-001 a RF-PROFILE-003 | `users` domain/application/presentation, `user.graphqls`, `V002__add_user_bio.sql` | Implementado |
| RF-PROFILE-004 | `features/profile/components/ProfilePage.jsx` | Implementado |
| RF-PROFILE-005 | `features/profile/model/profileRepository.js` | Implementado |
| RF-PROFILE-006 | `context/AuthContext.jsx` + `ProfilePage.jsx` | Implementado |
| RNF-SEC-001 | `CurrentUserService` + `UserProfileService` | Implementado |
| RNF-DB-001 | `V002__add_user_bio.sql` + integración GraphQL | Implementado |
| RNF-CACHE-001 | `CacheInvalidation.afterCommit` + `evictUserViews` | Implementado |
| RNF-SYNC-001 | Firebase `updateProfile` + refresh de token + mutación GraphQL | Implementado |
| RNF-OPS-001 a RNF-OPS-003 | `deploy/docker-compose.prod.yml`, `deploy/scripts/*.sh` | Implementado y desplegado |
| RNF-MAINT-001 | repositorio de perfil separado del repositorio de posts | Implementado |

## 10. Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| `backend/demo/.\mvnw.cmd test` | 21 pruebas, 0 fallos, 0 errores; PostgreSQL 16 y Redis 7.4 mediante Testcontainers. |
| `frontend/redsena/npm run lint` | Correcto. |
| `frontend/redsena/npm run build` | Correcto; bundle Vite generado. |
| `docker compose -f compose.yaml config --quiet` | Correcto. |
| `docker compose -f deploy/docker-compose.prod.yml config --quiet` | Correcto con el ejemplo temporal; el archivo de producción real nunca se copió al repositorio. |
| `deploy/scripts/deploy.sh` en VPS | Correcto; seis servicios healthy y Flyway en versión `002`. |
| Smoke directo | `/` y `/health` HTTP 200; health agregado `UP`. |
| Smoke público | `https://redsena.online/` HTTP 200 y `/health` HTTP 200/UP. |
| Aislamiento | PostgreSQL/Redis sin puertos de host; solo Nginx en `172.17.0.1:18080`; `angelow.online` HTTP 200. |

## 11. Definition of Done

- [x] La spec, el plan y las tareas mantienen IDs trazables.
- [x] El nombre visible y la bio se persisten en PostgreSQL por GraphQL autenticado.
- [x] El nombre visible se sincroniza con Firebase Auth y la UI lo permite editar.
- [x] Existe una migración Flyway nueva sin modificar la migración inicial.
- [x] La UI mantiene estados de edición, validación, éxito y fallback local.
- [x] Las vistas cacheadas se invalidan después del commit.
- [x] La investigación de despliegue está documentada con fuentes primarias.
- [x] Compose productivo se valida y se despliega de forma aislada.
- [x] Smoke checks local y público pasan.
- [ ] La configuración real de Firebase y el smoke autenticado quedan a cargo del equipo.
