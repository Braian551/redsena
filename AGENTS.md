# AGENTS.md — RedSENA

## 1. Propósito

Este archivo define las reglas obligatorias de arquitectura, desarrollo, pruebas, infraestructura y despliegue para todos los agentes que trabajen sobre **RedSENA**.

RedSENA es una red social orientada a publicaciones e interacción entre usuarios.

El sistema debe soportar progresivamente:

- usuarios y perfiles;
- autenticación y autorización;
- publicaciones;
- imágenes/archivos asociados a publicaciones;
- likes;
- comentarios;
- feed;
- perfiles;
- seguimiento entre usuarios si es requerido;
- paginación;
- GraphQL;
- Redis;
- caché;
- idempotencia;
- rate limiting;
- almacenamiento persistente de uploads;
- Docker;
- Docker Compose;
- logs;
- métricas;
- health checks;
- pruebas unitarias;
- pruebas de integración;
- pruebas End-to-End;
- despliegue reproducible.

Este documento es la fuente principal de reglas para cualquier agente IA que modifique el proyecto.

---

# 2. Proyecto actual

Ruta principal:

```text
C:\Braian\redsena
```

Estructura detectada:

```text
redsena/
├── .agents/
├── backend/
│   └── demo/
│       ├── .mvn/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/redsena/demo/
│       │   │   │   ├── config/ security/ shared/
│       │   │   │   ├── users/ posts/ comments/
│       │   │   │   └── likes/ feed/ media/
│       │   │   └── resources/
│       │   │       ├── db/migration/
│       │   │       ├── graphql/
│       │   │       └── application.properties
│       │   └── test/java/com/redsena/demo/
│       │       ├── DemoApplicationTests.java
│       │       ├── SocialGraphQlIntegrationTests.java
│       │       └── TestcontainersConfiguration.java
│       ├── docker/
│       ├── Dockerfile / .dockerignore
│       ├── compose.yaml
│       ├── pom.xml
│       ├── mvnw
│       └── mvnw.cmd
├── dos/
│   └── constitution.md
├── frontend/
│   └── redsena/
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   ├── App.css
│       │   ├── App.jsx
│       │   ├── index.css
│       │   └── main.jsx
│       ├── Dockerfile / nginx.conf
│       ├── package.json
│       ├── package-lock.json
│       └── vite.config.js
├── AGENTS.md
└── CLAUDE.md
```

Estado validado en septiembre de 2026: el backend mantiene el monolito modular Spring Boot con PostgreSQL/Flyway, Redis para caché e idempotencia, GraphQL, seguridad Bearer/Firebase opcional, uploads multipart y Actuator. El frontend React/Vite consume el feed GraphQL después del registro/login Firebase, crea posts con imágenes, usa likes explícitos y se empaqueta en Nginx. El Compose integrado orquesta backend, frontend, media, Nginx, PostgreSQL y Redis con red, health checks y volumen persistente de uploads. El caché de vistas que contiene `likedByViewer` se separa por el `sub` autenticado.

Patrones aplicados con beneficio concreto: `MediaStorage` usa Strategy para desacoplar almacenamiento local de futuros object stores; repositorios encapsulan persistencia; caché-aside, idempotencia y operaciones explícitas de estado protegen las escrituras. No se agregan patrones GoF ni capas vacías por anticipación.

Las capacidades de seguimiento, perfiles sociales persistidos, complejidad GraphQL avanzada y E2E Playwright siguen siendo trabajo posterior; no deben marcarse como implementadas solo por estar en la arquitectura objetivo.

Los agentes deben **evolucionar esta estructura**, no sustituirla innecesariamente.

---

# 3. Stack tecnológico

## Backend

Usar:

- Java;
- Spring Boot;
- Spring Web cuando sea necesario;
- Spring for GraphQL;
- Spring Security;
- Spring Data JPA;
- Spring Data Redis;
- Spring Cache;
- Bean Validation;
- Spring Boot Actuator;
- Micrometer;
- Maven;
- PostgreSQL;
- Flyway;
- Redis;
- JUnit 5;
- Mockito;
- Testcontainers;
- GraphQlTester.

La versión exacta de Java y Spring Boot debe respetar primero lo definido en `pom.xml`.

**No actualizar Spring Boot, Java, Maven plugins o dependencias mayores automáticamente.**

Si una versión no está definida todavía, preferir una versión LTS de Java compatible con la versión de Spring Boot utilizada.

---

## Frontend

Mantener:

- React;
- Vite;
- JavaScript mientras el proyecto continúe usando JS;
- CSS/Tailwind solamente si se encuentra instalado o su incorporación es parte de la tarea;
- GraphQL Client;
- Vitest;
- React Testing Library;
- Playwright para E2E.

No migrar React a Next.js, Angular, Vue u otro framework sin instrucción explícita.

---

## Infraestructura

Utilizar:

- Docker;
- Docker Compose;
- Nginx;
- PostgreSQL;
- Redis;
- volumen persistente para uploads;
- Actuator;
- Prometheus opcional;
- Grafana opcional;
- Loki opcional para agregación de logs.

