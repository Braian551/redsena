# Plan de implementación

1. Resolver rol administrativo en `security` con configuración de servidor.
2. Extraer el borrado común de posts a un caso de uso transaccional que coordine JPA, caché y `MediaStorage`.
3. Exponer la lectura y eliminación administrativas mediante un schema GraphQL separado.
4. Crear el adapter GraphQL y la pantalla Tailwind en `features/admin`.
5. Validar autorización, paginación, limpieza de media, build frontend, Compose y despliegue.
