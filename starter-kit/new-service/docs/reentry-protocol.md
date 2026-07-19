# Re-Entry Protocol

## Purpose

Use this when resuming after a context reset, moving between machines, returning after a break, or continuing a long-running TARS loop.

Do not restart from scratch. Reconstruct state from files.

## Steps

1. Run `git status --short`.
2. Run `tars doctor`.
3. Run `tars status`.
4. Run `tars next`.
5. Read `docs/lessons-quick.md`.
6. Read `docs/agent-runbook.md`.
7. Read the task-relevant workflow:
   - New MVP or feature expansion: `docs/mvp-execution-harness.md`
   - Maintenance or correction: `.codex/skills/tars-maintenance/SKILL.md` and `docs/maintenance-workflow.md`
   - Planning, design, architecture, large implementation, or ambiguous todo: `.codex/skills/tars-deep-thinking/SKILL.md` and `docs/deep-thinking-workflow.md`
   - Research or product intent: `docs/wiki/schema.md` and `docs/wiki/index.md`
8. Inspect current git diff before editing.
9. Continue the current todo or ask the user if the next action is ambiguous.

## Re-Entry Report

When resuming, briefly report:

- Current branch.
- Dirty or clean worktree.
- Next todo.
- Which workflow applies.
- Any blocker or decision gate.
