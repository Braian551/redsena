# Instrucciones de trabajo para RedSENA

Este archivo es un punto de entrada breve para agentes que consulten `CLAUDE.md`. Las reglas completas están en [`AGENTS.md`](AGENTS.md) y los principios del proyecto en [`dos/constitution.md`](dos/constitution.md).

Antes de modificar código:

1. Lee `AGENTS.md` y revisa los archivos relacionados.
2. Inspecciona `backend/demo/pom.xml` o `frontend/redsena/package.json` antes de asumir versiones, dependencias o scripts.
3. Carga solo el skill local pertinente desde `.agents/skills/`.
4. Conserva la estructura existente y aplica el cambio mínimo correcto.
5. Ejecuta las validaciones proporcionales y actualiza la documentación si cambia el comportamiento.

RedSENA usa Java 21 + Spring Boot 4.1.1 en backend y JavaScript + React 19.2.8 + Vite 8.3.0 en frontend. El árbol de trabajo incluye además Firebase 12.19.0 para una integración cliente de autenticación todavía pendiente de conectarse al backend. El backend evolucionará como monolito modular MVC y el frontend como React por features/módulos. PostgreSQL será la fuente de verdad; Redis será secundario.