La observabilidad avanzada debe poder activarse mediante un perfil de Compose si consume recursos innecesarios durante desarrollo.

Ejemplo:

```bash
docker compose --profile observability up -d
```

---

# 4. Arquitectura general

RedSENA debe mantenerse inicialmente como un **monolito modular**, no como microservicios.

No dividir prematuramente publicaciones, comentarios, likes, usuarios, media, etc. en microservicios.

La separación debe ser lógica por módulos dentro del backend.

Arquitectura objetivo:

```text
                       ┌─────────────────┐
                       │     Browser     │
                       └────────┬────────┘
                                │ HTTPS
                                ▼
                       ┌─────────────────┐
                       │      Nginx      │
                       │ Reverse Proxy   │
                       └───────┬─┬───────┘
                               │ │
                ┌──────────────┘ └──────────────┐
                ▼                               ▼
       ┌────────────────┐              ┌────────────────┐
       │ React / Vite   │              │ Media /uploads │
       │ Frontend       │              │ static origin  │
       └───────┬────────┘              └────────────────┘
               │
               │ /graphql
               │ /api/*
               ▼
       ┌────────────────────────────┐
       │       Spring Boot          │
       │                            │
       │ Auth                       │
       │ Users                      │
       │ Posts                      │
       │ Comments                   │
       │ Likes                      │
       │ Feed                       │
       │ Media                      │
       │ Idempotency                │
       │ Cache                      │
       └───────────┬───────┬────────┘
                   │       │
             ┌─────▼───┐ ┌─▼────────┐
             │Postgres │ │  Redis   │
             └─────────┘ └──────────┘
```

PostgreSQL es la fuente de verdad.

Redis **NO** debe convertirse en la base de datos principal del dominio.

---

# 5. Organización del backend

Evolucionar gradualmente hacia:

```text
com.redsena.demo
├── config/
├── security/
├── shared/
│   ├── exception/
│   ├── graphql/
│   ├── logging/
│   ├── idempotency/
│   ├── cache/
│   └── validation/
├── auth/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── presentation/
├── users/
├── posts/
├── comments/
├── likes/
├── feed/
└── media/
```

Cada módulo debe mantener, cuando sea útil:

```text
module/
├── application/
├── domain/
├── infrastructure/
└── presentation/
```

No crear capas vacías únicamente por cumplir arquitectura.

---

# 6. Responsabilidades por capa

## Domain

Contiene:

- entidades;
- value objects;
- reglas de negocio;
- contratos de dominio.

No debe depender de GraphQL, HTTP o detalles específicos de infraestructura siempre que sea razonable.

## Application

Contiene:

- casos de uso;
- servicios de aplicación;
- coordinación entre repositorios;
- transacciones.

## Infrastructure

Contiene:

- JPA;
- Redis;
- filesystem;
- integración con servicios externos;
- implementaciones concretas.

## Presentation

Contiene:

- GraphQL controllers;
- REST controllers;
- DTOs de entrada/salida;
- mappers relacionados con transporte.

---

# 7. Base de datos

Usar PostgreSQL como persistencia principal.

Entidades iniciales esperadas:

```text
users
profiles
posts
post_media
comments
post_likes
follows
```

No es obligatorio crear todas inmediatamente.

Crear únicamente las requeridas por cada funcionalidad.

---

# 8. Migraciones

Usar Flyway.

Nunca depender de:

```properties
spring.jpa.hibernate.ddl-auto=create
```

en producción.

Las modificaciones de esquema deben realizarse mediante archivos versionados:

```text
src/main/resources/db/migration/
├── V001__initial_schema.sql
├── V002__create_posts.sql
├── V003__create_comments.sql
└── ...
```

Nunca modificar una migración ya aplicada en entornos compartidos.

Crear una migración nueva.

---

# 9. IDs

Preferir UUID para entidades expuestas públicamente.

Ejemplo:

```text
userId
postId
commentId
mediaId
```

No exponer secuencias internas predecibles si no existe necesidad.

---

# 10. GraphQL

GraphQL será el mecanismo principal para consultar y modificar datos de la red social.

Ruta estándar:

```text
/graphql
```

Schemas:

```text
src/main/resources/graphql/
```

Ejemplo:

```text
graphql/
├── user.graphqls
├── post.graphqls
├── comment.graphqls
├── feed.graphqls
└── common.graphqls
```

No crear un único archivo GraphQL gigantesco.

---

# 11. Operaciones GraphQL sugeridas

Ejemplo conceptual:

```graphql
type Query {
  me: User
  user(id: ID!): User
  post(id: ID!): Post
  feed(first: Int!, after: String): PostConnection!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  deletePost(id: ID!): Boolean!

  addComment(input: AddCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!

  setPostLike(postId: ID!, liked: Boolean!): PostLikeResult!
}
```

Preferir:

```graphql
setPostLike(postId: ID!, liked: Boolean!)
```

