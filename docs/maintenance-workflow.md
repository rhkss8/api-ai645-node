# Maintenance Workflow

## Purpose

Use this workflow for bug fixes, regressions, refactors, and user-requested corrections after the MVP already exists.

Maintenance work is different from starter work:

- Starter work creates or expands the MVP.
- Maintenance work preserves existing behavior, changes only the requested surface, and proves the fix.

## Required Flow

1. Restate the requested outcome.
2. Read the relevant code, tests, docs, and current git diff.
3. Reproduce or explain the current behavior from evidence.
4. Identify the root cause before editing.
5. Choose the smallest safe fix.
6. Add or update a regression check when practical.
7. Run `tars verify`.
8. Report exactly what changed, what passed, what was not checked, and what risk remains.

## Modes

Default Mode: `tars maintain`

- Use for narrow UI, copy, routing, small backend logic, blog/content, and low-risk maintenance.
- Read current git status, directly related files, and the smallest relevant docs.
- Prefer targeted lint/build checks over broad verification when the repo has known unrelated debt.

Hard Mode: `tars maintain --hard`

- Use for admin, auth, payment, OpenAPI, schema/data, deployment, automations, privacy-sensitive data, cost-bearing services, or production-risk work.
- Read current git status, related backend and frontend contracts, decision gates, relevant docs, and previous lessons.
- Stop for owner approval before destructive commands, production-like data changes, generated-client replacement, commits, pushes, deploys, broad rewrites, or ambiguous product decisions.

## Root Cause Rule

Do not modify code until you can state:

- What is wrong.
- Where it starts.
- Why the requested change fixes that cause.
- What existing behavior must not change.

## Scope Rule

Allowed:

- Local bug fixes.
- Small refactors needed to make the fix clear.
- Regression tests or targeted checks.
- Documentation updates when a reusable lesson emerges.

Not allowed unless the user asks:

- New product direction.
- UI redesign.
- Large architecture rewrite.
- Unrelated cleanup.
- Broad dependency churn.

## Completion Rule

Completion requires evidence:

- `tars verify` passed, or failed checks are reported with cause and next action.
- The final response names changed files and verification.
- Any skipped checks are explicitly listed.
