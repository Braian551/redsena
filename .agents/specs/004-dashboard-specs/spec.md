# Spec 004 — Dashboard administrativo

## Objetivo

Permitir que las cuentas autorizadas administren publicaciones desde una pantalla React/Tailwind conectada al backend GraphQL, sin confiar en el correo enviado por el navegador.

## Alcance implementado

- Rol backend `ADMIN`, resuelto por `ADMIN_EMAILS` y compatible con autoridad/claims administrativos.
- Consulta `adminPosts(first, after)` con cursor keyset, límite servidor y carga batch de autores, media y contadores.
- Mutación `adminDeletePost(id)` protegida por autorización de aplicación.
- Eliminación transaccional de post y asociaciones JPA; limpieza de archivos `MediaStorage` después del commit.
- Pestaña Administración responsive, con confirmación explícita, estados de carga/error/vacío y botón de siguiente página.

## Fuera de alcance

Gestión administrativa de usuarios, seguimiento, resolución de reportes y métricas globales. Se mantienen como evoluciones posteriores.

## Criterios verificables

1. Un usuario regular recibe `FORBIDDEN` al consultar o mutar operaciones administrativas.
2. Un administrador puede consultar una página acotada y su `endCursor` permite cargar la siguiente.
3. La eliminación no depende de `userId` del cliente y elimina también los registros `post_media` y los archivos asociados.
4. PostgreSQL continúa siendo la fuente de verdad; Redis solo participa en las invalidaciones de caché.
5. La pantalla no muestra el acceso administrativo a usuarios sin `me.role = ADMIN`.
