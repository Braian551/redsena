# SPEC-003 — Gestión de publicaciones: editar, eliminar y reportar

Estado: COMPLETED

## Problema

RedSENA ya permite crear, consultar, dar like y comentar publicaciones. Falta un control de ciclo de vida que permita a la persona autora corregir o retirar su contenido y que permita a otra persona alertar sobre contenido problemático. Las reglas deben aplicarse en el backend usando la identidad autenticada, no datos enviados por el cliente.

## Actores

- Autor autenticado: puede editar y eliminar sus propias publicaciones.
- Miembro autenticado no autor: puede reportar una publicación de otra persona.
- Backend: valida identidad, reglas de autorización, persistencia y errores GraphQL.

## Alcance

Incluye:

- Mutación GraphQL `updatePost` para editar únicamente el texto de una publicación propia.
- Mutación GraphQL `deletePost` con autorización de propietario.
- Mutación GraphQL `reportPost` para reportar una publicación ajena con un motivo controlado.
- Persistencia PostgreSQL de reportes y protección de un reporte por usuario/publicación.
- Invalidación de caché después de confirmar edición o eliminación.
- Interfaz React para editar, eliminar y reportar desde el menú de una tarjeta.
- Pruebas unitarias de la autorización Strategy y pruebas GraphQL de los flujos principales.

No incluye:

- Edición o reemplazo de imágenes asociadas.
- Panel de moderación, revisión o resolución de reportes.
- Moderación automática, notificaciones o apelaciones.
- Idempotencia para `updatePost`, `deletePost` o `reportPost`: estas mutaciones no aceptan ni generan `Idempotency-Key` y no usan Redis para repetir resultados.

## Requisitos funcionales

### RF-POST-003-001 — Editar publicación propia

Una persona autenticada puede editar el contenido de una publicación cuando es su autora. El texto se recorta, no puede quedar vacío y conserva el límite de 500 caracteres. La mutación devuelve la publicación actualizada con sus relaciones normales.

### RF-POST-003-002 — Impedir edición ajena

Una persona autenticada que no es autora recibe el error estable `FORBIDDEN`; no se modifica la publicación.

### RF-POST-003-003 — Eliminar publicación propia

Una persona autenticada puede eliminar su propia publicación. La eliminación elimina la entidad de publicación y sus asociaciones dependientes según las claves foráneas existentes. La mutación devuelve `true` y la publicación deja de aparecer en consultas posteriores.

### RF-POST-003-004 — Impedir eliminación ajena

Una persona autenticada que no es autora recibe `FORBIDDEN` y la publicación permanece disponible.

### RF-POST-003-005 — Reportar publicación ajena

Una persona autenticada que no es autora puede reportar una publicación usando uno de estos motivos: `SPAM`, `HARASSMENT`, `HATE_SPEECH`, `VIOLENCE`, `SEXUAL_CONTENT`, `MISINFORMATION` u `OTHER`. La mutación devuelve el reporte creado con `OPEN`.

### RF-POST-003-006 — Impedir auto-reporte y reportes repetidos

La autora no puede reportar su propia publicación y recibe `POST_REPORT_OWN_POST`. Un mismo usuario no puede registrar dos reportes para la misma publicación y recibe `POST_ALREADY_REPORTED`. Esta protección es una regla de integridad de dominio, no una implementación de idempotencia.

### RF-POST-003-007 — Estados visibles en interfaz

La tarjeta muestra Editar y Eliminar al autor, Reportar a otros miembros y estados de carga, confirmación y error sin recargar la página. Editar conserva las imágenes; eliminar retira la tarjeta; reportar confirma el registro.

## Requisitos no funcionales

### RNF-POST-003-001 — Identidad y autorización

El usuario efectivo se obtiene de `SecurityContext`/Firebase validado por Spring Security. Nunca se confía en un `userId` enviado por React para decidir permisos.

### RNF-POST-003-002 — Consistencia

La operación de escritura y sus validaciones se ejecutan en transacción. PostgreSQL es la fuente de verdad y la unicidad `(post_id, reporter_id)` se protege con una restricción persistente.

### RNF-POST-003-003 — Caché

Editar y eliminar invalidan las vistas de publicación/feed después del commit. Un fallo o reinicio de Redis no sustituye la persistencia de PostgreSQL.

### RNF-POST-003-004 — Compatibilidad operativa

El cambio mantiene Spring Boot/Java, GraphQL, React/Vite, el monolito modular y la migración Flyway existente sin modificar migraciones ya aplicadas.

### RNF-POST-003-005 — GoF con propósito

La autorización se implementa mediante Strategy: una estrategia de propietario para `UPDATE`/`DELETE` y otra de no propietario para `REPORT`. El selector centraliza la política sin duplicar condiciones en cada caso de uso.

## Contrato GraphQL

```graphql
updatePost(id: ID!, input: UpdatePostInput!): Post!
deletePost(id: ID!): Boolean!
reportPost(input: ReportPostInput!): PostReport!
```

`UpdatePostInput` contiene únicamente `content`. `ReportPostInput` contiene `postId` y `reason`.

## Criterios de aceptación

- CA-001: el autor edita texto válido y el nuevo contenido se persiste y aparece en `post`/`feed`.
- CA-002: texto vacío o de más de 500 caracteres devuelve un código de validación y no escribe.
- CA-003: un no autor no puede editar ni eliminar y recibe `FORBIDDEN`.
- CA-004: el autor elimina, recibe `true`, y `post(id)` devuelve `null` después de la operación.
- CA-005: un no autor reporta con un motivo permitido y recibe un reporte `OPEN` persistido.
- CA-006: el autor no puede auto-reportar y un segundo reporte del mismo usuario/publicación es rechazado.
- CA-007: el cliente muestra controles según autoría y mantiene estados de carga/error/confirmación.
- CA-008: pasan los tests backend relevantes, `npm run lint`, `npm run build`, `docker compose config` y el smoke test HTTP del despliegue.

## Decisiones y riesgos

- Se conserva el borrado físico actual porque las tablas dependientes ya usan `ON DELETE CASCADE`; agregar soft-delete ampliaría el contrato de todas las consultas y mutaciones sin ser necesario para este slice.
- Los reportes se almacenan con estado `OPEN`, dejando la resolución para una futura capacidad de moderación.
- El contrato no recibe `Idempotency-Key`; repetir una acción de reportar produce un conflicto de dominio explícito, no una reproducción silenciosa.
- La seguridad de producción sigue dependiendo de que `FIREBASE_PROJECT_ID` y la validación JWT estén configurados en el entorno desplegado.

## Trazabilidad

| Requisito | Plan | Implementación / prueba |
|---|---|---|
| RF-POST-003-001/002 | P1, P2, P4 | `PostWriteService`, Strategy, GraphQL integration |
| RF-POST-003-003/004 | P2, P4 | `PostWriteService`, GraphQL integration |
| RF-POST-003-005/006 | P3, P4 | `PostReportService`, Flyway, GraphQL integration |
| RF-POST-003-007 | P5 | `PostCard`, `FeedPage`, repository fallback |
| RNF-POST-003-001/005 | P1, P2 | `PostActionAuthorizer` y sus estrategias |
| RNF-POST-003-002/003/004 | P2, P3, P6 | Flyway, caché post-commit, gates de build/deploy |
