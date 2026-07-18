# Design Production Pipeline

## Purpose

This document prevents agents from jumping directly from abstract design principles to implementation.

Human product teams rarely design good UI by reading principles and coding immediately. They move through a production pipeline:

```txt
Product intent -> reference scan -> visual territories -> direction decision -> composition model -> wireframes -> high-fidelity screen plan -> implementation -> design QA
```

New services should follow the same sequence before important UI work.

## Phase 1: Product Intent

Inputs:

- `docs/service-definition.md`
- `docs/g-stack.md`
- `docs/superpowers.md`
- `docs/design-philosophy.md`
- `docs/interaction-principles.md`

Required output:

```txt
Design problem:
Primary user emotion:
Desired user emotion:
Signature interaction:
What the screen must prove:
What the screen must avoid looking like:
```

Do not start visual design until this is clear.

## Phase 2: Reference Scan

Collect references before designing.

Reference categories:

- Direct competitors.
- Adjacent products with similar interaction density.
- Products with the desired emotional tone.
- Products to avoid.
- Platform-native patterns.

For each reference, record:

```txt
Reference:
Why it is relevant:
What to borrow:
What to avoid:
Applicable screen or component:
What is visible before reading:
How it shows state, priority, or action:
```

Rules:

- Do not copy visual identity.
- Borrow interaction and information hierarchy patterns.
- Borrow visibility, object structure, and state presentation patterns.
- Include at least one "avoid" reference so the anti-direction is explicit.
- If internet access is available and the user permits/requests current inspiration, use up-to-date product references. Otherwise use known product categories and document assumptions.

## Phase 3: Visual Territories

Create 2 to 3 distinct visual territories before choosing one.

Each territory should define:

```txt
Name:
Product feeling:
Best for:
Risk:
Palette direction:
Typography direction:
Density:
Shape language:
Motion attitude:
Example products or references:
```

Good territories are meaningfully different.

Bad:

- Green calm version.
- Slightly darker green calm version.
- Another green calm version.

Good:

- Quiet Planner: warm, grounded, structured.
- Clinical Precision: crisp, data-forward, low emotion.
- Conversational Coach: friendly, message-led, soft hierarchy.

## Phase 4: Direction Decision

Choose one direction before implementation.

Decision criteria:

- Fits the product promise.
- Fits the target persona.
- Makes the signature interaction obvious.
- Supports repeated use.
- Can be implemented quickly in the MVP.
- Avoids the anti-category.

Record the decision in `docs/decision-log.md`.

Required output:

```txt
Chosen direction:
Why:
Rejected directions:
Risks:
Design constraints for implementation:
```

## Phase 5: Composition Model

Define what the screen makes visible before defining exact layout.

Read:

- `docs/ui-quality-philosophy.md`
- `docs/visual-composition-rules.md`

For each primary screen:

```txt
Screen:
First viewport promise:
Current state:
Primary object:
Primary action:
Visual weight order:
Objects and states:
Text budget:
Layout anti-patterns avoided:
Responsive risks:
```

Rules:

- The first viewport must show current state, primary object, and primary action.
- Do not solve unclear hierarchy with more helper text.
- If the screen depends on paragraphs, return to object and state modeling.
- Decide whether the screen is a board, list, form, review surface, timeline, comparison, or conversation before styling.

## Phase 6: Wireframe Plan

Define layout before styling.

For each primary screen:

```txt
Screen:
User job:
Primary action:
Secondary actions:
Information priority:
Sections from top to bottom:
Empty state:
Loading state:
Error state:
Review or confirmation state:
```

Rules:

- Wireframe with hierarchy, not decoration.
- Put the core product action in the first viewport.
- Remove copy that explains how the app works if the interaction itself can communicate it.
- Test the wireframe with supporting copy hidden. State, object, and action should still be legible.

## Phase 7: High-Fidelity Screen Plan

Before code, define the concrete visual system for the first slice.

Required output:

```txt
Palette:
Typography scale:
Spacing scale:
Primary component shapes:
Surface rules:
Button hierarchy:
State colors:
Example screen composition:
```

This becomes the implementation brief for the frontend agent.

## Phase 8: Implementation

Implementation rules:

- Build shared tokens first.
- Build only components required by the current vertical slice.
- Do not invent visual rules inside individual screens.
- If a screen needs a new pattern, add it to the design system spec.
- Use production data shapes, not fake decorative content.
- Preserve the approved composition model when translating to code; do not replace object structure with explanatory copy.

## Phase 9: Design QA

Run design QA after implementation.

Required checks:

- Compare against the chosen visual territory.
- Compare against the composition model.
- Compare against wireframe hierarchy.
- Check the three-second visibility test.
- Check whether the UI still works when helper copy is hidden.
- Check mobile and desktop viewports if relevant.
- Check text wrapping and button sizing.
- Check empty, loading, error, and approved states.
- Record design gaps as todos, not vague impressions.

Use `docs/design-qa-checklist.md`.

## Stop Rule

If a user says the design feels wrong, do not only tweak colors.

Return to:

1. Reference scan.
2. Visual territories.
3. Direction decision.
4. Composition model.
5. Wireframe plan.

Most design failures come from skipping direction selection, not from a single bad token.
