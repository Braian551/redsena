---
name: redsena-backend
description: Build or review RedSENA backend features using Java 21, Spring Boot 4.1.1, modular MVC boundaries, GraphQL, PostgreSQL, Redis, and explicit domain integrity.
---

# RedSENA backend

Use this for Spring Boot, API, database, cache, security, uploads, or infrastructure work. Pair it with `../redsena-testing/SKILL.md` when adding or changing tests and with `../redsena-quality/SKILL.md` for a delivery review.

## Current baseline

The backend is currently a minimal Spring Boot application in `backend/demo`, package `com.redsena.demo`, using Java 21 and Spring Boot 4.1.1. Its POM currently declares JPA, Thymeleaf, Docker Compose runtime support, Spring test starters, and Testcontainers JUnit support. GraphQL, Security, Redis, Flyway, Actuator, and Micrometer are target capabilities, not current dependencies; add only what the requested slice needs.

## MVC within a modular monolith

Evolve the package gradually. Create a package only when it contains real behavior:

```text
com.redsena.demo
├── config/
├── security/
├── shared/
│   ├── exception/
│   ├── graphql/
│   ├── validation/
│   ├── cache/
│   ├── idempotency/
│   └── logging/
├── auth/
├── users/
├── posts/
├── comments/
├── likes/
├── feed/
└── media/
```

For a module, use only the useful parts of:

```text
module/
├── presentation/    # GraphQL/REST controllers, transport DTOs, mappers
├── application/     # use cases, orchestration, transaction boundaries
├── domain/          # entities, value objects, rules, domain contracts
└── infrastructure/  # JPA, Redis, filesystem, external adapters
```

Presentation is the MVC controller boundary; application coordinates the model and use cases; infrastructure implements persistence and adapters; GraphQL/JSON is the transport view. Controllers and GraphQL resolvers should validate and delegate, not contain business rules or loops of repository calls.

## Non-negotiable backend invariants

- Use constructor injection and `final` fields where appropriate. Avoid field injection and `System.out.println`.
- PostgreSQL is authoritative. Use UUIDs for public identifiers, Flyway for schema changes, and database constraints for uniqueness and integrity.
- Use `UNIQUE(user_id, post_id)` or its equivalent for likes. Prefer explicit idempotent mutations such as `setPostLike(postId, liked)` over toggles.
- Obtain the authenticated user from Spring Security context; never trust a user ID supplied by the client.
- Use Bean Validation on transport inputs and repeat critical rules in the domain/application layer.
- Use keyset/cursor pagination for feeds ordered by `created_at DESC, id DESC`, with server-side bounds.
- Resolve repeated GraphQL relations with batch loading (`@BatchMapping`, DataLoader, or `BatchLoaderRegistry`), never one query per item.
- Treat Redis as cache, idempotency, rate limiting, or ephemeral coordination. Cache-aside reads must tolerate cache failure when PostgreSQL can safely answer.
- Invalidate relevant cache entries after a successful database commit. Configure TTLs; do not scatter magic values.
- Store uploaded files behind a `MediaStorage` contract, generate internal UUID names, validate MIME/extension/size, block traversal, and persist uploads outside the Git tree.
- Return stable GraphQL error codes and request IDs without exposing stack traces or secrets.

Do not create empty layers, speculative abstractions, or a complex fan-out feed before measured demand exists.

