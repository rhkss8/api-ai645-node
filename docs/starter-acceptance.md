# Starter Acceptance

## Purpose

Use this checklist when changing TARS itself or copying the starter kit into a new service.

It is a lightweight validation layer, not a report template.

## Acceptance Layers

### 1. Structure

- `tars` exists and is executable.
- Required `docs/` files exist.
- `.codex/skills/tars-maintenance/SKILL.md` exists.
- `.codex/skills/tars-deep-thinking/SKILL.md` exists.
- `docs/deep-thinking-workflow.md` exists.
- `docs/inbox/` and `docs/wiki/` exist.
- `docs/wiki/schema.md` and `docs/wiki/index.md` exist.
- `package.json` has `typecheck`, `lint`, `test`, and `format:check`.

### 2. Smoke

- `tars --help` prints successfully.
- `tars doctor` passes.
- `tars next` handles both open and empty todo states.
- `tars wiki` handles an empty inbox without failing.
- Python compilation of `tars` succeeds.

### 3. Function

- `tars start` produces a new-service prompt.
- `tars maintain` points to the maintenance skill and workflow.
- `tars maintain --hard` points to the operating/release-grade maintenance workflow.
- `tars think` points to the deep thinking skill and workflow.
- `tars loop` briefs open todos and asks for confirmation.
- `tars verify` runs the project checks.

### 4. Safety

- `docs/decision-gates.md` requires user approval for account, cost, deployment, sensitive data, external distribution, destructive, or broad-scope decisions.
- Narrow maintenance prioritizes current code, tests, and user request over wiki synthesis.
- Hard maintenance requires broader evidence for production-facing, release, visual parity, or core-flow changes.
- Deep thinking compares options and excludes off-scope work before large or ambiguous implementation.
- Wiki is optional and not read for every task.
- Failed verification blocks completion claims.

## Rule

If a TARS change fails this checklist, fix the harness before using it to drive product work.
