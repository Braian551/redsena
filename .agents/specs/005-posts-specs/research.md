# Investigación SPEC-005 — Actualizaciones de feeds sociales

## Hallazgos

1. La revalidación HTTP con `ETag`/`If-None-Match` permite que un cliente valide una representación ya almacenada y reciba `304 Not Modified` cuando no cambió. Reduce el cuerpo transferido, pero requiere una representación HTTP cacheable; el feed de RedSENA hoy es GraphQL autenticado por `POST`.
2. SSE mantiene una conexión unidireccional y permite que el servidor empuje eventos al navegador mediante `EventSource`. Spring MVC ofrece `SseEmitter`, pero el canal requiere resolver autenticación, reconexión, heartbeats, límites y publicación de eventos.
3. Polling con una consulta ligera de versión es un punto intermedio operativo: no requiere conexiones persistentes ni dependencias nuevas y permite que Redis cachee el marcador mientras PostgreSQL conserva la verdad.

## Decisión para RedSENA

Se implementa polling adaptativo:

```text
FeedPage
  ├─ cada 15 s: query feedVersion
  │    ├─ igual: conservar estado actual
  │    └─ cambia: query feed(first: 20) y reemplazar primera página
  └─ pestaña oculta: pausar; visible: reanudar
```

Capas de caché:

- Redis `feed-version`: 5 s.
- Redis `feed`: 30 s, ya existente.
- Memoria del cliente: 10 s por usuario.
- PostgreSQL: fuente de verdad.

SSE/WebSocket queda para una fase posterior, cuando se requiera latencia inferior al intervalo de polling y exista una política clara para conexiones persistentes.

## Fuentes

- [MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN — ETag header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)
- [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Spring Framework — SseEmitter](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html)
