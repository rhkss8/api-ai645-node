# AI645 Product Workspace

## Repositories

Backend:

```text
/Users/rhkss/Desktop/projects/api-ai645-node
```

Frontend:

```text
/Users/rhkss/Desktop/projects/ai645-front
```

## Source Of Truth

- Backend owns API behavior, auth/session/payment logic, database schema, and OpenAPI export.
- Frontend owns UI, client-side state, generated API client usage, and product flows.
- `swagger.json` in backend is the source for frontend OpenAPI client generation.

## Cross-Repo Change Rules

Backend change requires frontend check when it touches:

- Route path or method
- Request/response shape
- Auth requirements
- Token/session behavior
- Payment status/order behavior
- Fortune category/form/mode values
- Error codes/messages that drive UI states

Frontend change requires backend check when it touches:

- `src/services/openapis`
- `src/services/fortune`
- `src/services/http/axios-interceptor.ts`
- Auth store/session handling
- Payment drawer/result flows
- Fortune result/chat/document flows

## Common Workflows

Backend API change:

```text
1. Update backend implementation.
2. Run focused backend verification.
3. Export OpenAPI if contract changed.
4. Regenerate frontend API client if needed.
5. Build or inspect affected frontend flow.
```

Frontend API usage change:

```text
1. Check generated client and service wrapper.
2. Verify backend route and response contract.
3. Update UI/state handling.
4. Build frontend when practical.
```

Payment/session/document flow:

```text
1. Trace backend use case and repository behavior.
2. Trace frontend service/store/component path.
3. Verify token/session/order/result linkage.
4. Avoid destructive DB changes without approval.
```

## Verification Commands

Backend:

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node/backend
npm run build
npm test
npm run openapi:export
```

Frontend:

```bash
cd /Users/rhkss/Desktop/projects/ai645-front
npm run generate:api
npm run build
npm run lint
```

Docker:

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
docker compose up -d
docker compose ps
docker compose logs -f backend
```

## Frontend Repository Setup TODO

Add a frontend-local `AGENTS.md` to `/Users/rhkss/Desktop/projects/ai645-front` when that repository is writable in the active Codex workspace.

Recommended contents:

- Frontend stack and commands
- OpenAPI generation rule
- UI/design rules
- Auth/payment/session flow notes
- Generated client safety rule
- Backend contract check rule
