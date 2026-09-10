# Spec 006 — Publicaciones responsive sin desbordamiento

**Estado:** implementado y desplegado; verificación autenticada visual pendiente
**Orden SDD:** spec → plan → task → implementación → verificación

## 1. Problema y objetivo

En pantallas angostas, una publicación puede desbordar horizontalmente cuando contiene una URL, palabra o cadena sin espacios. Las imágenes tampoco tienen un marco estable, por lo que publicaciones con medios de tamaños distintos rompen la lectura y hacen que la tarjeta cambie de proporción de forma impredecible.

El objetivo es que el feed conserve una composición estable desde 320 px hasta escritorio: cada tarjeta ocupa únicamente el ancho disponible, el texto siempre puede envolverse, los medios se organizan en una grilla responsive con proporción fija y los controles no fuerzan scroll horizontal.

## 2. Alcance

### Incluido

- Mantener el feed y cada `PostCard` dentro del ancho disponible (`w-full`, `min-w-0`, `max-w-full`).
- Evitar desbordamiento de texto en publicaciones, comentarios y mensajes de acción, incluso con cadenas largas sin espacios.
- Presentar cada imagen en un marco de proporción fija 4:3, con recorte visual `object-cover` y sin exceder el contenedor.
- Organizar múltiples medios en una columna en móvil y dos columnas desde `sm`, manteniendo espacios consistentes.
- Conservar la jerarquía mobile-first, foco visible, nombres accesibles, edición, likes, comentarios, reportes y estados existentes.
- Validar el build frontend, revisar el contrato Compose y desplegar el bundle mediante el Compose productivo existente.

### Fuera de alcance

- Cambiar el modelo GraphQL, PostgreSQL, Redis, paginación o almacenamiento de media.
- Recortar ni truncar el texto de la publicación; el contenido debe seguir siendo legible.
- Añadir un framework CSS, un sistema de componentes o una dependencia de testing no declarada.
- Cambiar el diseño de autenticación, perfil o dashboard salvo por el ancho compartido que ya controla el layout.
- E2E autenticado con Playwright: la herramienta no está declarada en `package.json` y requiere credenciales Firebase reales.

## 3. Actores

| Actor | Necesidad |
|---|---|
| Miembro autenticado | Leer, publicar e interactuar sin zoom ni scroll horizontal accidental. |
| Navegador móvil/escritorio | Reflow estable en anchos pequeños y grandes. |
| Operador | Construir y desplegar el frontend sin alterar PostgreSQL, Redis ni uploads. |

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---:|
| RF-RESP-006-001 | El feed y cada publicación deben ocupar como máximo el ancho disponible y no producir overflow horizontal en el viewport soportado desde 320 px. | Alta |
| RF-RESP-006-002 | El contenido textual de una publicación, comentario o aviso debe envolver cadenas largas sin ocultar ni escapar del viewport. | Alta |
| RF-RESP-006-003 | Cada imagen adjunta debe renderizarse dentro de una caja 4:3, con ancho completo, altura estable y recorte `object-cover`. | Alta |
| RF-RESP-006-004 | Hasta un medio debe ocupar una columna; dos o más medios deben pasar a dos columnas desde el breakpoint `sm`, sin columnas con ancho menor que cero. | Alta |
| RF-RESP-006-005 | Las acciones, formularios, menús y estados de error de la publicación deben seguir siendo utilizables y visibles en móvil. | Alta |

## 5. Requisitos no funcionales

| ID | Requisito verificable | Criterio |
|---|---|---|
| RNF-RESP-006-001 | La solución debe reutilizar Tailwind/CSS existente. | No se agregan dependencias ni estilos globales que oculten errores con `overflow-x: hidden`. |
| RNF-RESP-006-002 | La información no debe perderse por una decisión de layout. | El texto mantiene altura natural; solo las imágenes usan proporción fija y `object-cover`. |
| RNF-RESP-006-003 | La interfaz mantiene accesibilidad básica. | Se conservan HTML semántico, labels, foco visible, `alt` y estados `role=status/alert`. |
| RNF-RESP-006-004 | El cambio no altera la fuente de datos ni la infraestructura. | `npm run lint`, `npm run build`, Compose válido y servicios productivos healthy. |