sobre:

```graphql
toggleLike(postId: ID!)
```

porque una operación explícita de estado es naturalmente más segura frente a reintentos.

---

# 12. GraphQL N+1

Nunca resolver relaciones GraphQL mediante consultas individuales dentro de ciclos.

Ejemplo problemático:

```text
feed -> 20 posts
     -> user por post
     -> likes por post
     -> comentarios por post
```

Esto puede provocar decenas de consultas.

Utilizar:

- `@BatchMapping`;
- `BatchLoaderRegistry`;
- DataLoader;
- consultas batch de repositorio.

Ejemplo conceptual:

```java
@BatchMapping
public Map<Post, User> author(List<Post> posts) {
    // cargar todos los autores requeridos mediante una sola operación
}
```

Aplicar especialmente a:

- `Post.author`;
- `Post.likeCount`;
- `Post.commentCount`;
- `Comment.author`;
- relaciones usuario/perfil.

---

# 13. Paginación

Nunca implementar feeds completos sin paginación.

Evitar:

```sql
SELECT * FROM posts;
```

El feed debe usar preferiblemente paginación por cursor/keyset.

Orden recomendado:

```text
created_at DESC
id DESC
```

Cursor conceptual:

```text
base64(createdAt + ":" + id)
```

GraphQL:

```graphql
feed(first: 20, after: "cursor")
```

Debe existir un límite máximo del lado servidor incluso si el cliente solicita cantidades mayores.

Ejemplo:

```text
default = 20
maximum = 50
```

---

# 14. Redis

Redis se utilizará para:

1. caché;
2. idempotencia;
3. rate limiting;
4. datos efímeros;
5. contadores temporales cuando tenga sentido;
6. posible ranking/feed temporal;
7. locks únicamente cuando sean realmente necesarios.

Redis no reemplaza las restricciones de integridad de PostgreSQL.

---

# 15. Estrategia de caché

Implementar principalmente el patrón **cache-aside**.

Flujo:

```text
Cliente
   │
   ▼
Backend
   │
   ├── buscar Redis
   │       │
   │       ├─ HIT ─────> respuesta
   │       │
   │       └─ MISS
   │           │
   │           ▼
   │       PostgreSQL
   │           │
   │           ▼
   └──── guardar Redis
               │
               ▼
            respuesta
```

Spring Cache puede utilizar:

```java
@Cacheable
@CacheEvict
@CachePut
```

con Redis como implementación.

---

# 16. Qué cachear

Candidatos:

```text
post:{id}
user:{id}
profile:{id}
feed:user:{id}:{cursor}
post:{id}:counts
comments:{postId}:first-page
```

No utilizar literalmente estas claves si Spring Cache ya administra prefijos; mantener una convención consistente.

---

# 17. TTL inicial sugerido

Los TTL son configurables y deben medirse antes de optimizar.

Punto inicial:

| Cache | TTL inicial |
|---|---:|
| Perfil de usuario | 5 min |
| Publicación | 2 min |
| Feed | 30 s |
| Primera página de comentarios | 30 s |
| Contadores de likes/comentarios | 15–60 s |
| Configuraciones poco variables | 10 min |

Agregar jitter cuando se implementen grandes cantidades de claves para evitar que todas expiren simultáneamente.

Ejemplo conceptual:

```text
TTL base 300 s
TTL real 270–330 s
```

---

# 18. Invalidación de caché

Cada escritura relevante debe analizar qué cachés invalida.

Ejemplo:

```text
createPost
→ invalidar feed del autor
→ invalidar feeds afectados cuando aplique

updatePost
→ invalidar post:{id}

addComment
→ invalidar comentarios del post
→ invalidar contador

setPostLike
→ invalidar contador
```

Cuando sea posible realizar invalidaciones **después del commit de base de datos**.

No eliminar caché antes de confirmar una transacción y luego asumir que el cambio fue persistido.

---

# 19. Feed y Redis

PostgreSQL seguirá siendo la fuente de verdad.

Para una primera versión:

```text
PostgreSQL
  ↓
consulta keyset
  ↓
cache Redis
  ↓
GraphQL
```

No construir inmediatamente un sistema complejo de fan-out.

Cuando el proyecto realmente lo requiera, Redis Sorted Sets pueden utilizarse para mantener IDs ordenados:

```text
feed:{userId}
```

con:

```text
score = timestamp
member = postId
```

Pero almacenar preferentemente IDs/referencias, no duplicar publicaciones completas innecesariamente.

---

# 20. Likes

La base de datos debe proteger duplicados.

Crear restricción única equivalente a:

```text
UNIQUE(user_id, post_id)
```

Redis no sustituye esta restricción.

La mutación recomendada es:

```text
setPostLike(postId, liked=true)
setPostLike(postId, liked=false)
```

La misma solicitud repetida debe producir el mismo estado final.

---

# 21. Idempotencia

Las operaciones que pueden crear duplicados deben admitir idempotencia.

Especialmente:

