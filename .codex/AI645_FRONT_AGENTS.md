# AI645 Frontend Agent Rules

## Product Workspace

This repository is the frontend for the AI645/ForFortune product.

- Frontend: `/Users/rhkss/Desktop/projects/ai645-front`
- Backend: `/Users/rhkss/Desktop/projects/api-ai645-node`
- Backend API: `http://localhost:3350`
- Backend API docs: `http://localhost:3350/api-docs`
- OpenAPI source: `/Users/rhkss/Desktop/projects/api-ai645-node/swagger.json`
- Generated API client: `src/services/openapis`

Treat frontend and backend as one product workspace. Frontend API changes require backend contract checks. Backend API changes may require regenerating the frontend OpenAPI client.

## Owner / Agent Contract

The user is the owner, PM, and final approver.

Codex is the lead execution agent:

- Read relevant code before changing behavior.
- Prefer existing UI, service, store, and generated-client patterns.
- Keep implementation scoped to the requested product flow.
- Run the smallest useful verification after edits.
- Keep reports short and decision-oriented.
- Ask before destructive operations, generated-client replacement, commits, pushes, deploys, or broad rewrites.
- Never revert user changes unless explicitly requested.

## Report Style

Use concise Korean by default.

Use caveman-style reporting when the user asks for caveman mode, short reports, mobile-friendly updates, or token-saving work:

- Terse, concrete, action/result/risk only.
- Keep technical names exact.
- Do not compress warnings, destructive confirmations, or ordered steps where ambiguity could cause damage.
- Return to normal prose when the user asks for explanation or says `normal mode`.

For substantial work, report:

```text
한 일:
- ...

막힌 것:
- 없음 / ...

다음 액션:
- ...
```

## Harness Policy

Use sub-agents only when they materially help.

- Small task: Codex handles directly.
- Medium task: use an explorer if code structure is unclear.
- Large task: split into explorer, worker, and reviewer roles.
- Cross-repo task: inspect both frontend and backend contracts before implementation.
- If cavecrew skills are available, prefer them for compressed sub-agent work when the task is narrow enough.

Cavecrew mapping:

- `cavecrew-investigator`: locate components, services, stores, routes, generated models, or backend callers.
- `cavecrew-builder`: small bounded edit, usually one or two files with known scope.
- `cavecrew-reviewer`: compressed diff/file review for bugs and regressions.

## Frontend Project Rules

Stack:

- Next.js 16
- React 18
- TypeScript
- Mantine UI
- Zustand
- Tailwind CSS
- OpenAPI-generated `typescript-axios` client

Important paths:

- `src/app/(default)/fortune/*`: fortune entry/result pages
- `src/app/(chat)/fortune/*`: chat flow pages
- `src/app/(default)/setting/*`: purchase history, FAQ, inquiry
- `src/services/fortune/*`: product service wrappers
- `src/services/openapis/*`: generated API client
- `src/services/http/axios-interceptor.ts`: manual axios/auth boundary
- `src/stores/auth.store.ts`: auth/session state
- `src/components/drawer/PaymentDrawer.tsx`: payment flow UI
- `src/components/domain/fortune/*`: fortune UI components

Common commands:

```bash
npm run dev
npm run build
npm run lint
npm run generate:api
```

## OpenAPI / Generated Client Rules

- `src/services/openapis` is generated. Avoid hand-editing generated files unless explicitly fixing generated output as a temporary measure.
- Backend `swagger.json` is the source of truth for generation.
- After backend contract changes, run `npm run generate:api` from frontend when approved/practical.
- Generated client replacement can overwrite many files; check git status first and report the impact.
- Service wrappers in `src/services/fortune/*` should hide generated-client details from UI components.

## UI / Product Rules

- Match existing Mantine, Tailwind, CSS module, and component patterns.
- Do not introduce a new visual system for a narrow change.
- Keep mobile flows usable first.
- Payment, login, and fortune-result states must show clear loading, success, failure, and retry behavior.
- Avoid visible instructional copy that explains implementation details.
- Use existing shared components before creating new ones.

## Backend Contract Awareness

Check backend when frontend work touches:

- Auth/login/session handling
- Payment prepare/confirm/status/cancel flows
- Fortune session creation/result/chat flows
- Generated OpenAPI models or APIs
- Error response handling used by UI state

Backend paths to inspect:

- `/Users/rhkss/Desktop/projects/api-ai645-node/backend/src/routes`
- `/Users/rhkss/Desktop/projects/api-ai645-node/backend/src/controllers`
- `/Users/rhkss/Desktop/projects/api-ai645-node/backend/src/usecases`
- `/Users/rhkss/Desktop/projects/api-ai645-node/backend/prisma/schema.prisma`

## Verification Defaults

Choose verification based on touched surface:

- UI/component/service change: `npm run build`
- Lint-sensitive cleanup: `npm run lint`
- API client regeneration: `npm run generate:api`, then `npm run build`
- Visual page change: run local dev server and check affected page when practical
- Backend contract change: verify backend export/build from `/Users/rhkss/Desktop/projects/api-ai645-node`

If verification cannot be run, say why and what remains risky.
