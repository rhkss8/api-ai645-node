# Interaction Principles

## Purpose

Interaction design defines what the user can do, what the system does in response, and how the user stays in control.

## Core Interaction Loop

Every service must define the loop in plain language:

```txt
User intent -> system response -> user review or action -> persisted outcome -> next useful state
```

Examples:

- Ask for a plan -> receive structured suggestion -> approve -> plan updates -> continue today.
- Upload a document -> receive extracted tasks -> review -> assign -> track completion.
- Enter a lead -> receive qualification -> accept or edit -> create follow-up -> monitor result.

## Signature Interaction

The signature interaction is the one moment that makes the product different.

Define:

- Trigger: what starts it?
- Input: what does the user provide?
- System response: what does the product generate or change?
- Review point: what can the user inspect?
- Commitment: what action persists the result?
- Recovery: how can the user undo, revise, or continue?

Rule:

The first usable version of the product should make the signature interaction obvious.

## User Control Rules

Use review and confirmation when:

- AI changes user plans, records, money, messages, schedules, or shared data.
- The user may need to edit generated output.
- The action affects another person or external system.
- The action is hard to undo.

Avoid confirmation when:

- The action is local, reversible, and low risk.
- Confirmation adds friction without increasing trust.

## AI Interaction Rules

If AI is part of the product:

- AI should return structured outputs when the UI must act on them.
- The UI should distinguish explanation from action.
- The user should approve or edit high-impact AI output.
- The system should handle uncertainty with questions, not fake confidence.
- Do not make the product feel like a generic chatbot unless conversation is the core product.

## Navigation and History

Define:

- Main entry screen.
- Back behavior.
- Deep links or routes if web is used.
- Saved draft behavior.
- Return path after approval or completion.

Rule:

Boolean screen switching is acceptable for the first spike, but MVP should define predictable route history before release.

## Error and Recovery

Every core flow should define:

- Empty input state.
- Invalid input state.
- Loading state.
- AI or API failure state.
- Partial success state.
- Retry path.
- Manual fallback path.

Good recovery copy:

- Says what happened.
- Says what the user can do next.
- Avoids blame.

## Interaction QA Checklist

- Can the user understand the next action without reading instructions?
- Is the primary action visible and specific?
- Can the user review generated or high-impact output?
- Can the user recover from a wrong input or bad suggestion?
- Does the flow preserve context after navigation?
- Does the UI avoid trapping the user in a dead end?
- Are system-generated changes clearly distinguishable from user-entered content?