- crear post;
- crear comentario;
- uploads;
- operaciones futuras de pago si existieran;
- operaciones disparadas desde clientes móviles o conexiones inestables.

Header:

```http
Idempotency-Key: <uuid>
```

La clave debe estar asociada como mínimo a:

```text
usuario
operación
idempotency-key
```

Ejemplo conceptual:

```text
idem:{userId}:create-post:{key}
```

---

# 22. Flujo de idempotencia

Estado conceptual almacenado:

```json
{
  "status": "PROCESSING",
  "requestHash": "...",
  "resourceId": null
}
```

Proceso:

```text
1. Cliente envía Idempotency-Key.

2. Backend calcula hash del payload relevante.

3. Redis intenta crear:

   SET idem:<scope>:<key> ... NX EX <ttl>

4. Si Redis acepta:
   → solicitud nueva.

5. Ejecutar transacción.

6. Después del éxito:
   → guardar COMPLETED + resourceId/resultado.

7. Si llega la misma clave nuevamente:
   → comprobar requestHash.

8. Si payload coincide y está COMPLETED:
   → retornar el resultado original.

9. Si la clave existe pero el payload cambió:
   → rechazar la solicitud.

10. Si está PROCESSING:
   → indicar que la operación sigue en procesamiento
     o devolver un conflicto/retry controlado.
```

Nunca permitir que una misma `Idempotency-Key` represente payloads diferentes.

---

# 23. Redis no reemplaza la idempotencia de base de datos

La aplicación debe asumir que Redis puede reiniciarse o perder información efímera.

Por lo tanto deben existir protecciones de dominio adicionales.

Ejemplo:

```text
post_likes:
UNIQUE(user_id, post_id)
```

La idempotencia Redis protege reintentos.

Las restricciones PostgreSQL protegen la integridad final.

---

# 24. TTL de idempotencia

Punto inicial:

```text
PROCESSING: 2–5 minutos
COMPLETED: 24 horas
```

Debe ser configurable:

```properties
app.idempotency.processing-ttl=
app.idempotency.completed-ttl=
```

No hardcodear valores por toda la aplicación.

---

# 25. Rate limiting

Implementar rate limiting con Redis para operaciones susceptibles a abuso.

Ejemplos:

```text
login
registro
createPost
addComment
upload
búsqueda
```

Clave conceptual:

```text
rate:{user-or-ip}:{operation}
```

Los límites deben configurarse externamente.

Ejemplo conceptual:

```text
POST_CREATE = 10/minuto
COMMENT_CREATE = 30/minuto
UPLOAD = 20/minuto
LOGIN = 10/minuto/IP
```

Estos valores son parámetros iniciales, no requisitos permanentes.

No dispersar números mágicos por controllers.

---

# 26. Uploads

Los binarios no deben enviarse directamente dentro de GraphQL salvo que exista una razón técnica muy clara.

Preferir:

```http
POST /api/uploads
Content-Type: multipart/form-data
```

Respuesta:

```json
{
  "id": "...",
  "url": "/media/...",
  "contentType": "image/jpeg"
}
```

Después GraphQL utiliza el identificador o URL:

```graphql
createPost(
  input: {
    content: "..."
    mediaIds: ["..."]
  }
)
```

---

# 27. Almacenamiento de uploads

Durante la primera etapa puede existir un volumen persistente:

```text
redsena_uploads
```

Compartido entre:

```text
backend     → read/write
media/nginx → read-only
```

Arquitectura:

```text
Spring Boot
    │
    │ escritura
    ▼
Docker Volume
 redsena_uploads
    │
    │ lectura
    ▼
Media Nginx
    │
    ▼
/media/*
```

Ejemplo conceptual:

```yaml
volumes:
  uploads:
```

Backend:

```yaml
volumes:
  - uploads:/app/uploads
```

Media:

```yaml
volumes:
  - uploads:/usr/share/nginx/html/media:ro
```

El contenedor de media funciona como **origen estático**, no como CDN global real.

Si RedSENA escala, la capa de almacenamiento debe poder sustituirse por:

```text
S3
Cloudflare R2
MinIO
u otro object storage compatible
```

sin cambiar la lógica principal del dominio.

---

# 28. Seguridad de uploads

Obligatorio:

- generar nombres internos mediante UUID;
- no confiar en nombre de archivo suministrado por usuario;
- validar MIME;
- validar extensión;
- limitar tamaño;
- bloquear traversal `../`;
- no permitir escritura directa desde internet al volumen;
- impedir ejecución de archivos;
- no guardar uploads dentro del repositorio Git.

Nunca:

```text
/uploads/nombre-original-del-usuario.php
```

Preferir:

```text
/uploads/2026/09/<uuid>.jpg
```

---

# 29. Abstracción de almacenamiento

Crear un contrato:

```java
public interface MediaStorage {
    StoredMedia store(...);
    void delete(...);
}
```

Implementación inicial:

```text
LocalVolumeMediaStorage
```

Una implementación futura podrá ser:

