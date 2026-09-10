# Spec 001 — Login y registro con Firebase

**Estado:** implementado en frontend e infraestructura inicial; integración de identidad con backend pendiente  
**Versión:** 1.0  
**Fecha:** 2026-09-10  
**Método:** Spec-Driven Development (SDD)  
**Área:** autenticación inicial, frontend React y entorno local

## 1. Contexto

RedSENA necesita una puerta de entrada simple para que una persona pueda crear una cuenta, volver a iniciar sesión y cerrar sesión. El scaffold ya usa React + Vite y contiene una integración parcial con Firebase Google Auth. Esta etapa convierte esa base en una experiencia de autenticación funcional con email/contraseña, conserva Google como proveedor alternativo, aplica Tailwind CSS y prepara PostgreSQL/Redis como infraestructura local reproducible.

La identidad se resuelve inicialmente en el cliente con Firebase Authentication. El backend Spring Boot todavía no valida el ID token de Firebase ni sincroniza usuarios con PostgreSQL; por ello esta spec no presenta esa integración como terminada.

## 2. Investigación SDD aplicada

SDD trata la especificación como fuente de intención y usa refinamiento progresivo, en vez de convertir una instrucción informal directamente en código. El flujo que se adopta en este repositorio es:

```text
spec.md → plan.md → task.md → implementación → verificación
```

La investigación también confirma que SDD es independiente del lenguaje y del framework. En consecuencia, la spec fija el comportamiento y las restricciones, mientras el plan fija decisiones concretas para este scaffold.

Fuentes consultadas:

