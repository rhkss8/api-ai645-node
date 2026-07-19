# Deep Thinking Workflow

Use this workflow before product planning, system design, UX direction, large implementation, or ambiguous TARS todo work.

It is not a report. It is a short thinking harness that prevents shallow fixes, surface-only implementation, and accidental scope drift.

## Trigger

Run `tars think` when:

- A todo is broad or ambiguous.
- The work changes product direction, UX direction, architecture, core loop, data model, AI behavior, or release quality.
- The user says the result is off-track, shallow, or missing the real intent.
- You are about to implement from a vague phrase instead of a clear behavior.

Skip this workflow for narrow maintenance with clear expected behavior. Use `tars maintain` or `tars maintain --hard`.

## Do Not Edit Yet

Before editing, stop and produce a compact thinking pass:

1. Problem restatement.
2. Success criteria.
3. Question Cascade.
4. Concept Map.
5. Option comparison.
6. Exclusion list.
7. Decision gates.
8. Smallest execution slice.

If the result exposes a user-visible ambiguity, ask before editing.

## Question Cascade

Ask enough follow-up questions internally to find the real problem shape:

- What is the user really asking to improve?
- Why does this matter now?
- Which core-loop step, user state, or system behavior is affected?
- What evidence already exists in docs, code, tests, design, or wiki?
- What would a correct result look like?
- What would be a plausible but wrong direction?
- What needs user approval before implementation?

Keep the answer short. The purpose is better execution, not a long essay.

## Concept Map

Represent the work as a small text mind map.

Suggested shape:

```text
Goal
- User state
- Current behavior
- Desired behavior
- Product/doc source
- System/code surface
- Risks
- Verification
```

Only include nodes that help the current decision.

## Option Comparison

Compare at least two options:

- Option A: smallest local change.
- Option B: stronger structural change.
- Option C: only if there is a meaningfully different product or UX path.

For each option, note:

- Fit to user intent.
- Implementation cost.
- Regression risk.
- Verification method.

Recommend one option and explain why in one or two sentences.

## Exclusion List

Explicitly exclude work that would cause drift:

- New features not requested.
- Broad redesign.
- Large refactor without evidence.
- Extra reports or process artifacts.
- Wiki reading when current code, tests, and user request are enough.
- Product direction changes without approval.

## Decision Gates

Use `docs/decision-gates.md`.

Ask the user before proceeding when the choice affects:

- User-visible product behavior.
- Core loop.
- UX direction or visual identity.
- Data, privacy, accounts, cost, external services, release, or destructive actions.

## Handoff

End the thinking pass with:

- Recommended option.
- Exact first implementation slice.
- Files to inspect or edit.
- Checks to run.
- Decisions needed before coding.

Then implement only the chosen slice.
