# Task 002 — Edición de perfil persistente y entrega desplegable

**Spec:** [spec.md](spec.md)  
**Plan:** [plan.md](plan.md)  
**Estado:** completado con pendiente externo de Firebase real

## Contrato y documentación

- [x] `T001` Registrar alcance, actores, requisitos y criterios de aceptación de la edición de perfil (nombre visible, bio y foto). — `RF-PROFILE-001` a `RF-PROFILE-006`
- [x] `T002` Investigar y documentar Compose, health checks, volúmenes, Nginx, Actuator, Firebase y topología del edge. — `RNF-OPS-001` a `RNF-OPS-003`
- [x] `T003` Mantener explícitos los límites: sin seguidores, object storage, Kubernetes ni smoke autenticado Firebase. — fuera de alcance

## Backend

- [x] `T004` Mantener `displayName` editable en `UserAccount` y agregar `bio` con valor inicial estable. — `RF-PROFILE-001`, `RNF-DB-001`
- [x] `T005` Crear `V002__add_user_bio.sql` sin editar `V001`. — `RNF-DB-001`
- [x] `T006` Exponer `displayName`, `bio`, `UpdateProfileInput` y `updateProfile` en GraphQL. — `RF-PROFILE-001`, `RF-PROFILE-002`
- [x] `T007` Implementar `UserProfileService` con trim, máximos 120/180 caracteres, transacción e identidad autenticada. — `RF-PROFILE-002`, `RF-PROFILE-003`, `RNF-SEC-001`
- [x] `T008` Invalidar `posts/feed` después del commit. — `RNF-CACHE-001`
- [x] `T009` Agregar pruebas de integración/unitarias para persistencia, trim, límites y lectura posterior. — `RNF-DB-001`, `RF-PROFILE-003`

## Frontend

- [x] `T010` Mover el almacenamiento de perfil a `features/profile/model/profileRepository.js`. — `RNF-MAINT-001`
- [x] `T011` Usar GraphQL para cargar/guardar nombre y bio cuando el backend está activo. — `RF-PROFILE-005`
- [x] `T012` Sincronizar el nombre con Firebase Auth, refrescar el token y mantener fallback `localStorage`, límites visibles, cancelar, loading, error y éxito. — `RF-PROFILE-004`, `RF-PROFILE-006`
- [x] `T013` Conservar la foto en Firebase Storage y documentar que no participa en la transacción PostgreSQL. — fuera del cambio de proveedor; `RNF-SEC-001`

## Verificación y entrega

- [x] `T014` Ejecutar `.\mvnw.cmd test`. — `RF-PROFILE-001` a `RF-PROFILE-003`
- [x] `T015` Ejecutar `npm run lint` y `npm run build`. — `RF-PROFILE-004`, `RF-PROFILE-005`
- [x] `T016` Ejecutar `docker compose config` para Compose local y productivo. — `RNF-OPS-001`
- [x] `T017` Ejecutar build/up remoto con `deploy/scripts/deploy.sh` sin tocar el proyecto ajeno. — `RNF-OPS-001`, `RNF-OPS-002`
- [x] `T018` Ejecutar `deploy/scripts/verify.sh`, revisar `docker compose ps` y smoke HTTPS público. — `RNF-OPS-003`
- [x] `T019` Revisar diff, secretos, volúmenes y estado final de la spec. — `RNF-SEC-001`, `RNF-OPS-001`

## Pendiente externo

- [ ] `T020` Configurar/confirmar Firebase Console, dominios autorizados y ejecutar un flujo autenticado real. — prerrequisito externo, no bloquea la entrega de código/infraestructura