```text
S3MediaStorage
R2MediaStorage
```

No acoplar `PostService` directamente a `java.io.File`.

---

# 30. Docker

Backend y frontend deben tener Dockerfiles reproducibles.

Utilizar builds multi-stage.

Conceptualmente:

```text
backend:
Maven builder
      ↓
JRE runtime

frontend:
Node builder
      ↓
Nginx runtime
```

No instalar Maven o Node dentro de las imágenes finales si no son necesarios para ejecución.

---

# 31. Docker Compose

El Compose raíz objetivo debe poder orquestar:

```text
postgres
redis
backend
frontend
media
nginx
```

Observabilidad opcional:

```text
prometheus
grafana
loki
```

---

# 32. Red Docker

Crear una red interna:

```text
redsena_network
```

Servicios internos no deben publicarse innecesariamente.

Producción:

```text
Internet
   │
   ▼
nginx :80/:443
   │
   ├── frontend
   ├── backend
   └── media

postgres  ─ internal
redis     ─ internal
```

PostgreSQL y Redis no deben quedar expuestos públicamente en producción.

---

# 33. Health checks

Todos los componentes críticos deben tener healthcheck.

Redis:

```bash
redis-cli ping
```

PostgreSQL:

```bash
pg_isready
```

Backend:

```text
/actuator/health
```

Compose debe usar:

```yaml
depends_on:
  postgres:
    condition: service_healthy
  redis:
    condition: service_healthy
```

No asumir que un contenedor iniciado significa que la aplicación está preparada para recibir conexiones.

---

# 34. Configuración

Separar:

```text
application.properties
application-dev.properties
application-test.properties
application-prod.properties
```

Usar variables de entorno para:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
REDIS_HOST
REDIS_PORT
JWT_SECRET
UPLOAD_PATH
CORS_ALLOWED_ORIGINS
```

Nunca subir secretos reales.

Crear:

```text
.env.example
```

No subir:

```text
.env
```

---

# 35. Logs

En contenedores, la aplicación debe emitir logs principalmente hacia:

```text
stdout
stderr
```

No depender exclusivamente de archivos internos del contenedor.

Formato preferido para producción:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "service": "redsena-backend",
  "traceId": "...",
  "requestId": "...",
  "userId": "...",
  "event": "post.created"
}
```

Los logs deben ser estructurados cuando la configuración del proyecto lo permita.

---

# 36. Correlation ID

Toda solicitud debe tener un identificador.

Aceptar:

```http
X-Request-ID
```

o generar uno.

Propagarlo por:

```text
HTTP
GraphQL context
logs
errores
métricas cuando sea apropiado
```

Esto permitirá seguir:

```text
Frontend
  ↓
Nginx
  ↓
Backend
  ↓
DB/Redis
```

---

# 37. Nunca registrar

No registrar:

- contraseñas;
- JWT completos;
- refresh tokens;
- secretos;
- headers Authorization;
- cookies de sesión;
- contenido privado innecesario;
- archivos binarios;
- credenciales de base de datos.

---

# 38. Niveles de log

Usar adecuadamente:

```text
ERROR → fallo que requiere atención
WARN  → comportamiento inesperado recuperable
INFO  → eventos de negocio/operación importantes
DEBUG → diagnóstico de desarrollo
TRACE → casos excepcionales
```

No llenar producción de `DEBUG`.

No utilizar `System.out.println` como sistema de logging.

---

# 39. Observabilidad

Agregar Spring Boot Actuator.

Como mínimo considerar:

```text
/actuator/health
/actuator/info
/actuator/metrics
```

Producción no debe exponer indiscriminadamente todos los endpoints Actuator.

Proteger endpoints administrativos.

---

# 40. Métricas

Utilizar Micrometer.

Métricas útiles:

```text
redsena.posts.created
redsena.comments.created
redsena.likes.created
redsena.uploads.total
redsena.uploads.failed
redsena.graphql.errors
redsena.cache.hit
redsena.cache.miss
redsena.idempotency.duplicate
redsena.rate_limit.rejected
```

Además observar:

```text
JVM
CPU
memoria
threads
HTTP latency
DB connections
Redis latency
```

Prometheus/Grafana pueden incorporarse mediante perfil de Compose.

---

# 41. Seguridad

Utilizar Spring Security.

Nunca confiar en IDs de usuario enviados por frontend para determinar el usuario autenticado.

Incorrecto:

```graphql
createPost(userId: "123", ...)
```

Correcto:

```text
Usuario obtenido del SecurityContext/JWT
```

Validar autorización dentro del backend.

---

# 42. Validación

Utilizar Bean Validation.

Ejemplos:

```java
@NotBlank
@Size
@Email
@Positive
```

No confiar únicamente en validaciones React.

Toda regla crítica debe existir del lado servidor.

---

# 43. Manejo de errores GraphQL

Los errores deben tener una clasificación consistente.

Ejemplo conceptual:

