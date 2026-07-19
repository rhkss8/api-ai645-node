# MVP Execution Harness

## Objective

Ship a focused MVP that proves one core loop:

`[Core loop from docs/g-stack.md]`

The MVP should not become a broad platform before the first core loop is proven.

## Core Loop

1. `[Step 1]`
2. `[Step 2]`
3. `[Step 3]`
4. `[Step 4]`
5. `[Outcome]`

## MVP Scope

### Must Have

- `[Feature required for core loop]`
- `[Feature required for core loop]`
- Analytics events for every step in the core loop.

### Should Have

- `[Useful but not blocking]`

### Not MVP

- `[Explicitly excluded feature]`
- `[Explicitly excluded feature]`

## Product Principles

- The product should make the core user transformation easier than the old behavior.
- Every feature must map to a superpower or core loop step.
- Avoid building infrastructure that does not unlock the next user-visible slice.

## Harness Layers

### Product Harness

Defines scope, flows, success metrics, and what must not be built yet.

### Design Harness

Defines design philosophy, UX strategy, interaction principles, visual system rules, service design, and design QA.

### Frontend Harness

Defines code quality rules for maintainable development.

### AI Harness

Defines prompt contracts, JSON schemas, fixtures, and regression tests if AI is part of the product.

### Data Harness

Defines database entities, event names, and traceability.

### QA Harness

Defines acceptance tests for the core loop and edge cases.

## Definition of Done

The MVP is done only when:

- A new user can complete the core loop.
- Core data is persisted.
- Analytics events are emitted.
- Design QA passes against `docs/design-qa-checklist.md`.
- Main flow has at least one regression check.
- Manual QA passes on a fresh user account.
