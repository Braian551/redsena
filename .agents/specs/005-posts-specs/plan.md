# Plan SPEC-005 — Feed vivo sin recarga

Estado: COMPLETED

## P1 — Investigación y contrato

1. Comparar revalidación HTTP, SSE y polling según el stack actual.
2. Documentar la decisión y el límite de no introducir WebSocket/SSE aún.
3. Definir `feedVersion` como contrato GraphQL ligero.

Requisitos: RF-FEED-005-001, RF-FEED-005-003, RNF-FEED-005-004.

## P2 — Versión y caché backend

1. Obtener la publicación más reciente mediante una consulta derivada indexada.
2. Cachear la versión global en Redis con TTL de 5 segundos.
3. Invalidar versión y feed después del commit de las escrituras existentes.
4. Añadir la query GraphQL y una prueba de cambio de versión.

Requisitos: RF-FEED-005-001/003, RNF-FEED-005-001/002/003.

## P3 — Polling frontend

1. Añadir caché de primera página en memoria durante 10 segundos.
2. Consultar primero `feedVersion` y descargar posts solo si cambia.
3. Ejecutar un ciclo cada 15 segundos, sin solicitudes solapadas.
4. Pausar/reanudar con `visibilitychange`, limpiar timer y conservar estados de error.

Requisitos: RF-FEED-005-002/004/005, RNF-FEED-005-004.

## P4 — Verificación

1. Ejecutar tests backend existentes y el nuevo test GraphQL.
2. Ejecutar lint y build frontend, dado que no hay Vitest/RTL declarado.
3. Ejecutar `git diff --check` y Compose config con el entorno disponible.

Requisitos: CA-001..CA-005.

## P5 — Despliegue

1. Sincronizar solo fuentes RedSENA y no secretos.
2. Ejecutar el módulo `/opt/redsena-prod` con build/migraciones/health checks.
3. Verificar `redsena.online`, `www.redsena.online` y la salud de `angelow.online`.

Requisitos: CA-006, RNF-FEED-005-002/004.

## Decisión de evolución

SSE/WebSocket se mantiene como opción posterior. Si se adopta, el canal deberá resolver autorización Bearer, reconexión, límites de conexiones, heartbeats, publicación de eventos y despliegue Nginx antes de sustituir este polling.

## Resultado

Plan ejecutado y desplegado en `redsena.online`. La actualización del feed funciona sin recargar la página, con polling adaptativo, caché por capas e invalidación post-commit.