```json
{
  "errors": [
    {
      "message": "Post no encontrado",
      "extensions": {
        "code": "POST_NOT_FOUND",
        "requestId": "..."
      }
    }
  ]
}
```

No devolver stack traces al cliente.

---

# 44. Transacciones

Operaciones de escritura relacionadas deben usar transacciones.

Ejemplo:

```text
createPost
├── insertar post
├── insertar media associations
└── commit
```

No publicar invalidaciones o eventos definitivos antes de que la transacción haya confirmado correctamente.

---

# 45. Concurrencia

No implementar patrones:

```text
if (!exists()) {
    insert();
}
```

como única protección contra concurrencia.

Dos solicitudes simultáneas podrían pasar el `exists()`.

Usar:

- restricciones UNIQUE;
- operaciones atómicas Redis;
- transacciones;
- locking solamente donde sea necesario.

---

# 46. Tests backend

La pirámide mínima debe incluir:

## Unitarios

JUnit 5 + Mockito.

Probar:

- servicios;
- reglas de negocio;
- validadores;
- mappers complejos;
- idempotency service;
- cache invalidation decisions;
- permisos.

No arrancar Spring entero para un test puramente unitario.

---

# 47. Tests de integración

Usar Testcontainers para dependencias reales.

Ya existe:

```text
TestcontainersConfiguration.java
```

Aprovecharlo.

Probar contra contenedores de:

```text
PostgreSQL
Redis
```

No sustituir todas las pruebas de infraestructura por mocks.

---

# 48. Tests GraphQL

Usar `GraphQlTester`.

Probar:

```text
queries
mutations
errores
autorización
paginación
validación
N+1 cuando pueda medirse
```

Ejemplos mínimos:

```text
createPost
getPost
feed
addComment
setPostLike
deletePost
```

---

# 49. Tests de idempotencia

Deben existir pruebas para:

```text
misma key + mismo payload
→ mismo resultado

misma key + payload diferente
→ rechazo

dos solicitudes concurrentes
→ una única operación de dominio

key expirada
→ comportamiento definido
```

Además verificar integridad en PostgreSQL.

---

# 50. Tests Redis/cache

Probar:

```text
cache miss
cache hit
TTL
eviction
write + eviction
Redis unavailable
```

La aplicación no debe corromper datos si Redis falla.

Para funcionalidades donde Redis sea solamente caché, considerar degradación hacia PostgreSQL.

---

# 51. Frontend tests

Utilizar:

```text
Vitest
React Testing Library
```

Probar:

- componentes;
- estados loading;
- estados error;
- feed;
- publicaciones;
- comentarios;
- likes;
- formularios.

Evitar tests que dependan demasiado de detalles internos de implementación.

---

# 52. E2E

Utilizar Playwright.

Crear una carpeta similar a:

```text
frontend/redsena/e2e/
```

Escenarios principales:

```text
auth.spec.*
create-post.spec.*
feed.spec.*
like.spec.*
comment.spec.*
upload.spec.*
```

Flujo crítico mínimo:

```text
usuario inicia sesión
→ crea publicación
→ aparece en feed
→ otro usuario abre publicación
→ da like
→ comenta
→ contador cambia
→ comentario aparece
```

---

# 53. E2E y Docker

Preferir ejecutar E2E contra infraestructura equivalente a la real.

Conceptualmente:

```text
docker compose -f compose.yaml -f compose.test.yaml up -d
npm run test:e2e
```

El entorno de prueba debe utilizar bases de datos independientes.

Nunca ejecutar E2E destructivo contra producción.

---

# 54. Datos de prueba

Crear factories/builders/fixtures.

No depender de datos creados manualmente anteriormente.

Cada test debe poder ejecutarse:

```text
solo
en conjunto
en CI
repetidamente
```

---

# 55. Estrategia de despliegue

Cada despliegue debe ser reproducible desde el repositorio.

Secuencia conceptual:

```text
git checkout release
        ↓
tests backend
        ↓
tests frontend
        ↓
build frontend
        ↓
build Docker images
        ↓
docker compose config
        ↓
migrations
        ↓
docker compose up -d
        ↓
health checks
        ↓
smoke tests
```

No considerar despliegue exitoso únicamente porque los contenedores estén `Up`.

Verificar health.

---

# 56. Reverse proxy

Nginx será el único punto público del stack cuando se despliegue en servidor.

Rutas conceptuales:

```text
/             → frontend
/graphql      → backend
/api/         → backend
/media/       → media origin
```

Configurar tamaño máximo de upload explícitamente.

Configurar HTTPS en producción.

---

# 57. Docker volumes

Como mínimo:

```text
postgres_data
redis_data       # solo si se decide persistir Redis
redsena_uploads
```

Los uploads nunca deben depender de la capa writable efímera de un contenedor.

Ejecutar:

```bash
docker compose down
```

no debe eliminar publicaciones ni uploads.

Tener cuidado con:

```bash
docker compose down -v
```

porque elimina volúmenes.

---

# 58. Redis y persistencia

