# TARS Task Router

## Purpose

Use this router before starting work in any environment: Codex, another agent, an IDE assistant, CI, or a human-only session.

The source of truth is this document plus the referenced docs. Codex skills are optional accelerators, not the only way to run TARS.

## Start Here

1. Read the user request and current git status.
2. Classify the work by primary task type.
3. Read only the required source set for that task type.
4. Check decision gates before user-visible, costly, destructive, privacy-sensitive, deployment, or broad-scope changes.
5. Implement the smallest complete slice.
6. Run the verification path for the task type.
7. Update decision, lesson, todo, or QA docs only when the work changes durable project knowledge.

## Universal Baseline

Read these for most project work:

- `docs/agent-runbook.md`
- `docs/lessons-quick.md`
- `docs/mvp-todo.md`
- `docs/decision-gates.md`

For narrow maintenance, current code, tests, and the user request can take priority over broad docs.

## Task Routing

| Task Type                              | Trigger                                                           | Required Docs                                                                                                                                                                                                  | Optional Codex Skill                           | Verification                                                 |
| -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| Product scope and MVP priority         | Scope, roadmap, core loop, user flow                              | `docs/mvp-execution-harness.md`, `docs/mvp-todo.md`, `docs/service-definition.md`                                                                                                                              | Future `tars-product`                          | Decision log if product direction changes                    |
| Deep planning or ambiguous work        | Large implementation, UX direction, architecture, unclear request | `.codex/skills/tars-deep-thinking/SKILL.md`, `docs/deep-thinking-workflow.md`, `docs/decision-gates.md`                                                                                                        | `tars-deep-thinking`                           | Options compared before implementation                       |
| Maintenance and corrections            | Bug, regression, user-requested fix, refactor                     | `.codex/skills/tars-maintenance/SKILL.md`, `docs/maintenance-workflow.md` when procedure matters                                                                                                               | `tars-maintenance`                             | Root cause, scoped fix, `tars verify`                        |
| UI, UX, copy, or visual design         | Screen, component, copy, layout, interaction pattern              | `docs/harness/ui-ux-component-rules.md`, `docs/design-production-pipeline.md`, `docs/design-system-spec.md`, `docs/interaction-principles.md`, `docs/design-tone-and-manner.md`, `docs/design-qa-checklist.md` | Future `tars-ui-ux`                            | Component grammar check plus visual/manual QA when practical |
| Figma Make parity                      | Screen listed in parity map, icon/header/card parity              | `docs/figma-make-parity-map.md`, `docs/design-reference-brief.md`, `docs/design-qa-checklist.md`                                                                                                               | `figma:*` skills when using Figma tools        | Screenshot or parity note                                    |
| Frontend implementation                | React Native code, hooks, components, state, routing              | `docs/frontend-engineering-standards.md`, task-relevant product/design docs                                                                                                                                    | Future `tars-frontend`                         | Typecheck, lint, tests                                       |
| AI behavior                            | Prompt, schema, fixtures, AI plan generation/adjustment           | `docs/ai-contracts.md`, `docs/plan-recommendation-algorithm.md`, task-relevant tests                                                                                                                           | Future `tars-ai-planner`                       | Contract tests and fixture/regression tests                  |
| Analytics and QA                       | Events, release gates, tester reports, QA evidence                | `docs/analytics-events.md`, `docs/qa-checklist.md`, `docs/tester-cohort-recruitment.md`                                                                                                                        | Future `tars-qa-analytics`                     | Test or manual QA report update                              |
| Expo, builds, native delivery          | Expo run loop, SDK, dev client, EAS, TestFlight, network          | `.codex/skills/expo-mvp-delivery/SKILL.md`                                                                                                                                                                     | `expo-mvp-delivery` and official Expo skills   | Local build/run check; ask before external deployment        |
| Re-entry and handoff                   | Context reset, new machine, long break                            | `docs/reentry-protocol.md`, `docs/workstation-handoff.md`                                                                                                                                                      | None required                                  | Reconstruct status before edits                              |
| New service starter or harness changes | TARS itself, starter docs, reusable protocol                      | `docs/new-service-starter-protocol.md`, `docs/new-service-copy-pack.md`, `docs/starter-acceptance.md`                                                                                                          | `tars-deep-thinking` for design of the harness | `tars doctor`, `tars acceptance`, `py_compile tars`          |

## Source Priority

When sources conflict:

1. User's latest explicit instruction.
2. Current code and tests for existing behavior.
3. Direct design/source artifact named by the task.
4. Decision log and lessons.
5. Harness docs.
6. Wiki/source research.

If the conflict affects user-visible behavior, product direction, data, cost, deployment, privacy, or release quality, stop and ask.

## Non-Codex Use

If Codex skills are unavailable:

- Follow the "Required Docs" column directly.
- Treat optional skills as labels for the reasoning mode, not required tooling.
- Use `tars loop --print`, `tars think`, `tars maintain`, and `tars doctor` as plain CLI prompts when available.
- If the CLI is unavailable, read this document and the required docs manually.
