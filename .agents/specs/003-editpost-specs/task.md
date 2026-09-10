# Tareas SPEC-003 — Gestión de publicaciones

Estado: COMPLETED

- [x] T003-01 — Definir contrato GraphQL, motivos/estado de reporte y códigos de error. Requisitos: RF-POST-003-001..006.
- [x] T003-02 — Implementar Strategy GoF de autorización y sus pruebas unitarias. Requisitos: RNF-POST-003-001, RNF-POST-003-005.
- [x] T003-03 — Implementar edición de contenido con validación, transacción e invalidación post-commit. Requisitos: RF-POST-003-001/002, RNF-POST-003-003.
- [x] T003-04 — Mantener eliminación propia y centralizar su autorización mediante Strategy. Requisitos: RF-POST-003-003/004.
- [x] T003-05 — Crear migración `post_reports`, entidad, repositorio y servicio de reporte sin idempotencia. Requisitos: RF-POST-003-005/006, RNF-POST-003-002/004.
- [x] T003-06 — Añadir pruebas GraphQL de éxito y rechazo, incluyendo persistencia de reportes. Requisitos: CA-001..CA-006.
- [x] T003-07 — Conectar controles React accesibles para editar, eliminar y reportar. Requisitos: RF-POST-003-007.
- [x] T003-08 — Mantener fallback `localStorage` para la demo sin introducir `Idempotency-Key` en las nuevas acciones. Requisitos: RF-POST-003-007, límite de alcance.
- [x] T003-09 — Ejecutar gates backend/frontend/Compose, desplegar en el stack RedSENA y verificar HTTP 200. Requisitos: RNF-POST-003-003/004, CA-008.

Fuera de alcance: edición de multimedia, panel de moderación, resolución de reportes, notificaciones, soft-delete e idempotencia para las tres nuevas mutaciones.
