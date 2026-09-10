# Plan SPEC-003 — Gestión de publicaciones

Estado: COMPLETED

## P1 — Contrato y política de autorización

1. Confirmar el schema y los errores estables.
2. Crear `PostAction` y la Strategy de autorización para propietario/no propietario.
3. Cubrir la selección y las decisiones negativas con test unitario.

Requisitos: RF-POST-003-001, RF-POST-003-002, RF-POST-003-004, RF-POST-003-006, RNF-POST-003-001, RNF-POST-003-005.

## P2 — Escrituras de publicación

1. Añadir `UpdatePostInput` y la mutación `updatePost`.
2. Reusar el flujo de `deletePost` con la Strategy, sin cambiar su contrato.
3. Validar contenido y ejecutar invalidación de caché después del commit.

Requisitos: RF-POST-003-001 a RF-POST-003-004, RNF-POST-003-003.

## P3 — Reportes y persistencia

1. Añadir migración Flyway nueva para `post_reports`.
2. Crear entidad, repositorio, servicio y DTO GraphQL con motivos enumerados.
3. Rechazar autor, publicación inexistente y reporte repetido sin usar idempotencia.

Requisitos: RF-POST-003-005, RF-POST-003-006, RNF-POST-003-002, RNF-POST-003-004.

## P4 — Verificación backend

1. Ejecutar pruebas unitarias de la Strategy.
2. Añadir pruebas GraphQL de editar, autorización, eliminar, reportar y duplicado.
3. Ejecutar `mvnw test` y corregir únicamente fallos relacionados.

Requisitos: RF-POST-003-001 a RF-POST-003-006, RNF-POST-003-001/002.

## P5 — Interfaz y fallback local

1. Añadir controles accesibles en la tarjeta según autoría.
2. Conectar edición, eliminación y reporte al adaptador GraphQL.
3. Mantener la experiencia de demo local con `localStorage`, sin headers de idempotencia en estas acciones.

Requisitos: RF-POST-003-007.

## P6 — Calidad y despliegue

1. Ejecutar lint/build frontend.
2. Ejecutar `docker compose config` del módulo de despliegue.
3. Construir y publicar imágenes en el stack aislado `/opt/redsena-prod`.
4. Verificar health `200`, dominio `redsena.online` y no afectación de `angelow.online`.

Requisitos: RNF-POST-003-003/004, CA-008.

## Riesgos y mitigaciones

- El borrado físico depende de los `ON DELETE CASCADE` ya versionados; la integración verifica que la publicación desaparece sin dejar asociaciones bloqueando la transacción.
- La unicidad de reportes se refuerza en aplicación para UX y en PostgreSQL para concurrencia.
- No se mezclan los cambios de este slice con la idempotencia existente de creación/comentarios/uploads.
