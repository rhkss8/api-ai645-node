# AI645 Product Agent Rules

## Product Workspace

This repository is the backend for the AI645/ForFortune product.

- Backend: `/Users/rhkss/Desktop/projects/api-ai645-node`
- Frontend: `/Users/rhkss/Desktop/projects/ai645-front`
- Backend API: `http://localhost:3350`
- API docs: `http://localhost:3350/api-docs`
- Frontend API client source: `/Users/rhkss/Desktop/projects/ai645-front/src/services/openapis`
- Frontend API generation input: `/Users/rhkss/Desktop/projects/api-ai645-node/swagger.json`

Treat the backend and frontend as one product workspace. When backend API behavior changes, check frontend impact. When frontend API usage changes, check backend contract impact.

## Owner / Agent Contract

The user is the owner, PM, and final approver.

Codex is the lead execution agent:

- Read the relevant code before changing behavior.
- Prefer existing project patterns over new abstractions.
- Implement the requested change when the intent is clear.
- Run the smallest useful verification after edits.
- Keep reports short and decision-oriented.
- Ask before destructive operations, production-like data changes, commits, pushes, deploys, or broad rewrites.
- Never revert user changes unless explicitly requested.

## Report Style

Use concise Korean by default.

Use caveman-style reporting when the user asks for caveman mode, short reports, mobile-friendly updates, or token-saving work:

- Terse, concrete, action/result/risk only.
- Keep technical names exact.
- Do not compress warnings, destructive confirmations, or steps where ambiguity could cause damage.
- Return to normal prose when the user asks for explanation or says `normal mode`.

For substantial work, report in this shape:

```text
한 일:
- ...

막힌 것:
- 없음 / ...

다음 액션:
- ...
```

Avoid long narration unless the user asks for explanation.

## Harness Policy

Use sub-agents only when they materially help.

- Small task: Codex handles directly.
- Medium task: use an explorer if code structure is unclear.
- Large task: split into explorer, worker, and reviewer roles.
- Cross-repo task: inspect both backend and frontend contracts before implementation.
- If cavecrew skills are available, prefer them for compressed sub-agent work when the task is narrow enough.

Default role split:

- Orchestrator: Codex in the main thread. Owns decisions, integration, final verification, and reporting.
- Explorer: finds relevant code paths, existing patterns, and risk areas.
- Worker: implements a bounded change in a clearly owned file/module set.
- Reviewer: checks bugs, regressions, missing tests, and contract drift.

Do not use sub-agents for tiny one-file fixes or when the next step is blocked on their answer.

Cavecrew mapping:

- `cavecrew-investigator`: locate definitions, callers, routes, tests, or related files.
- `cavecrew-builder`: small bounded edit, usually one or two files with known scope.
- `cavecrew-reviewer`: compressed diff/file review for bugs and regressions.

## Backend Project Rules

Stack:

- Node.js 18+
- TypeScript
- Express
- Prisma
- PostgreSQL
- Jest
- Docker Compose for local services

Structure:

- `backend/src/entities`: domain entities
- `backend/src/usecases`: application use cases
- `backend/src/repositories`: repository contracts and implementations
- `backend/src/controllers`: HTTP controllers
- `backend/src/routes`: route wiring
- `backend/src/services`: external services and orchestration helpers
- `backend/src/prompts`: fortune prompt templates
- `backend/prisma`: Prisma schema and seed data

Common commands:

```bash
docker compose up -d
docker compose ps
docker compose logs -f backend
cd backend && npm run dev
cd backend && npm test
cd backend && npm run build
cd backend && npm run lint
cd backend && npm run openapi:export
```

Database rules:

- Ask before destructive schema/data operations.
- Ask before `prisma db push --accept-data-loss`, resetting volumes, or deleting rows.
- Prefer migrations or narrowly scoped scripts when data shape changes matter.

API / Frontend Contract Rules:

- If route shape, request body, response body, or auth behavior changes, update/export OpenAPI.
- After OpenAPI changes, frontend generated client may need `npm run generate:api` from `/Users/rhkss/Desktop/projects/ai645-front`.
- Preserve existing response envelope patterns unless the task explicitly changes them.
- Check auth, payment, fortune session, and document result flows for token/session compatibility.

## Frontend Awareness

Frontend stack:

- Next.js 16
- React 18
- TypeScript
- Mantine UI
- Zustand
- Tailwind CSS
- OpenAPI-generated `typescript-axios` client

Important frontend paths:

- `src/app/(default)/fortune/*`
- `src/app/(chat)/fortune/*`
- `src/services/fortune/*`
- `src/services/openapis/*`
- `src/services/http/axios-interceptor.ts`
- `src/stores/auth.store.ts`
- `src/components/drawer/PaymentDrawer.tsx`

Frontend commands:

```bash
npm run dev
npm run build
npm run lint
npm run generate:api
```

When editing frontend files, respect the frontend repository's local state and do not overwrite generated or user-modified files casually.

## Verification Defaults

Choose verification based on touched surface:

- Backend type/API change: `cd backend && npm run build`
- Backend logic change: targeted Jest test if available, otherwise `cd backend && npm test` when practical
- OpenAPI change: `cd backend && npm run openapi:export`
- Frontend generated client change: `npm run generate:api` in frontend, then `npm run build`
- UI change: run local dev server and visually check the affected page when practical

If verification cannot be run, say why and what remains risky.
