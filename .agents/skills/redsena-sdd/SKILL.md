---
name: redsena-sdd
description: Aplicar Spec-Driven Development en RedSENA para convertir una capacidad en una spec.md verificable, un plan, tareas trazables y una implementación validada.
---

# RedSENA SDD

Usa este skill cuando una solicitud pida trabajar desde una especificación, crear o actualizar una feature en `.agents/specs/`, o mantener alineados requisitos, plan, tareas, código y validación.

## Principio

La especificación expresa la intención y es la fuente de verdad de la capacidad. El código, las pruebas y la documentación deben poder rastrearse hasta requisitos concretos; si una parte no está implementada, se marca como pendiente en lugar de presentarla como terminada.

SDD es un proceso, no una dependencia ni un framework. En RedSENA se aplica como:

```text
spec.md → plan.md → task.md → implementación → verificación
```

La estructura existente usa `task.md` en singular; conservar ese nombre para no romper el repositorio.

## Flujo de trabajo

1. Leer `AGENTS.md`, `dos/constitution.md`, la spec de la capacidad y los archivos afectados.
2. Registrar en `spec.md` el problema, alcance, actores, supuestos, requisitos funcionales, no funcionales, criterios de aceptación, límites y decisiones técnicas.
3. Convertir los requisitos en un `plan.md` pequeño y ordenado por dependencias. Cada decisión debe justificar por qué es suficiente para la etapa actual.
4. Desglosar el plan en `task.md`, vinculando cada tarea con uno o más IDs de requisito y marcando explícitamente lo que queda fuera.
5. Implementar el corte vertical mínimo. Mantener los límites del stack existente y no agregar infraestructura especulativa.
6. Verificar build, lint, tests relevantes y los contratos de Compose que hayan cambiado. Actualizar el estado de la spec al terminar.

## Reglas de requisitos

- Usar IDs estables y legibles, por ejemplo `RF-AUTH-001` y `RNF-SEC-001`.
- Cada requisito debe ser observable y comprobable; evitar frases vagas como “fácil de usar”.
- Separar comportamiento (`RF`), calidad/seguridad (`RNF`), decisiones técnicas y pendientes.
- Los criterios de aceptación deben describir el resultado visible o verificable, incluidos errores, estados de carga y límites.
- Distinguir configuración requerida de comportamiento implementado. Una variable `.env.example` no significa que un proveedor externo ya esté configurado.
- Documentar las integraciones externas, sus prerrequisitos y sus límites de confianza.

## Reglas específicas de RedSENA

- Mantener React + Vite + JavaScript; organizar la interfaz por features y mantener las llamadas a proveedores detrás de un adaptador o contexto.
- Mantener PostgreSQL como fuente de verdad. Redis solo es secundario para datos efímeros, caché, idempotencia o rate limiting.
- Mantener el monolito modular Spring Boot y evitar microservicios, colas o capas vacías.
- No poner secretos, service-account keys ni credenciales de Firebase en el cliente o en Git. La configuración web se inyecta mediante variables `VITE_*`.
- Para cada cambio de persistencia, seguridad, caché, concurrencia o Compose, añadir el criterio de verificación correspondiente.
- No declarar una integración backend con Firebase hasta validar tokens en Spring Security; una sesión local del SDK no equivale a autorización de API.

## Verificación y trazabilidad

Antes de cerrar una capacidad, revisar:

- cada requisito tiene implementación, prueba o una nota de pendiente;
- cada tarea completada apunta a un requisito;
- los criterios negativos y los estados de error están cubiertos;
- no se añadieron secretos ni dependencias mayores innecesarias;
- el README y la spec describen el estado real;
- el diff contiene solo archivos relacionados.

Fuentes de referencia del enfoque: [GitHub Spec Kit: What is Spec-Driven Development?](https://github.com/github/spec-kit/blob/main/docs/concepts/sdd.md), [GitHub Spec Kit: workflow](https://github.github.com/spec-kit/) y, para las integraciones del proyecto, [Firebase Password Auth](https://firebase.google.com/docs/auth/web/password-auth) y [Tailwind CSS con Vite](https://tailwindcss.com/docs/installation/using-vite).
