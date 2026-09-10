---
name: redsena-quality
description: Review or implement RedSENA changes with minimal scope, explicit quality gates, safe dependencies, and maintainable delivery. Use for quality reviews or any implementation where project-wide guardrails matter.
---

# RedSENA quality

Use `AGENTS.md` as the detailed operational contract and `dos/constitution.md` as the project principles. Keep the solution simple because RedSENA is a small, fast social application; complexity needs a concrete benefit.

## Required decisions

- Preserve the existing monolith and directory structure. Do not introduce microservices, Kubernetes, Kafka, CQRS, or a new framework without an explicit requirement and demonstrated need.
- Inspect the current `pom.xml`, `package.json`, and related tests before changing code. Respect Java 21, Spring Boot 4.1.1, React 19.2.8, Vite 8.3.0, and the existing Maven/npm lockfiles.
- Prefer a small, cohesive change over a broad rewrite. Do not upgrade major dependencies during an unrelated task.
- Keep PostgreSQL as the domain source of truth. Redis may accelerate cache, idempotency, rate limiting, or ephemeral coordination; it must not silently become authoritative.
- Validate security and concurrency for every write: authenticated identity comes from the backend security context, database constraints protect uniqueness, and retries do not create duplicates.
- Keep logs safe: never emit passwords, complete JWTs, authorization headers, cookies, secrets, credentials, binary content, or unnecessary private content.

## Quality gates

Before completion, select the applicable gates rather than running unrelated work:

1. The relevant unit, integration, GraphQL, frontend, or E2E tests pass.
2. Backend changes compile with `backend/demo/./mvnw.cmd` on Windows or the project wrapper equivalent.
3. Frontend changes pass the scripts actually declared in `frontend/redsena/package.json`, at minimum `npm run build` and `npm run lint` when applicable.
4. A persistence change uses a new Flyway migration and does not edit an already-applied migration.
5. A GraphQL feed is paginated, bounded, and free of an obvious N+1 pattern.
6. A cached write documents and implements post-commit invalidation where applicable.
7. A container or Compose change is checked with `docker compose config` and health is verified when services are available.
8. The README or relevant architecture documentation is updated when behavior, commands, or structure changes.

For a documentation-only task, the meaningful gates are factual consistency, valid Markdown links, and a clean diff limited to documentation. Do not pretend unimplemented target features are already available.

