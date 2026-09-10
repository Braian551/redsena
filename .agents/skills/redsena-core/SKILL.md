---
name: redsena-core
description: Apply RedSENA's repository-wide architecture, quality, documentation, and token-efficient workflow rules. Use for changes that cross backend, frontend, tests, or project structure.
---

# RedSENA core

Use this as the project router. Read `AGENTS.md` before changing repository files and read `dos/constitution.md` when the task affects architecture, quality, or project conventions. Do not load every RedSENA skill by default.

## Route only what is needed

| Task | Skill to read |
|---|---|
| Quality review, Definition of Done, scope, dependencies | `../redsena-quality/SKILL.md` |
| UI visual direction, interaction, responsive design | `../redsena-design/SKILL.md` |
| Spring Boot, MVC, GraphQL, persistence, Redis, uploads | `../redsena-backend/SKILL.md` |
| React components, feature modules, client state, frontend API | `../redsena-frontend/SKILL.md` |
| Unit, integration, GraphQL, frontend, or E2E tests | `../redsena-testing/SKILL.md` |

When a change crosses layers, combine only the relevant skills. Examples: a React feature with tests uses `redsena-frontend` + `redsena-testing`; a GraphQL feature with integration tests uses `redsena-backend` + `redsena-testing`. A visual change also uses `redsena-design`.

## Repository facts

- Backend: Java 21, Spring Boot 4.1.1, Maven Wrapper 3.9.16, package `com.redsena.demo`.
- Backend currently contains only the Spring Boot entry point, a minimal `application.properties`, an empty Compose definition, and a context test scaffold with Testcontainers support.
- Frontend: JavaScript ES modules, React 19.2.8, React DOM 19.2.8, Vite 8.3.0, `@vitejs/plugin-react` 6.1.1, Oxlint 1.81.0. The current working tree also contains a Firebase 12.19.0 client and an `AuthProvider`; treat backend authentication/security integration as pending.
- Frontend currently remains the Vite starter screen; Vitest, React Testing Library, Playwright, GraphQL Client, and the target backend starters are not declared yet.

Treat these as observed facts, not as permission to add the whole target stack. Inspect `pom.xml` and `package.json` before assuming a dependency or script exists.

## Efficient execution

- Prefer the smallest vertical slice that solves the request.
- Keep business rules in the appropriate module, not in a global utility or a large component.
- Do not rewrite the scaffold or create empty architecture folders without a current use.
- Use the existing wrappers and scripts. Run focused validation while iterating and the relevant full check before completion.
- For documentation-only work, change only Markdown or the requested constitution and do not modify code, dependencies, lockfiles, or generated assets.
