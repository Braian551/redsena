# Tareas SPEC-005 — Feed vivo sin recarga

Estado: COMPLETED

- [x] T005-01 — Investigar ETag, SSE y polling, y documentar la decisión compatible con GraphQL/MVC. Requisitos: RF-FEED-005-001/003, RNF-FEED-005-004.
- [x] T005-02 — Implementar `feedVersion`, TTL Redis e invalidación post-commit. Requisitos: RF-FEED-005-001/003, RNF-FEED-005-001/002/003.
- [x] T005-03 — Implementar caché en memoria y polling visible en `FeedPage`. Requisitos: RF-FEED-005-002/004/005, RNF-FEED-005-004.
- [x] T005-04 — Añadir prueba GraphQL de cambio de versión y ejecutar gates declarados. Requisitos: CA-001..CA-005.
- [x] T005-05 — Construir, desplegar y verificar dominio/health sin afectar Angelow. Requisitos: CA-006.

Fuera de alcance: SSE, WebSocket, GraphQL subscriptions, fan-out, ranking, ETag para GraphQL POST y persistencia de caché del navegador entre sesiones.
