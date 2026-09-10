---
name: redsena-frontend
description: Build or review RedSENA React/Vite features with JavaScript, feature modules, reusable components, predictable state boundaries, and a fast client architecture.
---

# RedSENA frontend

Use this for React components, pages, client state, frontend data access, and browser behavior. Pair it with `../redsena-design/SKILL.md` for visual work and `../redsena-testing/SKILL.md` when tests are part of the change.

## Current baseline

The frontend lives in `frontend/redsena`, uses JavaScript ES modules, React 19.2.8, React DOM 19.2.8, Vite 8.3.0, `@vitejs/plugin-react` 6.1.1, and Oxlint 1.81.0. The current working tree also contains Firebase 12.19.0 with `src/lib/firebase.js` and `src/context/AuthContext.jsx`; keep provider-specific calls behind that boundary and consider backend authentication/security integration pending. It is still visually the Vite starter and currently has no declared GraphQL client, Vitest, React Testing Library, or Playwright scripts. Keep JavaScript and Vite; do not migrate to TypeScript, Next.js, or another framework without explicit instruction.

## Module-first component architecture

Organize by user capability, not by a single giant `components` folder. Introduce folders incrementally; do not create empty layers:

```text
src/
├── app/                  # bootstrap, providers, shell, routing when needed
├── pages/                # route-level composition
├── features/
│   ├── feed/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── model/
│   ├── posts/
│   ├── comments/
│   ├── likes/
│   └── auth/
├── entities/             # shared domain views only when genuinely reused
├── components/ui/        # generic visual primitives
├── shared/               # API client, constants, utilities, formatting
└── assets/
```

Boundaries:

- `pages` compose features and layout; they should not own low-level API calls.
- `features` own a user action or flow, its state, hooks, API operations, and feature-specific components.
- `entities` represent reusable domain data only when multiple features need the same view.
- `components/ui` stays domain-agnostic and receives behavior through props.
- `shared` contains stable cross-feature utilities; do not turn it into a dumping ground.
- `app` owns application-wide providers and shell concerns.

Prefer one-way data flow: parent owns orchestration, children receive explicit props and emit callbacks. Keep state at the narrowest useful scope; use local state first, feature hooks for feature state, and a global provider only for genuinely cross-cutting concerns such as authentication. Keep API access behind a small client/module boundary so components do not scatter `fetch` calls or GraphQL documents across JSX.

Authentication is cross-cutting, so a provider/context is acceptable, but pages and presentational components must not import Firebase directly. Keep configuration in environment variables or the existing adapter, never hardcode new credentials, and keep the UI contract independent of the provider so it can align with the Spring Security backend later.

## Fast and maintainable React

- Keep components small by responsibility, but do not split every markup fragment into a component.
- Avoid circular imports between features. Shared code cannot import a feature; features may use shared primitives.
- Use stable keys and predictable loading, empty, error, disabled, and optimistic states.
- Do not mutate props or shared state. Derive display values instead of duplicating them.
- Use semantic HTML and accessible names; favor native controls over custom behavior.
- Keep CSS scoped by feature or component and use shared tokens. Avoid adding dependencies for one interaction.
- Preserve the current Vite entry point until a real app shell is required.
