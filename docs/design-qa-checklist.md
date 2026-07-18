# Design QA Checklist

## Purpose

Use this checklist before marking a UI slice complete.

Design QA is not only visual polish. It checks whether the product strategy, interaction model, visual system, and service journey are visible in the actual experience.

## Strategy Fit

- The screen supports the service's core promise.
- The user's next step is obvious.
- The primary action maps to the MVP core loop.
- The screen avoids non-MVP distractions.
- The copy reinforces the desired user transformation.

## Interaction Quality

- The flow has a clear start, review point, and completion state.
- Generated or high-impact outputs are reviewable before persistence.
- Error states explain what happened and what to do next.
- Back, cancel, dismiss, and retry behaviors are predictable.
- Empty states are useful, not decorative.

## Visual Quality

- Hierarchy is clear within three seconds.
- Text sizes match the density of the surface.
- Spacing is consistent with the documented scale.
- Touch targets are large enough for mobile when mobile applies.
- Cards are used for repeated items or review surfaces, not every page section.
- Color communicates state and hierarchy.
- The interface does not read as a generic template.

## Component Consistency

- Primary, secondary, and destructive actions are distinct.
- Similar actions use the same component.
- Similar data uses the same layout pattern.
- Loading, disabled, selected, and error states are defined.
- Repeated items have stable dimensions and do not shift unexpectedly.

## Copy and Tone

- Copy is specific to the product domain.
- Copy avoids blame, fear, or pressure unless explicitly part of the brand.
- Buttons use clear action verbs.
- Labels describe user intent, not implementation details.
- There is no instructional wall of text inside the app.

## Accessibility and Responsiveness

- Text does not overlap or clip at common mobile and desktop widths.
- Color is not the only signal for important state.
- Inputs have labels or clear accessible names.
- Buttons are reachable and distinguishable.
- Keyboard and screen-reader paths are considered for web products.

## AI Product Checks

Use when AI is part of the product:

- AI output is structured enough for the UI to trust.
- AI explanation is visually separate from AI action.
- User approval is required before important changes.
- The user can correct or reject AI output.
- Uncertain AI output asks a question or offers a fallback.

## Done Criteria

A UI slice is design-complete when:

- It passes this checklist.
- It passes the functional QA checklist.
- It matches `docs/design-philosophy.md`.
- It uses `docs/design-system-spec.md` rules.
- Any new reusable design rule is added to `docs/lessons-and-rules.md`.
