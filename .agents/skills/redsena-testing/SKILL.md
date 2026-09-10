---
name: redsena-testing
description: Design and execute focused RedSENA tests across Spring Boot, GraphQL, PostgreSQL/Redis, React, and Playwright without inflating the test suite or assuming undeclared tooling.
---

# RedSENA testing

Use this for test planning, implementation, failures, or delivery verification. Pair it with `../redsena-backend/SKILL.md` for backend tests and `../redsena-frontend/SKILL.md` for React tests. Read only the relevant path; do not run every test layer for a small change.

## Observed test baseline

Backend has a Spring context smoke test, Flyway/JPA validation, and a GraphQL integration test against PostgreSQL and Redis Testcontainers. The frontend currently declares only `dev`, `build`, `lint`, and `preview`; Vitest, React Testing Library, and Playwright are still target tools, not installed test scripts.

Inspect the actual POM and `package.json` before running or documenting a command. The current known checks are:

```powershell
cd backend/demo
.\mvnw.cmd test

cd ../../frontend/redsena
npm ci
npm run lint
npm run build
```

## Test pyramid

### Backend

- Unit tests: JUnit 5 + Mockito for application services, domain rules, validators, mappers, authorization decisions, idempotency decisions, and cache-invalidation decisions. Do not start Spring for a pure unit test.
- Integration tests: Spring Boot + Testcontainers for real PostgreSQL and Redis behavior, migrations, constraints, cache degradation, and concurrency that mocks cannot prove.
- GraphQL tests: `GraphQlTester` for schema paths, queries, mutations, validation, authorization, stable error codes, pagination, and batch-loading behavior when measurable.

### Frontend

- Vitest + React Testing Library for user-visible component behavior, loading/error/empty states, forms, feed, comments, likes, and feature hooks once those dependencies are introduced.
- Playwright for a small number of critical user journeys against an isolated environment: authenticate, create a post, see it in the feed, like, comment, and observe updated state.

## Test quality rules

- Tests must be independent, repeatable, runnable alone and in CI, and based on factories/builders/fixtures rather than manually prepared data.
- Assert behavior and contracts, not private implementation details, CSS class names, or incidental component structure.
- Cover retries and concurrency for writes: same idempotency key plus same payload returns the same result; a different payload is rejected; concurrent creation cannot duplicate the domain record.
- Verify the database constraint as well as the Redis guard for domain uniqueness.
- For cache-only features, test hit, miss, TTL/eviction as relevant, write invalidation, and safe fallback when Redis is unavailable.
- For each code change, start with the smallest focused test, then run the relevant suite and the full available check before completion. Do not add broad E2E coverage to a pure unit change.
