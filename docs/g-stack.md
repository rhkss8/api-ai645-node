# G-Stack

## G1. Goal Stack

### MVP Goal

`[What must the MVP prove?]`

### Core Loop

`[Step 1] -> [Step 2] -> [Step 3] -> [Outcome]`

### Primary Metric

`[The one metric that best proves the MVP.]`

### Secondary Metrics

- `[Metric]`
- `[Metric]`
- `[Metric]`

### Non-Goals

- `[Explicitly excluded feature or direction]`
- `[Explicitly excluded feature or direction]`

## G2. Growth Stack

### First 10 Users

`[Who can be recruited quickly for high-quality feedback?]`

### First 50 Users

`[Who should test the MVP after the first 10?]`

### Acquisition Channel

`[How will the first users be reached?]`

### Feedback Channel

`[How will feedback be collected?]`

### Retention Hypothesis

`[Why would users return?]`

## G3. Governance Stack

### Scope Guardrails

Build only what moves the core loop forward.

### Decision Log

Use `docs/decision-log.md`.

### Definition of Done

Use `docs/mvp-execution-harness.md`.

### Stop Conditions

Use `docs/agent-runbook.md`.

### Release Gates

Use `docs/qa-checklist.md`.

## G4. Ground Truth Stack

### Analytics Events

Use `docs/analytics-events.md`.

### User State Model

`[New] -> [Activated] -> [Core action] -> [Return]`

### Dashboard Questions

- `[Question the MVP data must answer]`
- `[Question the MVP data must answer]`

### QA Checklist

Use `docs/qa-checklist.md`.

### Manual Observation Plan

Watch at least 5 target users complete the core loop.

## G5. Generation Stack

### AI Functions

- `[Function name if AI is part of product]`

### JSON Contracts

Use `docs/ai-contracts.md` if AI is part of the product.

### Prompt Fixtures

Use `tests/fixtures` once the test harness exists.

### Regression Checks

Every prompt change must run fixture tests.

### Fallback Behavior

Invalid AI output must not mutate user data.
