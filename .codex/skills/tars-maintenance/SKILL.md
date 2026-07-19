---
name: tars-maintenance
description: Use for maintenance, bug fixes, regressions, refactors, and user-requested corrections in a TARS project. Follow this before editing existing behavior so fixes stay scoped, root-caused, verified, and honest about residual risk.
---

# TARS Maintenance

Use this skill for existing-project maintenance. The goal is not to create a new MVP direction; it is to preserve intended behavior while making the smallest correct fix.

## First Read

Use the smallest read set that fits the requested risk level.

### Default: `tars maintain`

Use this for narrow bugs, small UI corrections, simple regressions, and low-risk refactors.

1. Current git diff/status.
2. Directly relevant code and tests.
3. Direct source of truth only when the request names one, such as a specific Figma Make screen.
4. `docs/maintenance-workflow.md` only if the maintenance procedure is unclear.

### Hard: `tars maintain --hard`

Use this for production-facing fixes, release gates, visual parity, user-flow changes, broad regressions, or anything likely to affect tester distribution.

1. `docs/maintenance-workflow.md`
2. `docs/lessons-quick.md`
3. `docs/agent-runbook.md`
4. The task-relevant document from `docs/skills-and-agents.md`
5. `docs/decision-gates.md`
6. Product/design/QA docs that match the surface being changed.

## Maintenance Loop

1. Restate the user's intended outcome in one or two sentences.
2. Inspect current behavior before editing: read relevant code, tests, docs, and current git diff.
3. Identify the root cause. Do not patch symptoms you cannot explain.
4. Keep scope tight. Do not add redesigns, new features, broad refactors, or unrelated cleanup.
5. Make the smallest fix that preserves existing behavior outside the requested change.
6. Add or update a regression check when the bug can realistically recur.
7. Run `tars verify` before claiming completion.
8. Report changed files, verification results, skipped checks with reasons, and remaining risk.

In default mode, keep the loop concise and avoid loading broad project context unless the evidence demands it.

In hard mode, prefer extra evidence: visual QA, parity map updates, manual QA notes, `tars done`, and commit-hook verification when appropriate.

## Stop Rules

Stop and ask the user before editing when:

- The user request, docs, and code imply different desired behavior.
- A visible product, data, cost, privacy, or release decision is ambiguous.
- The fix would require a broad rewrite instead of a local repair.
- Verification needs credentials, external services, or destructive commands.

## Anti-Patterns

- Do not say "done" without executed verification or a clear reason verification was not possible.
- Do not rewrite a working flow to match a guessed architecture preference.
- Do not hide failed checks.
- Do not create extra process artifacts unless the user asks for them.
