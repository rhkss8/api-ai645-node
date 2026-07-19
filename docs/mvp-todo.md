# MVP Todo

## Execution Rule

ForFortune is an existing product workspace, not a blank starter app.

Every slice must preserve the backend/frontend contract:

- Backend: `/Users/rhkss/Desktop/projects/api-ai645-node`
- Frontend: `/Users/rhkss/Desktop/projects/ai645-front`
- Backend API: `http://localhost:3350`
- Frontend dev server: `http://localhost:3000`
- OpenAPI source: `/Users/rhkss/Desktop/projects/api-ai645-node/swagger.json`
- Frontend generated client: `/Users/rhkss/Desktop/projects/ai645-front/src/services/openapis`

Do not restart MVP planning from scratch unless the owner explicitly asks.
Default work mode is `tars maintain`.

## Current Product Priorities

1. Understand where search/social traffic drops in the funnel.
2. Keep signup, payment attempt, payment completion, document generation, and chat entitlement reliable.
3. Build SEO/GEO content at scale without breaking main user flows.
4. Improve admin visibility before adding risky operator actions.
5. Preserve payment/auth/OpenAPI compatibility across backend and frontend.

## Phase 0: Harness And Safety

Goal: make all future Codex work follow TARS.

Todos:

- [x] Install project-local `tars` launcher.
- [x] Add TARS docs under `docs/`.
- [x] Define ForFortune service definition.
- [x] Replace generic starter todo with product-specific operating todo.
- [x] Install project-local TARS skills under `.codex/skills/`.
- [x] Make `tars doctor` pass for this cross-repo workspace.
- [x] Make `tars verify` use focused backend/frontend checks.

Exit criteria:

- `./tars status` works.
- `./tars maintain` prints ForFortune context.
- `./tars verify` runs checks that match touched surfaces.

## Phase 1: Admin Funnel Visibility

Goal: see whether the product loses users at visit, signup, payment attempt, payment completion, or result generation.

Todos:

- [x] Add read-only admin dashboard summary API.
- [x] Add read-only admin payment attempt list API.
- [x] Add `/admin` frontend page guarded by existing login and `role=ADMIN`.
- [ ] Verify admin dashboard with a real admin session.
- [ ] Add manual QA note for admin login/403/401 states.
- [ ] Decide whether GA4 data should be imported or viewed separately.

Exit criteria:

- Admin can see signup count, payment attempts, completion rate, revenue, and category stats.
- Non-admin users cannot access admin API data.
- No raw PG response or full email is exposed in the admin UI.

## Phase 2: Analytics And Traffic Diagnosis

Goal: understand why site traffic or conversion is low.

Todos:

- [ ] Confirm GA4 property and GTM container are aligned.
- [ ] Define key analytics events for landing, fortune start, signup prompt, signup complete, payment open, payment attempt, payment success, payment fail, result viewed.
- [ ] Add event names to `docs/analytics-events.md`.
- [ ] Decide what belongs in GA4/GTM versus internal admin DB.
- [ ] Add missing frontend event calls only after event names are agreed.

Exit criteria:

- GA4 answers visit/source/page questions.
- Admin DB answers signup/payment/product questions.
- Event naming is stable before implementation.

## Phase 3: SEO/GEO Blog Production

Goal: scale content without creating an unmaintainable single-file pile.

Todos:

- [x] Move blog content into `src/data/marketing/blog-posts.ts`.
- [x] Use short canonical slugs like `/blog/dream/snake`.
- [x] Preserve old URL aliases with redirects.
- [x] Generate sitemap entries from the registry.
- [ ] Continue scheduled daily 5-post production only after `yarn run lint:blog` and `yarn run build`.
- [ ] Watch for duplicate topics and thin-content risk.

Exit criteria:

- New posts are data-only additions.
- Canonical URLs are short and stable.
- Build passes before push.

## Phase 4: Payment Reliability

Goal: reduce paid-flow ambiguity and expose failure points.

Todos:

- [ ] Review payment prepare, PortOne confirmation, and result generation states.
- [ ] Confirm pending/failed/cancelled states are visible in user purchase history and admin dashboard.
- [ ] Add regression checks for document purchase and chat entitlement extension.
- [ ] Avoid exposing sensitive payment raw responses to frontend/admin.

Exit criteria:

- Payment status transitions are easy to inspect.
- Users can recover from pending result states.
- Admin can see attempts without changing state.

## Phase 5: Release Readiness

Goal: push safely when the owner has approved automation or direct deployment.

Todos:

- [ ] Run focused verification based on touched surface.
- [ ] Export OpenAPI when backend contract changes.
- [ ] Generate frontend client only when generator is healthy or risk is accepted.
- [ ] Commit only relevant files.
- [ ] Push `main` only when explicitly approved or when an approved automation owns that action.

Exit criteria:

- Report includes changed files, verification, blocked checks, and remaining risk.
- No unrelated user changes are reverted or staged casually.

## Non-Stop Loop

For every work cycle:

1. Read `AGENTS.md`.
2. Run or mentally follow `./tars maintain` unless the owner asks for `tars start` or `tars think`.
3. Check git status in backend and frontend before editing.
4. Read related code and contracts before changing behavior.
5. Keep the slice small.
6. Verify with the smallest useful command.
7. Update this todo only when the work actually changes the product state.
8. Use `docs/decision-gates.md` for external accounts, cost, privacy, destructive operations, deploys, broad rewrites, or ambiguous product decisions.
9. Do not say done if verification failed or was not run.
