# SPEC-005 — Feed vivo sin recargar la página

Estado: COMPLETED

## Problema

El feed actual se consulta al entrar al dashboard y las nuevas publicaciones de otras sesiones no aparecen hasta que la persona recarga o navega nuevamente. RedSENA necesita una actualización automática que conserve el estado de la página, minimice transferencia y no introduzca infraestructura distribuida innecesaria.

## Investigación aplicada

Se evaluaron tres patrones:

- `ETag`/`If-None-Match`: HTTP permite revalidar una representación y devolver `304 Not Modified` sin retransmitir el cuerpo cuando no cambió ([MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), [MDN: ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)). Es ideal para recursos GET cacheables; el feed actual es una operación GraphQL POST autenticada.
- SSE: `EventSource` permite que el servidor envíe eventos unidireccionales al navegador sin que este consulte continuamente ([MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)); Spring MVC lo soporta mediante `SseEmitter` ([Spring Framework SseEmitter](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html)). Requeriría un canal nuevo, gestión de conexiones, reconexión, autorización Bearer y publicación de eventos.
- Polling adaptativo: el cliente consulta una versión ligera y solo descarga el feed completo cuando esa versión cambia. Es compatible con el GraphQL existente, funciona detrás del Nginx actual y permite pausar en pestañas ocultas.

### Decisión

Para este corte se implementa polling adaptativo con `feedVersion`, caché Redis de 5 segundos para la versión, caché-aside del feed existente de 30 segundos y caché en memoria del cliente de 10 segundos. SSE/WebSocket queda como evolución cuando el volumen y la necesidad de latencia justifiquen conexiones persistentes.

## Actores

- Miembro autenticado viendo el feed.
- Backend RedSENA que publica la versión y el feed desde PostgreSQL con Redis como acelerador.
- Navegador que conserva la página y actualiza solo el estado React.

## Alcance

Incluye:

- Query GraphQL `feedVersion: String!` basada en la publicación más reciente.
- Invalidación de `feed-version` después de crear, editar o eliminar una publicación.
- Polling del cliente cada 15 segundos mientras la pestaña está visible.
- Pausa del polling cuando `document.visibilityState` es `hidden` y reanudación al volver.
- Descarga del feed completo únicamente cuando cambia la versión.
- Estados visibles de actualización y error recuperable sin recargar la página.

No incluye:

- SSE, WebSocket, GraphQL subscriptions o broker de eventos.
- Fan-out por seguidores, feed personalizado o ranking.
- Persistencia de caché en el navegador entre sesiones.
- ETag HTTP para GraphQL POST.

## Requisitos funcionales

### RF-FEED-005-001 — Detectar nuevas publicaciones

El cliente consulta `feedVersion` y detecta un cambio respecto de la versión local. La versión combina fecha/hora e identificador de la publicación más reciente.

### RF-FEED-005-002 — Actualizar sin recarga

Cuando la versión cambia, el cliente vuelve a consultar la primera página, incorpora la nueva respuesta al estado React y la muestra sin `window.location.reload`, navegación ni pérdida del formulario visible.

### RF-FEED-005-003 — Reducir transferencia

Si la versión no cambia, el cliente no descarga los nodos del feed. El backend sirve la versión desde Redis durante su TTL y usa PostgreSQL como fuente de verdad ante miss.

### RF-FEED-005-004 — Ciclo de vida de polling

El polling se ejecuta cada 15 segundos con una sola solicitud en vuelo, se pausa con la pestaña oculta, reanuda al recuperar visibilidad y se limpia al desmontar el componente.

### RF-FEED-005-005 — Fallos recuperables

Un fallo de actualización posterior a la carga inicial muestra un aviso no bloqueante y conserva el feed actual; los siguientes ciclos continúan intentando. Un fallo inicial muestra error de carga sin recargar el sitio.

## Requisitos no funcionales

### RNF-FEED-005-001 — Consistencia

PostgreSQL continúa siendo la fuente de verdad. Redis y la caché de memoria solo aceleran lecturas y nunca se usan para confirmar que una publicación existe.

### RNF-FEED-005-002 — Caché e invalidación

La caché `feed-version` usa TTL de 5 segundos. Las escrituras invalidan versión y feed después del commit; el feed de posts mantiene TTL de 30 segundos.

### RNF-FEED-005-003 — Seguridad

`feedVersion` y `feed` se ejecutan con la identidad Bearer actual. El caché de contenido del feed continúa separado por viewer cuando corresponde.

### RNF-FEED-005-004 — Rendimiento y UX

No se añaden dependencias mayores ni un canal persistente antes de necesitarlo. La pestaña oculta no mantiene tráfico de polling y la UI informa cuándo busca novedades.

## Contrato GraphQL

```graphql
type Query {
  feedVersion: String!
  feed(first: Int = 20, after: String): PostConnection!
}
```

## Criterios de aceptación

- CA-001: después de crear una publicación en otra sesión, el feed visible la muestra en el siguiente ciclo sin recargar la página.
- CA-002: con la misma `feedVersion`, solo se consulta la versión y no se reemplazan los nodos del feed.
- CA-003: crear/editar/eliminar invalida la versión cacheada y una consulta posterior refleja el estado actual.
- CA-004: la pestaña oculta no programa solicitudes repetidas y al volver a visible reanuda la consulta.
- CA-005: un error de polling conserva el contenido existente y muestra un estado recuperable.
- CA-006: backend, frontend, Compose y smoke test del dominio pasan antes del despliegue.

## Trazabilidad

| Requisito | Plan | Implementación / prueba |
|---|---|---|
| RF-FEED-005-001/002 | P2, P3 | `feedVersion`, `FeedPage`, integración GraphQL |
| RF-FEED-005-003 | P2 | Redis `feed-version`, caché en memoria, integración |
| RF-FEED-005-004/005 | P3, P4 | ciclo de vida React, lint/build |
| RNF-FEED-005-001/002/003 | P2 | `PostService`, `CacheConfig`, `CacheInvalidation` |
| RNF-FEED-005-004 | P3, P5 | UX, Compose, smoke público |

## Validación de entrega

- Backend: `mvnw.cmd test` — 23 pruebas, 0 fallos, 0 errores.
- Frontend: `npm run lint` y `npm run build` — correctos.
- Compose: configuración válida y seis servicios RedSENA saludables.
- Producción: `https://redsena.online/`, `/health` y `https://www.redsena.online/` responden 200.
- Aislamiento: `https://angelow.online/` continúa respondiendo 200.
