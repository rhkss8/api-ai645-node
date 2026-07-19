---
name: tars-deep-thinking
description: Use before product planning, system design, UX direction, large implementation, or ambiguous TARS todos. Expands the problem space before editing so Codex does not solve only the surface request or drift into unrelated work.
---

# TARS Deep Thinking

Use this skill before planning, design, large implementation, and ambiguous todo work.

The goal is to think deeply enough to choose the right work, then shrink it into the smallest useful execution slice.

## When To Use

Use this skill when:

- The request affects product direction, UX direction, architecture, core loop, data model, AI behavior, or release quality.
- The todo is broad, vague, or easy to interpret in multiple ways.
- The user says the work feels shallow, off-track, or not aligned with intent.
- You are tempted to start coding before the desired behavior is clear.

Do not use this skill for narrow maintenance that already has a clear expected behavior. Use `tars-maintenance` instead.

## Do Not Edit Yet

Before editing code, produce a short thinking pass:

1. Restate the problem and desired outcome.
2. Identify the current evidence: user request, todo, docs, code, tests, designs, wiki only if relevant.
3. Run the question cascade.
4. Draw a text concept map.
5. Compare options.
6. Identify decision gates and excluded work.
7. Convert the chosen direction into the smallest vertical slice.

If the thinking pass reveals a product-visible ambiguity, stop and ask the user before editing.

## Question Cascade

Ask "why/what must be true/what could go wrong" until the real shape is clear.

Minimum prompts:

- What is the user really trying to change or learn?
- Which core-loop step does this affect?
- What current behavior or assumption makes this necessary?
- What would count as a correct result?
- What would be an attractive but wrong expansion?
- What evidence would prove the fix or implementation worked?

## Concept Map

Use a compact text map, not a long report.

Include only relevant nodes:

- User state.
- Product goal.
- Current system behavior.
- Desired system behavior.
- Data/model state.
- UI or interaction state.
- Tests and verification.
- Risks and decision gates.

## Option Comparison

Compare at least two viable options before recommending one.

For each option, list:

- What changes.
- Why it fits or does not fit the request.
- Cost/risk.
- Verification path.

Prefer the option that preserves intent, reduces future mistakes, and is smallest enough to verify.

## Exclusion List

Name what you will not do.

Common exclusions:

- Broad redesign.
- New feature outside the todo.
- Large refactor without evidence.
- Extra report artifacts.
- Reading the wiki when the task is pure maintenance.
- Changing product direction without approval.

## Handoff To Execution

End with:

- Recommended option.
- Files likely to inspect or edit.
- Tests or checks to run.
- User decisions needed, if any.

After this, execute only if the path is clear or the user has approved the decision.
