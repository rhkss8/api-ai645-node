# Visual Composition Rules

## Purpose

This file turns UI quality principles into concrete layout rules for wireframes, high-fidelity design, and implementation.

Use it to prevent old-looking screens, weak hierarchy, text-heavy interfaces, and layouts that only work by accident.

## Required Composition Passes

Every important screen must pass these checks before implementation.

### 1. First Viewport Pass

The first viewport must contain:

- Current state.
- Primary object or task.
- Primary action.
- One signal of progress, risk, review, or completion when relevant.

Avoid:

- Intro copy that pushes the product object below the fold.
- Empty decorative hero areas inside app workflows.
- Multiple competing CTAs.
- A header that only repeats the product name.

### 2. Visual Weight Pass

Rank every visible element as:

```txt
1. Must notice.
2. Useful to scan.
3. Available if needed.
4. Secondary or background.
```

Rules:

- Level 1 should be visually distinct through size, placement, contrast, or containment.
- Level 2 elements should support comparison or scanning.
- Level 3 elements should not compete with the primary action.
- Remove or defer level 4 elements if the screen feels busy.

### 3. Object and State Pass

For each important object, define:

```txt
Object:
State:
Primary action:
Secondary action:
Metadata:
Empty state:
Error or blocked state:
```

Rules:

- Do not show important data as loose text if it should be an object.
- Do not show an object without a visible state when state affects what the user should do.
- For AI-generated changes, show affected fields, confidence or uncertainty when relevant, and the approval action near the change.

### 4. Text Budget Pass

Set a text budget before writing copy.

Default limits:

- Screen title: one line.
- Section intro: avoid unless the section is ambiguous without it.
- Helper copy: one short sentence.
- Card body: two short lines unless the card is a reading surface.
- Button label: action verb plus object when possible.

Rules:

- If a layout needs repeated helper copy, the layout is probably unclear.
- Replace repeated prose with state labels, icons, progress, structured rows, or before/after comparison.
- Do not explain all features on screen. Make the current task obvious.

### 5. Rhythm and Alignment Pass

Rules:

- Use a small spacing scale and repeat it deliberately.
- Align related text, controls, and metadata to stable columns or edges.
- Keep tap targets stable when text changes.
- Avoid mixed card widths unless the difference communicates hierarchy.
- Avoid nested cards. Use sections, rows, dividers, or grouped objects instead.
- Keep dense tools compact; keep consumer flows warm without becoming decorative.

## Mobile Rules

- Put the primary task in the first viewport.
- Keep bottom actions tied to the current screen or selected object.
- Avoid long vertical stacks of same-weight cards.
- Use horizontal space for metadata only when it remains readable on small screens.
- Test the longest realistic labels, not ideal short labels.

## Desktop Rules

- Use extra width for comparison, context, or persistent actions.
- Do not stretch mobile cards into oversized desktop panels.
- Avoid empty sidebars or decorative columns.
- Keep reading width bounded for prose-heavy surfaces.
- Use split layouts only when both sides remain active or informative.

## Anti-Patterns

Avoid:

- Title, paragraph, card stack.
- Dashboard grid without a clear decision or workflow.
- Generic chatbot shell for a structured product.
- Repeated card components where a list, table, board, or timeline would scan better.
- Large empty cards used as section wrappers.
- Status conveyed only by color.
- Copy-heavy onboarding that could be replaced by progressive interaction.
- Placeholder visual polish that does not clarify state or action.

## Composition Output

For each primary screen, record:

```txt
First viewport promise:
Primary object:
Primary action:
Visual weight order:
Objects and states:
Text budget:
Layout anti-patterns avoided:
Responsive risks:
```
