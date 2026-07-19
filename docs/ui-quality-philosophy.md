# UI Quality Philosophy

## Purpose

This file defines what "good UI" means before visual styling begins.

Good UI is not the same as attractive decoration. Good UI makes the product's state, priority, and next action visible with structure before it asks the user to read.

## Core Belief

The interface should reveal the product's thinking.

If the user must read several sentences before they know what changed, what matters, or what to do next, the UI is relying on copy to compensate for weak structure.

## Quality Principles

### 1. Visibility Before Explanation

The first screenful should make these clear within three seconds:

- What state the user is in.
- Which object matters most.
- What action is available next.
- Whether anything needs review, attention, or approval.

Rules:

- Use position, size, contrast, state, progress, grouping, and iconography before adding explanatory text.
- Do not use long helper copy to explain a layout that could be clearer.
- If a primary action needs more than one short sentence of explanation, redesign the surrounding object or flow.
- Do not bury the product promise inside a paragraph.

### 2. Object First, Text Second

Users should interact with clear objects, not loose text blocks.

Examples of product objects:

- Plan item.
- Approval card.
- Uploaded document.
- Schedule slot.
- Task.
- Recommendation.
- Budget category.
- Message draft.
- Revision patch.

Rules:

- Give each important object a state, owner, primary action, and visual boundary.
- Use labels and metadata to clarify an object; do not make paragraphs carry the whole interaction.
- For AI products, show generated output as reviewable objects when it can change user data.
- Avoid full-screen chat or transcript layouts unless conversation is the product's main object.

### 3. Scannable Hierarchy

Good screens can be scanned before they are read.

Rules:

- The most important element should be visually dominant without needing an instruction.
- Similar elements should share structure; different priorities should look different.
- Avoid four or more same-weight text blocks in a row.
- Do not make every section a card. Use cards for repeated objects, review surfaces, and contained tools.
- Prefer structured summaries, counters, progress, before/after views, and status chips over repeated explanatory prose.

### 4. Action Clarity

The user should know what will happen before pressing a control.

Rules:

- Button labels should name the actual action, not a vague command.
- Destructive, approving, publishing, sending, or persisting actions need clear review context.
- Secondary actions should be visually available without competing with the primary action.
- Disabled states must explain recoverability through nearby structure or concise copy.

### 5. Modern Composition

Avoid layouts that feel like old forms, static brochures, or generated templates.

Warning signs:

- A large heading, a paragraph, and a stack of cards with no interaction state.
- Repeated title/body/button blocks.
- Dashboard grids for products whose promise is a guided flow.
- Marketing hero composition inside an app workflow.
- Empty decorative panels that do not carry product meaning.
- Excessive badges, pills, or labels that do not change user understanding.

Better patterns:

- State-led boards.
- Reviewable change cards.
- Progressive disclosure.
- Before/after comparison.
- Action bars tied to the selected object.
- Compact status summaries with direct manipulation.

## Text Dependence Check

Before implementation, remove or hide all supporting copy in the design draft.

The screen should still communicate:

- Current state.
- Primary object.
- Next action.
- Completion, risk, or review status.

If the screen collapses without helper text, improve the composition before adding copy back.

## Done Criteria

A UI direction is strong enough to implement when:

- The first viewport passes the three-second visibility test.
- The primary object is visually obvious.
- The primary action is visible and specific.
- The screen uses structure and state rather than paragraphs to explain itself.
- Important AI, automation, or destructive output is reviewable as an object before it mutates user data.