- [GitHub Spec Kit — What is Spec-Driven Development?](https://github.com/github/spec-kit/blob/main/docs/concepts/sdd.md)
- [GitHub Spec Kit — Spec → Plan → Tasks → Implement](https://github.github.com/spec-kit/)
- [Firebase — Password-based accounts for the web](https://firebase.google.com/docs/auth/web/password-auth)
- [Tailwind CSS — Installation with Vite](https://tailwindcss.com/docs/installation/using-vite)

## 3. Objetivo

Entregar un flujo de autenticación inicial que permita:

1. registrarse con nombre, correo y contraseña;
2. iniciar sesión con correo y contraseña;
3. iniciar sesión con Google;
4. conservar la sesión entre recargas mediante el observador de Firebase;
5. cerrar sesión;
6. ejecutar PostgreSQL y Redis localmente con Docker Compose y health checks;
7. dejar los requisitos y el proceso SDD reutilizables para las siguientes capacidades.

## 4. Alcance

### Incluido

- Pantalla responsive de autenticación en React.
- Alternancia entre modos “Iniciar sesión” y “Crear cuenta”.
- Validación local de nombre, formato implícito de email, longitud mínima de contraseña y confirmación.
- Firebase Auth con `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup` y `signOut`.
- Observación de sesión con `onAuthStateChanged`.
- Mapeo de errores de Firebase a mensajes seguros en español.
- Estado de carga, estado deshabilitado y estado de error.
- Tailwind CSS integrado como plugin de Vite.
- Variables de entorno en `.env.example`/`.env.local`, sin fallback de credenciales en código.
- Servicios locales `postgres` y `redis` en `backend/demo/compose.yaml`.
- Volumen persistente para PostgreSQL, red interna y health checks.
- Skill reutilizable `.agents/skills/redsena-sdd/SKILL.md`.

### Fuera de alcance de esta etapa

- Validación del Firebase ID token en Spring Security.
- Creación o sincronización de la tabla `users` en PostgreSQL.
- GraphQL, perfiles, publicaciones, feed, comentarios, likes y uploads.
- Recuperación de contraseña, verificación obligatoria de email, MFA y proveedores adicionales.
- Dockerfiles de frontend/backend, Nginx reverse proxy y despliegue productivo.
- Persistencia de datos de dominio en Redis.

## 5. Actores

| Actor | Necesidad |
|---|---|
| Visitante | Crear una cuenta o iniciar sesión. |
| Usuario autenticado | Ver una pantalla inicial y cerrar sesión. |
| Administrador de Firebase | Habilitar proveedores y configurar dominios autorizados. |
| Desarrollador | Levantar dependencias locales y verificar la feature reproduciblemente. |

## 6. Requisitos funcionales

### Autenticación

| ID | Requisito | Prioridad |
|---|---|---:|
| RF-AUTH-001 | El visitante debe poder cambiar entre los modos de inicio de sesión y registro sin salir de la página. | Alta |
| RF-AUTH-002 | El registro debe solicitar nombre, correo, contraseña y confirmación de contraseña. | Alta |
| RF-AUTH-003 | El registro debe crear la cuenta en Firebase y establecer el nombre visible del usuario. Firebase inicia la sesión automáticamente después de crearla. | Alta |
| RF-AUTH-004 | El inicio de sesión debe aceptar correo y contraseña y delegar la autenticación a Firebase. | Alta |
| RF-AUTH-005 | El visitante debe poder iniciar sesión con Google mediante una ventana emergente de Firebase. | Media |
| RF-AUTH-006 | La aplicación debe observar el estado de Firebase al cargar y mostrar la pantalla autenticada solo cuando exista un usuario. | Alta |
| RF-AUTH-007 | El usuario autenticado debe poder cerrar sesión y volver a la pantalla de autenticación. | Alta |
| RF-AUTH-008 | Los errores conocidos de Firebase deben mostrarse como mensajes comprensibles sin stack traces, tokens ni datos sensibles. | Alta |
| RF-AUTH-009 | Mientras una operación está en curso, el control que la inició debe estar deshabilitado y comunicar el estado de procesamiento. | Alta |
| RF-AUTH-010 | La aplicación debe mostrar un mensaje accionable cuando Firebase no esté configurado mediante variables de entorno. | Alta |

### Infraestructura inicial

| ID | Requisito | Prioridad |
|---|---|---:|
| RF-INFRA-001 | Compose debe definir un servicio PostgreSQL 16 con base, usuario y contraseña configurables por variables de entorno. | Alta |
| RF-INFRA-002 | Compose debe definir un servicio Redis 7.4 para uso futuro de caché/datos efímeros. | Alta |
| RF-INFRA-003 | PostgreSQL debe conservar sus datos en el volumen `postgres_data` al recrear los contenedores. | Alta |
| RF-INFRA-004 | PostgreSQL y Redis deben tener health checks y declarar la red `redsena_network`. | Alta |
| RF-INFRA-005 | La exposición de puertos de Compose debe entenderse como desarrollo local; PostgreSQL y Redis no deben publicarse directamente en producción. | Alta |

### Requisitos del sistema y configuración

| ID | Requisito | Prioridad |
|---|---|---:|
| RF-SYS-001 | El frontend debe ejecutarse con React + Vite + JavaScript y cargar estilos mediante Tailwind CSS. | Alta |
| RF-SYS-002 | La configuración Web de Firebase debe provenir de variables `VITE_FIREBASE_*`; no deben existir valores de proyecto hardcodeados en el adaptador. | Alta |
| RF-SYS-003 | La documentación debe indicar que Email/Password y Google deben habilitarse en Firebase Console y que el dominio local debe estar autorizado. | Alta |
| RF-SYS-004 | La autenticación del frontend debe permanecer detrás de `AuthContext`; las páginas no deben importar Firebase directamente. | Alta |

## 7. Requisitos no funcionales

| ID | Requisito verificable | Criterio |
|---|---|---|
| RNF-SEC-001 | No almacenar contraseñas, tokens completos, service-account keys ni secretos en Git o logs. | Búsqueda de secretos y revisión del diff sin credenciales. |
| RNF-SEC-002 | La configuración ausente no debe romper el bundle ni producir una pantalla en blanco. | `npm run build` pasa y la UI presenta un error accionable en runtime. |
| RNF-SEC-003 | La identidad de API futura no debe derivarse de un `userId` enviado por el cliente. | Integración backend posterior validará el ID token y resolverá el usuario autenticado. |
| RNF-A11Y-001 | Campos y botones deben tener nombres accesibles, foco visible, alertas con `role="alert"` y estados de carga anunciables. | Revisión semántica y navegación por teclado. |
| RNF-A11Y-002 | La interfaz debe respetar `prefers-reduced-motion` y mantener contraste legible. | Revisión visual en desktop/móvil y CSS de reducción de movimiento. |
| RNF-UX-001 | La experiencia debe ser responsive desde 320 px, sin requerir hover para completar una acción. | Verificación en viewport móvil y escritorio. |
| RNF-UX-002 | Los mensajes no deben revelar si un correo existe cuando Firebase tenga habilitada la protección contra enumeración. | Usar mensajes genéricos compatibles con la configuración del proveedor. |
| RNF-OPS-001 | El arranque local debe ser reproducible con el Compose versionado y `.env.example`. | `docker compose config` válido y health checks disponibles. |
| RNF-OPS-002 | PostgreSQL es la futura fuente de verdad; Redis es secundario y efímero en esta etapa. | No hay tablas de dominio ni dependencia de persistencia crítica en Redis. |
| RNF-MAINT-001 | La lógica de proveedor debe quedar encapsulada en `AuthContext`/`firebase.js`. | `App.jsx` no importa APIs de Firebase. |
| RNF-MAINT-002 | Los artefactos SDD deben mantener trazabilidad entre spec, plan, tareas e implementación. | Cada tarea terminada referencia requisitos RF/RNF. |

## 8. Contrato técnico

### Frontend

```text
frontend/redsena/src/
├── context/AuthContext.jsx   # estado y casos de uso de autenticación
├── lib/firebase.js           # configuración y adaptadores Firebase
├── App.jsx                   # composición de login, registro y sesión
├── App.css                   # solo ajuste global de reducción de movimiento
└── index.css                 # import y tokens de Tailwind
```

El contexto expone, como mínimo:

```text
user
loading
error
clearError()
registerWithEmail({ name, email, password })
signInWithEmail({ email, password })
signInWithGoogle()
signOut()
```

### Firebase

El proyecto debe habilitar los proveedores Email/Password y Google. El frontend usa la configuración pública de una app web a través de `.env.local`; nunca se debe colocar una clave privada de cuenta de servicio en variables `VITE_*`.

### Compose

```text
postgres: postgres:16-alpine
redis:    redis:7.4-alpine
```

PostgreSQL usa `postgres_data`. Redis no tiene volumen de dominio en esta etapa y se inicia sin AOF porque solo será infraestructura secundaria/efímera hasta que exista una decisión explícita de persistencia.

## 9. Flujos de aceptación

### Registro exitoso

```gherkin
Dado que Firebase está configurado y el proveedor Email/Password está habilitado
Cuando el visitante selecciona “Regístrate”, completa nombre, correo, contraseña válida y confirmación coincidente
Y envía el formulario
Entonces Firebase crea la cuenta
Y la sesión queda activa
Y se muestra la pantalla autenticada con el nombre del usuario
```

### Inicio de sesión exitoso

```gherkin
Dado que existe una cuenta Email/Password en Firebase
Cuando el visitante introduce sus credenciales válidas y selecciona “Iniciar sesión”
Entonces se muestra la pantalla autenticada
Y una recarga conserva el estado observado por Firebase
```

### Validación y errores

```gherkin
Dado que el formulario de registro está visible
Cuando las contraseñas no coinciden o tienen menos de 6 caracteres
Entonces no se realiza una llamada a Firebase
Y se muestra un mensaje asociado al formulario

Dado que Firebase responde con credenciales inválidas, popup bloqueado o dominio no autorizado
Entonces la interfaz muestra un mensaje en español
Y el formulario vuelve a estar disponible para reintentar
```

### Infraestructura

```gherkin
Dado que Docker está disponible
Cuando se ejecuta docker compose up -d desde backend/demo
Entonces postgres y redis quedan en la red redsena_network
Y ambos reportan estado healthy
Y los datos de PostgreSQL sobreviven a docker compose down seguido de docker compose up -d
```

## 10. Estado y trazabilidad

| Requisito | Evidencia | Estado |
|---|---|---|
| RF-AUTH-001 a RF-AUTH-010 | `frontend/redsena/src/App.jsx`, `src/context/AuthContext.jsx`, `src/lib/firebase.js` | Implementado |
| RF-INFRA-001 a RF-INFRA-005 | `backend/demo/compose.yaml`, `backend/demo/.env.example` | Implementado en etapa local |
| RF-SYS-001 a RF-SYS-004 | `package.json`, `vite.config.js`, contexto y configuración | Implementado |
| RNF-SEC-001 a RNF-SEC-003 | Variables de entorno, adaptador sin fallback, límites documentados | Implementado / backend pendiente |
| RNF-A11Y-001 a RNF-A11Y-002 | HTML semántico, labels, foco, alertas y reducción de movimiento | Implementado |
| RNF-UX-001 a RNF-UX-002 | Layout responsive y mensajes del contexto | Implementado |
| RNF-OPS-001 a RNF-OPS-002 | Compose y volumen PostgreSQL | Implementado en etapa local |
| RNF-MAINT-001 a RNF-MAINT-002 | límites de módulos y artefactos SDD | Implementado |
| Token Firebase en backend/Spring Security | Integración posterior | Pendiente |
| Usuarios/perfiles en PostgreSQL y migraciones Flyway | Capacidad posterior | Pendiente |

## 11. Definition of Done de esta spec

- [x] La spec contiene alcance, requisitos funcionales y no funcionales, criterios de aceptación y pendientes.
- [x] El frontend implementa login, registro, Google, sesión persistente y cierre de sesión con Firebase.
- [x] Tailwind está integrado en Vite y la interfaz usa utilidades Tailwind.
- [x] Compose define PostgreSQL, Redis, red, volumen y health checks.
- [x] No se agregan credenciales reales ni secretos.
- [x] `plan.md` y `task.md` describen la trazabilidad del cambio.
- [ ] Firebase Console está configurado por el equipo con los proveedores y dominios del entorno.
- [ ] Spring Security verifica el Firebase ID token y sincroniza el usuario con PostgreSQL.
- [ ] Se agregan pruebas automatizadas frontend/E2E cuando se incorporen las herramientas declaradas en el roadmap.
