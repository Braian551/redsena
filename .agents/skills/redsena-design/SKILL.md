---
name: redsena-design
description: Define or review RedSENA's visual and interaction design for a fast, accessible React social application without adding unnecessary UI complexity or dependencies.
---

# RedSENA design

Use this only for visual direction, interaction design, responsive behavior, or UI review. Pair it with `../redsena-frontend/SKILL.md` when implementing React code. Read `../accessibility/SKILL.md` only for a dedicated accessibility audit or when an interaction needs detailed WCAG guidance.

## Product direction

RedSENA should feel clear, human, and quick to scan. The primary experience is a social feed: identity, post content, media, comments, and like state must be understandable at a glance. Design for small screens first and scale up without changing the information hierarchy.

- Prefer a focused visual system over decorative effects.
- Use semantic HTML, visible focus states, readable contrast, meaningful labels, and motion that respects reduced-motion preferences.
- Use CSS variables for color, spacing, typography, radius, and elevation. Keep tokens centralized rather than scattering values across components.
- Reuse existing CSS and assets when they fit. Do not add a font, icon library, animation library, CSS framework, or design system package just to style one screen.
- Make loading, empty, error, disabled, and optimistic interaction states part of the design—not afterthoughts.
- Use native controls where possible. Icons never replace an accessible name.

## Component-level design rules

- A page establishes layout and hierarchy; a feature owns a user task; a shared UI component owns reusable presentation.
- Keep cards, buttons, fields, menus, dialogs, and feedback states visually consistent through tokens and variants, not one-off CSS.
- Preserve the content order on mobile. Avoid hover-only affordances and interactions that require dragging.
- Make actions easy to identify without relying only on color. Like state, validation, and errors need text or accessible state in addition to styling.
- Keep motion short and purposeful. Do not trade startup time or input responsiveness for visual effects.

The existing Vite starter screen is scaffolding, not the product design. Replace it incrementally when a feature requires it; do not build a large design system before there are reusable patterns to justify it.