Redis sigue siendo infraestructura secundaria.

Si se habilita persistencia Redis, hacerlo conscientemente.

El sistema no debe asumir que Redis ofrece la misma durabilidad que PostgreSQL.

Las operaciones críticas deben mantenerse protegidas por restricciones de base de datos.

---

# 59. Índices PostgreSQL

Crear índices de acuerdo con consultas reales.

Probablemente serán necesarios:

```text
posts(created_at, id)
posts(user_id, created_at)
comments(post_id, created_at)
post_likes(post_id)
post_likes(user_id)
follows(follower_id)
follows(following_id)
```

No agregar índices masivamente sin analizar consultas.

---

# 60. Contadores

Evitar ejecutar constantemente:

```sql
SELECT COUNT(*) ...
```

para cada post de un feed grande.

Estrategia incremental:

Primera etapa:

```text
queries batch
```

Luego, si existe cuello de botella:

```text
counter columns
Redis counters
materialización
```

Pero PostgreSQL debe conservar una forma de reconstruir o verificar los valores.

---

# 61. Consistencia de likes y comentarios

Si Redis almacena temporalmente contadores:

```text
post:{id}:likes
post:{id}:comments
```

estos valores son optimizaciones.

No deben convertirse en la única evidencia de que un like/comentario existe.

---

# 62. Manejo de fallo Redis

Cada funcionalidad debe clasificarse.

## Cache

Si Redis falla:

```text
continuar usando PostgreSQL cuando sea seguro
```

## Rate limit

Definir explícitamente si la operación es fail-open o fail-closed.

## Idempotencia

No ignorar silenciosamente un fallo Redis en operaciones críticas.

Conservar restricciones de DB como última protección.

Registrar y medir el incidente.

---

# 63. Evitar cache stampede

Para claves extremadamente solicitadas:

- TTL con jitter;
- request coalescing si es necesario;
- locks cortos solamente para recomputaciones costosas;
- stale-while-revalidate solo si realmente se requiere.

No agregar locks distribuidos a cada lectura.

---

# 64. Rendimiento GraphQL

Obligatorio:

- paginación;
- límites máximos;
- DataLoader/BatchMapping;
- evitar N+1;
- seleccionar solamente lo requerido;
- medir consultas SQL;
- no cargar colecciones gigantes automáticamente.

Considerar protección de profundidad/complejidad antes de exposición pública a escala.

---

# 65. Convenciones de código Java

Preferir:

```text
constructor injection
final cuando corresponda
DTOs claros
records para DTOs inmutables cuando sean apropiados
interfaces solamente cuando aporten desacoplamiento real
```

Evitar field injection:

```java
@Autowired
private Service service;
```

Preferir constructor.

---

# 66. Reglas para agentes

Antes de modificar archivos:

1. leer `AGENTS.md`;
2. leer archivos relacionados;
3. revisar `pom.xml` o `package.json`;
4. entender implementación existente;
5. buscar tests relacionados;
6. hacer el cambio mínimo correcto.

No reescribir módulos completos cuando un cambio localizado sea suficiente.

---

# 67. Regla anti-sobreingeniería

No agregar automáticamente:

- Kubernetes;
- Kafka;
- RabbitMQ;
- Elasticsearch;
- múltiples microservicios;
- service mesh;
- event sourcing;
- CQRS;
- múltiples bases de datos.

Solo agregarlos cuando exista una necesidad comprobada o una instrucción explícita.

La primera arquitectura debe poder ejecutarse razonablemente mediante Docker Compose.

---

# 68. Cambios de dependencias

Antes de añadir una dependencia:

1. comprobar si ya existe solución dentro del stack;
2. justificar su necesidad;
3. comprobar compatibilidad;
4. utilizar versión administrada por Spring Boot cuando corresponda;
5. ejecutar pruebas.

No actualizar todas las dependencias al mismo tiempo durante una tarea no relacionada.

---

# 69. No romper estructura existente

No eliminar:

```text
TestcontainersConfiguration.java
compose.yaml
mvnw
mvnw.cmd
```

sin una razón técnica comprobada.

No renombrar masivamente paquetes en una tarea distinta.

---

# 70. Comandos backend

Desde:

```text
C:\Braian\redsena\backend\demo
```

Windows:

```powershell
.\mvnw.cmd test
```

Linux/macOS:

```bash
./mvnw test
```

Antes de marcar una tarea backend como terminada:

```text
compile
tests relevantes
tests completos cuando sea razonable
```

---

# 71. Comandos frontend

Desde:

```text
C:\Braian\redsena\frontend\redsena
```

Instalación reproducible:

```bash
npm ci
```

Desarrollo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Tests una vez incorporados:

```bash
npm test
```

o los scripts realmente definidos en `package.json`.

El agente debe inspeccionar `package.json` antes de asumir nombres de scripts.

---

# 72. Docker validation

Antes de dar por correcta una modificación de Compose:

```bash
docker compose config
```

Cuando corresponda:

```bash
docker compose build
docker compose up -d
docker compose ps
```

