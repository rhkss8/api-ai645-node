# Design Review Rubric

## Purpose

Use this rubric when reviewing a generated UI.

The goal is to make design feedback specific enough to turn into implementation tasks.

## Scoring

Score each area from 1 to 5.

- 1: Fails the product direction.
- 2: Understandable but generic.
- 3: Acceptable MVP quality.
- 4: Strong and coherent.
- 5: Distinctive, polished, and clearly on-strategy.

## Review Areas

### 1. Product Fit

Questions:

- Does the screen express the product promise?
- Does it feel built for this persona?
- Does it avoid the wrong product category?

Score:

```txt
Product fit:
Evidence:
Fix:
```

### 2. Information Architecture

Questions:

- Is the first viewport clear?
- Is the primary action obvious?
- Is hierarchy visible without reading every line?
- Can the user identify current state, primary object, and next action within three seconds?

Score:

```txt
Information architecture:
Evidence:
Fix:
```

### 3. Interaction Quality

Questions:

- Does the user know what happens next?
- Are review, approval, undo, and error states clear?
- Does the flow preserve context?
- Are important generated, selected, or editable things shown as clear objects rather than loose text?

Score:

```txt
Interaction quality:
Evidence:
Fix:
```

### 4. Visual System

Questions:

- Are color, type, spacing, and shape coherent?
- Does the UI avoid one-note palettes?
- Are repeated components consistent?

Score:

```txt
Visual system:
Evidence:
Fix:
```

### 5. Craft

Questions:

- Does text wrap cleanly?
- Are controls sized well?
- Is spacing deliberate?
- Does the screen feel finished rather than scaffolded?
- Are alignment, rhythm, and visual weight strong enough to avoid an old form/list/card-stack feel?

Score:

```txt
Craft:
Evidence:
Fix:
```

### 6. Distinctiveness

Questions:

- Could this be mistaken for a generic template?
- Is there a memorable design move tied to the product?
- Is the signature interaction visually owned?

Score:

```txt
Distinctiveness:
Evidence:
Fix:
```

### 7. Visibility and Scanability

Questions:

- What is visible before reading body copy?
- Does the screen communicate state, priority, and action through structure?
- Is the interface over-dependent on helper text?
- Are repeated text blocks replaced with useful objects, states, progress, comparison, or controls?

Score:

```txt
Visibility and scanability:
Evidence:
Fix:
```

### 8. Composition Modernity

Questions:

- Does the layout avoid title, paragraph, card-stack defaults?
- Does it avoid generic chatbot, dashboard, or form patterns when those are not the core product?
- Does the screen use space to guide action instead of merely filling sections?
- Does the responsive layout preserve hierarchy instead of stretching mobile UI awkwardly?

Score:

```txt
Composition modernity:
Evidence:
Fix:
```

## Design Review Output

Every design review should end with:

```txt
Overall score:
Must fix before MVP:
Should improve next:
Do not change:
Decision:
```

Decision options:

- Ship.
- Ship with follow-up.
- Revise before implementation.
- Return to visual territories.
