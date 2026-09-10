# Plan 001 — Login y registro con Firebase

**Spec:** [spec.md](spec.md)  
**Estado:** implementado con pendientes explícitos  
**Orden SDD:** spec → plan → task → implementación → verificación

## Decisiones

1. **Firebase Auth en frontend:** el requerimiento pide una primera entrega de login/registro con Firebase. Se mantiene el proveedor detrás de `firebase.js` y `AuthContext` para que `App.jsx` no quede acoplado al SDK.
2. **Email/Password + Google:** email/contraseña cubre registro e inicio de sesión; Google conserva la capacidad previa sin forzar un segundo flujo de registro.
3. **Tailwind como plugin Vite:** se usa `tailwindcss` + `@tailwindcss/vite`, que es el flujo oficial para el Vite existente. No se agrega una librería de componentes.
4. **Compose de infraestructura solamente:** PostgreSQL y Redis se incorporan en el `compose.yaml` existente. Backend, frontend compilado y Nginx quedan para una etapa posterior porque todavía no existen Dockerfiles ni una API autenticada.
5. **PostgreSQL persistente, Redis efímero:** la base de dominio debe sobrevivir al ciclo de contenedores; Redis aún no guarda datos críticos ni necesita volumen.

## Fases

### Fase 1 — Contrato SDD

- Completar `spec.md` con RF/RNF, alcance, aceptación y estado real.
- Crear `redsena-sdd` para repetir el flujo en nuevas capacidades.

### Fase 2 — Adaptador Firebase

- Eliminar fallback de configuración hardcodeada.
- Añadir casos de uso de email/contraseña y manejo de errores.
- Mantener `onAuthStateChanged` como única fuente de sesión en UI.

### Fase 3 — Interfaz

- Integrar Tailwind al pipeline Vite.
- Componer login/registro en una vista accesible y responsive.
- Incluir estados loading, error, disabled y sesión activa.

### Fase 4 — Infraestructura local

- Definir PostgreSQL y Redis con versiones explícitas.
- Añadir variables de desarrollo, red, volumen y health checks.
- Validar el archivo Compose sin afirmar integración de dominio que aún no existe.

### Fase 5 — Verificación

- Ejecutar `npm run lint` y `npm run build`.
- Ejecutar `docker compose config` y, si Docker está disponible, levantar servicios y revisar `docker compose ps`.
- Revisar diff, secretos, documentación y pendientes backend.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Variables Firebase ausentes | El adaptador no inicializa Firebase y la UI muestra una instrucción accionable. |
| Errores de autenticación revelan información | Mensajes seguros y compatibles con protección de enumeración. |
| Confundir sesión Firebase con autenticación de API | La spec marca la validación Spring Security como pendiente. |
| Redis se vuelve fuente de verdad | No se persiste dominio en Redis y se deja explícito en Compose/spec. |
| Cambios previos no relacionados | Se conserva el código existente y se limita el diff a esta capacidad. |
