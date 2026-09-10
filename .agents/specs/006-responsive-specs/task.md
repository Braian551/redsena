# Task 006 — Publicaciones responsive sin desbordamiento

**Spec:** [spec.md](spec.md)
**Plan:** [plan.md](plan.md)
**Estado:** completado y desplegado; smoke visual autenticado pendiente

## Análisis y diseño

- [x] `T001` Revisar reglas, constitución, `package.json`, componentes de posts y layout existente. — `RF-RESP-006-001` a `RF-RESP-006-005`
- [x] `T002` Documentar causa, alcance, criterios y decisión de no ocultar overflow global. — `RNF-RESP-006-001`, `RNF-RESP-006-002`

## Implementación frontend

- [x] `T003` Contener `PostCard` con ancho completo, `min-w-0`, `max-w-full` y overflow local. — `RF-RESP-006-001`
- [x] `T004` Aplicar ruptura segura a cuerpo de publicaciones, comentarios y mensajes largos. — `RF-RESP-006-002`
- [x] `T005` Encapsular imágenes en marcos 4:3 y organizar media en una/dos columnas según breakpoint. — `RF-RESP-006-003`, `RF-RESP-006-004`
- [x] `T006` Revisar composer, acciones, formularios y avisos para conservar interacción en móvil. — `RF-RESP-006-005`, `RNF-RESP-006-003`
- [x] `T007` Actualizar README del frontend y roadmap/documentación de la capacidad. — `RNF-RESP-006-004`

## Verificación

- [x] `T008` Ejecutar `npm run lint`. — `RNF-RESP-006-001`, `RNF-RESP-006-003`
- [x] `T009` Ejecutar `npm run build`. — `RNF-RESP-006-004`
- [x] `T010` Validar Compose local y productivo con configuración temporal sin secretos persistidos. — `RNF-RESP-006-004`
- [x] `T011` Revisar diff, archivos temporales y dependencias; preservar cambios concurrentes. — `RNF-RESP-006-001`, `RNF-RESP-006-004`

## Despliegue

- [x] `T012` Transferir el frontend responsive al proyecto remoto `redsena-prod`. — `RNF-RESP-006-004`
- [x] `T013` Ejecutar `bash scripts/deploy.sh` y confirmar seis servicios healthy, `/`, `/health` y Flyway sin cambios. — `RNF-RESP-006-004`
- [x] `T014` Ejecutar smoke público de `https://redsena.online` y limpiar copias temporales remotas. — `RNF-RESP-006-004`

## Pendiente externo

- [ ] `T015` Ejecutar inspección visual autenticada con publicaciones largas y múltiples imágenes en viewport móvil real. — requiere credenciales Firebase y navegador/E2E declarado
