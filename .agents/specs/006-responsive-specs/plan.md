# Plan 006 — Publicaciones responsive sin desbordamiento

**Spec:** [spec.md](spec.md)
**Estado:** implementado y desplegado; pendiente de smoke visual autenticado
**Orden SDD:** spec → plan → task → implementación → verificación

## Decisiones

1. **Arreglo en la frontera visual:** el problema es de layout del frontend, no de GraphQL ni de persistencia; el cambio se concentra en `PostCard`, `PostComposer` y `FeedPage`.
2. **Ancho mínimo cero:** los hijos flex/grid deben poder encogerse (`min-w-0`) para que el contenido largo no establezca un ancho intrínseco mayor que la tarjeta.
3. **Corte de texto seguro:** `break-words` permite mostrar contenido arbitrario sin usar truncamiento destructivo ni ocultamiento global del overflow.
4. **Media predecible:** un wrapper `aspect-[4/3]` mantiene la lectura alineada; `object-cover` evita que imágenes verticales u horizontales deformen el layout.
5. **Mobile-first:** una columna en móvil y dos columnas desde `sm`, reutilizando las clases Tailwind ya instaladas.
6. **Prueba proporcional:** el proyecto no declara Vitest, RTL ni Playwright; se ejecutan los scripts frontend existentes y se valida Compose/deploy. La inspección autenticada queda explícitamente pendiente.
7. **Entrega aislada:** se reutiliza `deploy/scripts/deploy.sh`; no se modifican migraciones, volúmenes ni servicios de PostgreSQL/Redis.

## Fases

### Fase 1 — Baseline

- Leer constitución, reglas y skills aplicables.
- Revisar `PostCard`, `PostComposer`, `FeedPage`, tokens CSS, Tailwind y scripts declarados.
- Identificar desbordamiento por texto sin espacios, media sin marco y elementos flex sin `min-w-0`.

### Fase 2 — Implementación frontend

- Contener tarjeta, lista y avisos.
- Agregar wrap seguro al cuerpo de posts/comentarios.
- Crear wrapper de media con proporción fija y grilla responsive.
- Ajustar composer y estados de interacción para anchos estrechos.

### Fase 3 — Verificación

- Ejecutar `npm run lint` y `npm run build`.
- Validar Compose local y productivo sin guardar `.env.production`.
- Revisar diff y búsqueda de dependencias/secretos no solicitados.

### Fase 4 — Despliegue

- Transferir únicamente los archivos frontend relacionados al snapshot remoto de `/opt/redsena-prod`.
- Ejecutar `deploy/scripts/deploy.sh` dentro del proyecto aislado.
- Confirmar seis servicios healthy, volumen de uploads y PostgreSQL intactos, `/`, `/health` y dominio público.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `overflow-hidden` oculta contenido por accidente | Se aplica a la tarjeta y a marcos de imagen; el texto usa wrap y altura natural. |
| Una imagen rompe el grid | Wrapper con `aspect-[4/3]`, `min-w-0` y `object-cover`. |
| Botones se salen en móvil | Se conservan filas flex con `flex-wrap`/stack existente y se añaden límites a avisos. |
| Falso positivo por probar solo el viewport vacío | Se dejan criterios específicos para URL larga, comentarios y múltiples imágenes; smoke autenticado queda como pendiente externo. |
| Despliegue afecta otros proyectos | Compose, red, binding y volúmenes siguen siendo propios de `redsena-prod`; no se usa `down -v` ni prune. |
