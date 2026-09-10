# Constitución de RedSENA

**Versión:** 1.0

**Estado:** vigente para el desarrollo del repositorio

**Alcance:** backend, frontend, pruebas, documentación e infraestructura del monolito RedSENA.

## Preámbulo

RedSENA es una red social pequeña y rápida orientada a publicaciones e interacción entre usuarios. Esta constitución fija los principios que deben guiar la evolución del scaffold actual sin convertirlo prematuramente en una plataforma compleja.

`AGENTS.md` contiene las reglas operativas detalladas. Esta constitución resume los principios de decisión y no habilita por sí sola la incorporación de dependencias, servicios o funcionalidades no solicitadas.

## Artículos

### I. Simplicidad con propósito

Cada cambio debe resolver una necesidad concreta con el menor diseño suficiente. No se crearán capas vacías, abstracciones especulativas, microservicios, colas, Kubernetes, CQRS, event sourcing o nuevas bases de datos sin necesidad comprobada.

La velocidad se busca reduciendo trabajo innecesario, no omitiendo validación, seguridad o integridad de datos.

### II. Monolito modular

La primera arquitectura es un monolito modular Spring Boot. Usuarios, autenticación, publicaciones, comentarios, likes, feed y media se separan por módulos lógicos dentro del backend. La extracción a servicios independientes solo podrá proponerse con evidencia de escala, aislamiento o despliegue que lo justifique.

### III. MVC y límites de responsabilidad

El backend respetará una separación MVC adaptada a la aplicación:

- **Presentación:** GraphQL/REST, DTOs, validación de transporte y mapeo.
- **Aplicación:** casos de uso, coordinación, autorización y transacciones.
- **Dominio:** entidades, value objects, invariantes y reglas.
- **Infraestructura:** JPA, PostgreSQL, Redis, filesystem y adaptadores externos.

Los controladores y resolvers no contendrán reglas de negocio ni consultas repetitivas por elemento.

### IV. React organizado por capacidades

El frontend seguirá con React + Vite + JavaScript. Las pantallas compondrán features; las features agruparán componentes, hooks, estado y acceso a datos de una capacidad; los componentes UI compartidos permanecerán agnósticos del dominio.

No habrá un `App.jsx` monolítico ni un directorio global de componentes que mezcle todas las responsabilidades. Tampoco se crearán módulos por adelantado si todavía no existe una necesidad real.

### V. Diseño útil, accesible y veloz

La interfaz priorizará la lectura del feed, la identidad del usuario y acciones claras en móvil y escritorio. Se usarán HTML semántico, foco visible, contraste suficiente, nombres accesibles, estados de carga/vacío/error y compatibilidad con movimiento reducido.

La identidad visual se expresará con tokens CSS y componentes consistentes. Se evitarán dependencias de UI, fuentes, animaciones o efectos que no aporten una mejora demostrable.

### VI. Contratos y fuente de verdad

GraphQL será la interfaz principal de lectura y escritura cuando la capacidad esté implementada, en `/graphql`, con esquemas separados por módulo. Los binarios se subirán por HTTP multipart y se asociarán desde GraphQL cuando corresponda.

PostgreSQL conservará la verdad del dominio. Redis será secundario y efímero para cache-aside, idempotencia, rate limiting, contadores temporales o coordinación limitada. Una caída de Redis no puede corromper los datos persistentes.

### VII. Integridad, seguridad y reintentos

La identidad autenticada se obtiene del backend, nunca de un `userId` confiado desde el cliente. Las reglas críticas se validan en servidor. UUID, restricciones únicas, transacciones y operaciones idempotentes protegen la integridad frente a reintentos y concurrencia.

Los uploads usan nombres internos, validación de contenido y tamaño, bloqueo de traversal, almacenamiento persistente externo al repositorio y una abstracción `MediaStorage`. Nunca se registran secretos, tokens completos, contraseñas, cookies ni credenciales.

### VIII. Rendimiento medido

Todo feed tiene paginación acotada, preferiblemente por cursor/keyset. Las relaciones GraphQL se cargan en batch para evitar N+1. La caché se invalida después del commit cuando corresponda y los TTL son configurables.

No se optimiza por intuición con fan-out, locks distribuidos o contadores duplicados. Primero se mide; después se optimiza el cuello de botella real.

### IX. Pruebas proporcionales

Cada cambio tendrá la prueba más pequeña que demuestre su comportamiento y, cuando aplique, pruebas de integración contra PostgreSQL/Redis reales, GraphQlTester, React Testing Library o Playwright. Las pruebas deben ser repetibles, aisladas y centradas en comportamiento.

No se arrancará todo Spring para una regla unitaria ni se ejecutará E2E para un cambio puramente local. Las pruebas de idempotencia, restricciones, cache y concurrencia se incorporan cuando el cambio las afecta.

### X. Reproducibilidad y documentación

Java 21, Spring Boot 4.1.1, Maven Wrapper 3.9.16, React 19.2.8, Vite 8.3.0 y los scripts/dependencias declarados en el repositorio son la referencia actual. No se actualizarán versiones mayores automáticamente.

La configuración sensible vive fuera del repositorio. Docker Compose, migraciones, health checks y comandos deben poder reproducirse desde el proyecto. Todo cambio que altere estructura, comandos o comportamiento actualiza la documentación correspondiente.

## Orden de decisión

Ante un conflicto se aplica este orden:

1. Requerimiento explícito de la tarea actual.
2. `AGENTS.md`.
3. Esta constitución.
4. Arquitectura y código ya implementados.
5. Preferencias o mejoras no solicitadas.

Los agentes deben conservar trabajo previo, evitar cambios destructivos y modificar únicamente lo relacionado con la tarea.

## Definition of Done

Una entrega está completa cuando el cambio solicitado funciona, compila o valida según su capa, mantiene las pruebas relevantes, no introduce secretos ni archivos temporales, respeta la separación modular, analiza seguridad/concurrencia/caché cuando corresponde y deja la documentación actualizada. Si una capacidad aún no existe, debe describirse como pendiente y no como implementada.