## 6. Decisiones técnicas

1. **Contención por tarjeta:** `PostCard` usa `w-full min-w-0 max-w-full overflow-hidden`; el contenedor de medios también usa `min-w-0`.
2. **Corte seguro de texto:** `break-words` se aplica al contenido que puede contener datos arbitrarios. No se usa `truncate` para el cuerpo de la publicación ni para comentarios.
3. **Marco estable para imágenes:** cada media se envuelve en `aspect-[4/3] overflow-hidden`; la imagen ocupa la caja y usa `object-cover`.
4. **Responsive sin duplicar markup:** la grilla cambia de una columna a `sm:grid-cols-2`; el orden del contenido se mantiene en móvil.
5. **Sin parche global:** no se oculta el overflow del `body`, porque eso podría ocultar regresiones y no resolvería el elemento causante.

## 7. Criterios de aceptación

### Layout y texto

```gherkin
Dado un viewport de 320 px
Cuando el feed muestra una publicación con una URL o palabra de más de 100 caracteres
Entonces el texto se envuelve dentro de la tarjeta
Y no aparece scroll horizontal causado por la publicación

Dado que una publicación tiene comentarios o un aviso largo
Cuando se renderiza la tarjeta
Entonces cada texto permanece dentro del ancho de su bloque
Y el contenido no queda cortado por un truncamiento visual
```

### Media y organización

```gherkin
Dado que una publicación tiene una imagen
Cuando se renderiza en móvil o escritorio
Entonces la imagen ocupa una caja 4:3 dentro de la tarjeta
Y conserva object-cover sin exceder el ancho disponible

Dado que una publicación tiene dos o más imágenes
Cuando el viewport alcanza el breakpoint sm
Entonces los medios se organizan en dos columnas iguales
Y en móvil vuelven a una columna sin desbordarse
```

### Interacción y entrega

```gherkin
Dado un viewport móvil
Cuando el usuario abre comentarios, edita, reporta o publica
Entonces los botones, campos y mensajes siguen siendo alcanzables y visibles

Dado el Compose productivo configurado
Cuando se ejecuta el script de despliegue
Entonces solo se actualiza el proyecto redsena-prod
Y los servicios mantienen healthy, los volúmenes no se eliminan y /health responde UP
```

## 8. Trazabilidad

| Requisito | Evidencia | Estado |
|---|---|---|
| RF-RESP-006-001 | `FeedPage.jsx`, `PostCard.jsx` | Implementado |
| RF-RESP-006-002 | `PostCard.jsx` y `PostComposer.jsx` | Implementado |
| RF-RESP-006-003 a RF-RESP-006-004 | Marco 4:3 y grilla de media en `PostCard.jsx` | Implementado |
| RF-RESP-006-005 | Acciones y formularios existentes con wrap/contención | Implementado |
| RNF-RESP-006-001 a RNF-RESP-006-003 | Tailwind existente y HTML de features | Implementado |
| RNF-RESP-006-004 | Lint/build, Compose y deploy productivo | Implementado |

## 9. Verificación

| Comprobación | Resultado |
|---|---|
| `npm run lint` | Correcto |
| `npm run build` | Correcto |
| `docker compose -f compose.yaml config --quiet` | Correcto |
| `docker compose -f deploy/docker-compose.prod.yml config --quiet` | Correcto con configuración temporal; sin secretos en el repositorio |
| `bash scripts/deploy.sh` en la VPS | Correcto; seis servicios healthy |
| Smoke público | `/` HTTP 200 y `/health` HTTP 200 con `status: UP` |
| E2E autenticado | Pendiente por ausencia de Playwright/credenciales reales |

## 10. Definition of Done

- [x] Existe spec, plan y task con requisitos trazables.
- [x] El feed y las tarjetas tienen contención responsive.
- [x] Cadenas largas no producen desbordamiento horizontal.
- [x] Las imágenes tienen marco 4:3 y grilla responsive.
- [x] Lint, build y Compose pasan.
- [x] El frontend fue desplegado mediante `redsena-prod`.
- [ ] Falta la comprobación visual autenticada con datos reales de publicaciones en un navegador móvil.
