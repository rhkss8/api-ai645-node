# How TARS Works

## Purpose

This file explains the operating model behind the starter kit.

For the actual first-use guide, read [README.md](README.md).

## Operating Model

TARS separates three concerns:

- CLI: gives commands, gathers kickoff inputs, prints prompts, and points to the next todo.
- Docs: store durable project memory and execution rules.
- Codex: discusses, implements, tests, and updates the docs as the project evolves.

## What To Copy

Copy this folder's `docs/` directory, `tars` launcher, `start` wrapper, `activate`, and `scripts/install-tars.zsh` into a new project.

Run the CLI with no arguments to see available commands:

```bash
./tars
```

Optional: activate project-local commands for the current terminal session:

```bash
source ./activate
tars
tars init
```

Install `tars` so it works from any terminal:

```bash
zsh scripts/install-tars.zsh
source ~/.zshrc
tars
```

Start a new project:

```bash
tars init
```

It will ask for the service definition, persona, core pain, and desired transformation, then write the project docs.

If the service definition already exists, use:

```bash
tars start
tars status
tars next
```

The generated kickoff prompt is:

```txt
이 프로젝트는 신규 서비스 MVP야.
docs/new-service-starter-protocol.md와 docs/agent-runbook.md를 기준으로 시작해줘.

서비스 정의:
[한 줄 정의]

페르소나:
[타겟 유저]

핵심 pain:
[사용자가 겪는 문제]

원하는 변화:
[before -> after]

먼저 브레인스토밍으로 기획을 정리하고,
G-Stack, Superpowers, MVP todo, 디자인 레퍼런스, 시각 방향 2-3안, 방향 선택, 와이어프레임 계획, 디자인 시스템, 서비스 디자인, 디자인 리뷰/QA, 개발 하네스, AI/QA/analytics 기준을 만든 뒤,
중요 의사결정 지점은 물어보고,
그 외에는 MVP core loop가 끝날 때까지 계속 진행해줘.
```

## What This Kit Provides

- Product brainstorming structure.
- G-Stack.
- Superpowers.
- MVP todo loop.
- Decision gates.
- Lesson-and-run memory.
- Senior frontend standards.
- Design production pipeline.
- Design reference brief.
- Design philosophy template.
- Interaction principles template.
- Design system template.
- Service design blueprint.
- Design review rubric.
- Design tone and copy template.
- Design QA checklist.
- AI contract template.
- Analytics and QA templates.
- Local agent operating model.

## Local Only

This is not a global Codex skill.

Keep it as a project-local copy pack. Update it when repeated lessons prove useful across projects.

## Folder Structure

```txt
starter-kit/new-service/
  README.md
  HOW_IT_WORKS.md
  tars
  start
  activate
  scripts/
    install-tars.zsh
  docs/
    new-service-starter-protocol.md
    service-definition.md
    g-stack.md
    superpowers.md
    mvp-execution-harness.md
    mvp-todo.md
    design-production-pipeline.md
    design-reference-brief.md
    design-philosophy.md
    interaction-principles.md
    design-system-spec.md
    service-design-blueprint.md
    design-review-rubric.md
    design-qa-checklist.md
    design-tone-and-manner.md
    frontend-engineering-standards.md
    ai-contracts.md
    analytics-events.md
    qa-checklist.md
    decision-gates.md
    decision-log.md
    lessons-and-rules.md
    skills-and-agents.md
    agent-runbook.md
```

## Day-To-Day Relationship

Use TARS for orientation:

```bash
tars status
tars next
tars start
tars done
tars handoff
```

Use Codex for execution:

```txt
tars 기준으로 다음 todo 진행해줘.
```

Codex should then read `docs/agent-runbook.md`, pick the next todo, implement it, run checks, and update decisions or lessons.

At the end of each slice, run:

```bash
tars done
git add .
git commit -m "Complete current TARS slice"
```

## Multi-PC Continuity

When switching between PCs, TARS does not sync files by itself. Git does that.

TARS provides the handoff checklist:

```bash
tars handoff
```

The rule is simple:

- Push before leaving one PC.
- Pull before starting on another PC.
- Run `tars doctor`, `tars status`, and `tars next`.
- Ask Codex to continue from the next todo.