Comprobar health checks.

---

# 73. Definition of Done

Una tarea se considera terminada solamente cuando:

- implementación realizada;
- compilación correcta;
- tests existentes continúan pasando;
- tests nuevos agregados cuando corresponda;
- no existen secretos;
- no existen archivos temporales innecesarios;
- no existen logs debug accidentales;
- migraciones son reproducibles;
- Compose sigue siendo válido si fue modificado;
- caché se invalida correctamente si la tarea modifica datos cacheados;
- idempotencia fue analizada para mutaciones;
- concurrencia fue analizada;
- GraphQL no introduce N+1 evidente;
- uploads persisten correctamente si fueron modificados;
- documentación relevante fue actualizada.

---

# 74. Política de Git

Los agentes pueden inspeccionar:

```bash
git status
git diff
git diff --staged
git log
```

No ejecutar automáticamente:

```bash
git commit
git push
git reset --hard
git clean -fd
git rebase
```

salvo instrucción explícita.

Nunca eliminar trabajo del usuario para dejar el repositorio limpio.

---

# 75. Política de cambios

Al encontrar cambios previos del usuario:

- conservarlos;
- no revertirlos;
- modificar únicamente lo relacionado con la tarea;
- revisar el diff final.

Si existe un conflicto conceptual entre código existente y este documento, preferir:

1. requerimiento explícito actual del usuario;
2. `AGENTS.md`;
3. arquitectura ya implementada;
4. mejora propuesta por el agente.

---

# 76. Arquitectura objetivo del Compose

Objetivo progresivo:

```yaml
services:

  postgres:
    # PostgreSQL
    # volumen persistente
    # healthcheck

  redis:
    # Redis
    # healthcheck

  backend:
    # Spring Boot
    # depende de postgres y redis saludables

  frontend:
    # React compilado y servido de forma estática

  media:
    # Nginx/static server
    # volumen uploads read-only

  nginx:
    # reverse proxy
    # único punto público principal

volumes:
  postgres_data:
  redsena_uploads:

networks:
  redsena_network:
```

No copiar este fragmento ciegamente.

El agente debe adaptarlo al `compose.yaml` real existente.

---

# 77. Flujo final esperado de una publicación

```text
React
  │
  ├─ POST /api/uploads
  │      │
  │      ▼
  │   MediaStorage
  │      │
  │      ▼
  │   uploads volume
  │
  └─ GraphQL createPost
          │
          ├─ autenticación
          ├─ validación
          ├─ idempotencia Redis
          ├─ transacción PostgreSQL
          ├─ asociación media
          ├─ commit
          ├─ invalidación cache
          ├─ métricas
          └─ log estructurado
```

---

# 78. Flujo final esperado de un like

```text
React
   │
   ▼
setPostLike(postId, true)
   │
   ▼
Spring Security
   │
   ▼
PostLikeService
   │
   ├─ INSERT/UPSERT protegido por UNIQUE
   │
   ├─ commit
   │
   ├─ invalidar contador Redis
   │
   ├─ métrica
   │
   └─ respuesta
```

Repetir:

```text
setPostLike(postId, true)
```

no debe generar dos likes.

---

# 79. Flujo final esperado del feed

```text
GraphQL feed(first, after)
       │
       ▼
FeedService
       │
       ├─ Redis cache?
       │      │
       │      ├─ HIT → IDs
       │      │
       │      └─ MISS
       │           ▼
       │       PostgreSQL
       │       keyset pagination
       │
       ▼
Batch loading
       │
       ├─ authors
       ├─ counts
       └─ viewer state
       │
       ▼
GraphQL response
```

---

# 80. Principio principal

La prioridad de RedSENA es:

```text
Correctitud
    ↓
Seguridad
    ↓
Mantenibilidad
    ↓
Observabilidad
    ↓
Rendimiento medido
    ↓
Escalabilidad
```

No sacrificar integridad de datos para optimizaciones prematuras.

Optimizar después de medir.

PostgreSQL conserva la verdad.

Redis acelera y coordina operaciones efímeras.

GraphQL define la interfaz de datos.

Docker Compose hace reproducible la infraestructura.

Tests garantizan que los cambios no rompan los flujos principales.

Logs, métricas y health checks permiten saber qué ocurre cuando algo falla.

---

# 81. Regla final para cualquier agente

Antes de finalizar una tarea, el agente debe preguntarse internamente:

```text
¿Compila?
¿Pasaron los tests?
¿Introduje N+1?
¿La mutación es segura ante reintentos?
¿Existe riesgo de duplicados?
¿Invalidé la caché correcta?
¿Estoy tratando Redis como fuente de verdad?
¿Los archivos sobreviven a recrear contenedores?
¿Los secretos están fuera del repositorio?
¿Los logs permiten diagnosticar el problema?
¿Compose sigue funcionando?
¿El cambio es más complejo de lo necesario?
```

Si alguna respuesta relevante es negativa, la tarea todavía no está terminada.
