# Codex Operating System

This file defines the reusable AI work system for this product workspace.

## Layers

1. Global rules
   - Applies across every project.
   - Defines the owner/agent contract, reporting style, safety gates, and harness policy.

2. Product workspace rules
   - Applies to a product made of multiple repositories.
   - Defines repo paths, API contracts, cross-repo checks, and common workflows.

3. Repository rules
   - Lives in each repo as `AGENTS.md`.
   - Defines stack, commands, architecture, and verification for that repo.

4. Task prompt
   - The user's current request.
   - Defines the concrete goal, constraints, and acceptance criteria.

## Global Defaults

- User owns product direction, priority, approval, and risk decisions.
- Codex owns execution, code reading, implementation, verification, and concise reporting.
- Small work is handled directly.
- Large work may use sub-agents when parallelism reduces time or risk.
- Existing code patterns beat new abstractions.
- Risky operations require approval.
- Caveman is the default compression layer when the user asks for short/mobile/token-saving reports.

Risky operations include:

- Destructive database/schema/data changes
- Removing files or large generated directories
- Secret/env changes
- Dependency upgrades with broad impact
- Commits, pushes, pull requests, deploys
- Reverting user changes

## Harness Decision Matrix

Use one agent:

- Small bug
- One or two files
- Clear existing pattern
- No cross-repo contract risk

Use explorer + main:

- Unknown code path
- Need to find conventions
- Need impact analysis before editing

Use explorer + worker + reviewer:

- Cross-module change
- Backend and frontend contract change
- Auth, payment, session, or data consistency change
- Large refactor
- User-facing workflow change

Use specialized workers:

- Backend worker for API/use case/repository work
- Frontend worker for UI/state/API-client work
- QA reviewer for regression and verification planning
- Docs worker only when docs are an explicit deliverable

Use cavecrew when available:

- `cavecrew-investigator` for compressed code search and location.
- `cavecrew-builder` for small bounded edits with known files.
- `cavecrew-reviewer` for compressed bug-focused review.

Use normal sub-agents instead when output needs prose, architecture discussion, or broad refactor reasoning.

## Standard Work Loop

```text
Intake -> Context -> Plan -> Execute -> Verify -> Review -> Report -> Approval
```

Short form:

```text
Read. Split. Fix. Verify. Report. Ask before risk.
```

## Mobile-Friendly Reporting

Default update shape:

```text
한 일:
- ...

막힌 것:
- 없음 / ...

다음 액션:
- ...
```

For tiny tasks, one short paragraph is enough.

Caveman mode rules:

- Remove filler.
- Keep exact technical names, commands, paths, and errors.
- Prefer action/result/risk.
- Drop compression for security warnings, irreversible confirmations, or unclear ordered steps.

## Promotion To Hooks

Do not automate too early. Start with rules. Promote only repeated patterns to hooks.

Good hook candidates:

- Session start: show repo map and dirty git state.
- Task finish: summarize changed files and verification.
- Pre-commit: run focused tests/build and summarize diff.
- OpenAPI export: remind to regenerate frontend client.

Avoid hooks that mutate code, run destructive commands, or hide important approval points.

## Active Project Hooks

This workspace currently enables read-only hooks only:

- `SessionStart`: runs `.codex/hooks/session-start.sh`
  - prints backend/frontend repo paths, branches, dirty counts, and rules presence.
- `Stop`: runs `.codex/hooks/stop-summary.sh`
  - prints backend/frontend change counts and verification recommendations.

These hooks do not modify files, database state, dependencies, git state, or running services.
