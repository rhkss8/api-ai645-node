# Fortune backlog — execution plan

- **Original draft**: 2026-01-28  
- **Revised**: 2026-04-14 — **Chat entitlement is account-scoped with a single source of truth** (supersedes the older §1 idea: per-session minute/day dual model).  
- **Product decision (2026-04-15)**: Chat BM is **1 day / 1 week / 1 month only** (no per-minute chat). Chat SKUs are **not** differentiated per fortune category (single global catalog in TS).

**Goal**: Ship changes in **phases** ordered by risk and blast radius, not in one big bang.

---

## 0) Working principles

- Payment / session / token work is high regression risk: **document migration** before cutover; keep **API contracts stable** during transition where possible.
- **Chat product catalog is code-managed**: No DB table for product definitions; `backend/src/data/fortuneProducts.ts` (and related TS types/services) is the source of truth.
- Prompt work stays in **templates + category overrides**.
- Performance work (document latency): **instrument first**, no guesswork fixes.
- **Swagger**: When an API changes, update `src/routes/fortuneRoutes.ts` (and related route comments) at **item completion**; sync `FORTUNE_API_GUIDE.md` if needed.
- After each phase:
  - `npx tsc --noEmit`
  - Smoke-test critical APIs
  - Reproduce: **signup → default 1h chat grant → paid extension → `POST /api/v1/fortune/chat`**

---

## 1) Chat entitlement: single account field (target flow)

### 1.1 Intended behavior (single source)

| Event | Behavior |
|--------|----------|
| **Signup / account creation** | Set **one** “chat usable until” instant on `User`. Default: **`now + 1 hour`**. |
| **`POST /api/v1/fortune/chat`** | For the **authenticated user**, validate **ownership** of `sessionId`, then allow chat only if **`now < user.chatUsableUntil`** (or agreed equivalent). |
| **Payment completes** | **Extend the same field**: e.g. **+24h (1 day)**, **+168h (7 days)**. Durations must match `fortuneProducts` / order `metadata`. |

**Rules**

- Do **not** treat “5/10/30 minute session SKUs” and “per-session `remainingTime`” as **parallel sources of truth**. The **canonical** rule is **one account-level end time** (UI may derive “seconds left” for display only).
- **`FortuneSession`** remains the unit for **topic, category, conversation logs**; **quota / expiry** lives on **`User`** (or a strict 1:1 side table keyed by `userId`).
- On purchase: **`newUntil = max(now, currentUntil) + purchasedDuration`** so unused time stacks correctly.

### 1.2 Gap vs current code (remove or migrate)

Today **`FortuneSession`** stores `remainingTime`, `expiresAt`, `chatEntitlementExpiresAt`, and **`ChatFortuneUseCase`** **consumes** time per turn via `consumeTime`. That **conflicts** with the single-account model. Plan:

- Stop using **session-only** expiry as the **primary** gate for `/fortune/chat`.
- After backfilling **`User.chatUsableUntil`**, **remove or deprecate** session-level entitlement fields (or keep read-only for legacy rows until migrated).

### 1.3 Data model (add)

- Add on **`User`**, e.g. **`chatUsableUntil DateTime?`**. Before this instant, chat is allowed (subject to session active + ownership); at/after, return **`SESSION_TIME_EXPIRED`** (or agreed code).
- **Avoid** holding both **`chatRemainingSeconds`** and a moving clock as **two** authorities; prefer **one `DateTime`**.
- **Signup**: all paths that create `User` — e.g. `upsertSocialAccount` (`auth/providers.ts`), `AuthController` email/temp signup — must set **`chatUsableUntil`**.
- **Payment**: wherever payment is verified as completed, if the SKU extends chat, **bump `User.chatUsableUntil`** with the stacking rule above.

### 1.4 Code touch list (review and implement)

| Area | Files |
|------|--------|
| Schema | `backend/prisma/schema.prisma` — `User.chatUsableUntil`; later tighten `FortuneSession` time columns after migration |
| Signup (social) | `backend/src/auth/providers.ts` — `user.create` in `upsertSocialAccount` |
| Signup (email/temp) | `backend/src/controllers/AuthController.ts` — any `User` create |
| Chat | `backend/src/usecases/ChatFortuneUseCase.ts` — check **user** entitlement; verify **session.userId === request user**; **remove** per-turn `consumeTime` draining for quota |
| Controller | `backend/src/controllers/FortuneController.ts` — `sendChatMessage`: pass `user.sub`, enforce ownership |
| Session create | `backend/src/usecases/CreateFortuneSessionUseCase.ts` — stop writing chat duration onto session for quota; session creation may only check **account** still has time |
| Payment | `backend/src/usecases/PrepareFortunePaymentUseCase.ts`, `backend/src/services/PaymentService.ts`, **webhook / verify completion** paths — apply **`User.chatUsableUntil`** bump from order metadata |
| Products | `backend/src/data/fortuneProducts.ts`, `backend/src/services/FortuneProductService.ts`, `backend/src/types/fortune.ts`, `backend/src/utils/priceCalculator.ts` |
| Extend / Hongsi | `backend/src/usecases/ExtendSessionTimeUseCase.ts`, `backend/src/usecases/PurchaseHongsiUseCase.ts` — unify on **`User.chatUsableUntil`** (or single service method) |
| Entity | `backend/src/entities/FortuneSession.ts` — simplify time/consumption vs entitlement |
| Repos | `backend/src/repositories/impl/PrismaFortuneSessionRepository.ts` + **user update** path (repository or Prisma in use case — pick one style) |
| Middleware | `backend/src/middlewares/sessionExpiryNotifier.ts` — derive “remaining” from **user** field when appropriate |
| Get session | `backend/src/usecases/GetSessionUseCase.ts` — expose remaining time from **account** rule |
| Payment list UI data | `backend/src/usecases/GetFortunePaymentsUseCase.ts`, `GetFortunePaymentDetailUseCase.ts` — stop implying session `remainingTime` is quota source |
| Docs | `backend/src/routes/fortuneRoutes.ts`, repo-root `FORTUNE_API_GUIDE.md`, `CHAT_API_ERROR_CODES.md` |

### 1.5 Chat payment products — catalog, prepare, and completion (same initiative as §1)

Account-level `chatUsableUntil` only works if **paid chat SKUs**, **order metadata**, and **post-payment code** all describe the **same extension duration**. Treat this as **one workstream** with session/chat use cases.

**Decision (fixed): chat products are not DB-managed.**
- Product definitions (duration/options/price/name/description) are maintained in TypeScript only.
- Source of truth: `backend/src/data/fortuneProducts.ts` + `FortuneProductService` + `types/fortune.ts`.
- DB stores only transaction facts (order/payment/metadata), not catalog rows.

**Catalog (`fortuneProducts` / types)**

- **Target (locked)**: Only **1d / 7d / 30d** chat top-ups. Each SKU maps to a fixed extension (e.g. +24h / +168h / +720h) added to `User.chatUsableUntil` via **`newUntil = max(now, currentUntil) + extension`**.
- **Not category-scoped**: Remove the idea of different **chat** prices per `FortuneCategory`; document products may stay category-scoped separately.
- **Code cleanup**: Remove legacy per-minute chat from TS catalog and services — `AVAILABLE_CHAT_DURATIONS`, `CHAT_PRICE_PER_MINUTE`, `chatDiscountRates` (and any `durationMinutes` chat payment paths).
- **Pricing / naming**: `FortuneProductService`, `priceCalculator.ts`, Swagger product examples — one global row per period (1d / 7d / 30d).

**Prepare payment**

- `PrepareFortunePaymentUseCase`: resolve selected SKU from TS catalog, then persist **unambiguous** extension fields into `Order.metadata` (e.g. `chatExtensionHours` / `chatEntitlementDays` / `extensionMs`) as the payment contract.
- `GET .../fortune/products` responses should expose what the client is buying (**duration semantics**, not only price).

**Payment complete → extend account**

- **One** code path (webhook handler, verify-and-complete, or shared service) should:
  1. Confirm payment **COMPLETED** and **chat** SKU.
  2. Read extension from **metadata** (not from session row).
  3. Apply **`newUntil = max(now, user.chatUsableUntil ?? now) + extension`** (or equivalent for `null` first purchase).
- Avoid duplicating “extend session” logic in `CreateFortuneSessionUseCase` only; session create should **open a conversation**, not be the only place that grants paid time (unless you intentionally keep a thin wrapper that calls the same extender).

**Legacy / migration**

- Existing orders that reference **minutes** or **days** on the session must be **migrated or interpreted** when backfilling `User.chatUsableUntil`.
- `GetFortunePaymentsUseCase` / payment detail: labels should reflect **account extension**, not misleading “session minutes” if the model has changed.

### 1.6 Acceptance checklist (item 1)

- [ ] Every signup path sets **`chatUsableUntil = now + 1 hour`** (or product policy).
- [ ] `POST /api/v1/fortune/chat`: **403** if `sessionId` belongs to another user.
- [ ] After account expiry: **`SESSION_TIME_EXPIRED`** (or agreed); **cannot** pass using only session `remainingTime`.
- [ ] Paid chat SKUs are loaded from TS catalog only; **order metadata → one extender** updates **only** `User.chatUsableUntil`; products API and Swagger match catalog semantics.
- [ ] Legacy DB: **migration script** or documented cutover for existing rows (sessions + old orders).

**Route**: app mounts `/api`; chat is **`POST /api/v1/fortune/chat`** (e.g. `http://localhost:3350/api/v1/fortune/chat`).

---

## 2) Other backlog items (unchanged scope, renumbered references)

### 2. `nextQuestions` — follow-ups from **this** assistant reply

- **Files**: `src/prompts/chat/sasa.prompt.ts`, `src/services/ai/OpenAIService.ts`, `src/services/ai/GeminiService.ts`, `src/controllers/FortuneController.ts` (`generateNextQuestionsByText` as fallback only)

### 3. Consultation prompts (direct, fortune-grounded, intent)

- **Files**: `src/prompts/chat/sasa.prompt.ts`, `src/prompts/document/sasa.prompt.ts`, `src/prompts/categoryPromptOverrides.ts`, AI services

### 4. Off-topic handling — softer mismatch policy

- **Files**: `src/usecases/ChatFortuneUseCase.ts`, `src/utils/categoryDetection.ts`, `src/prompts/categoryPromptOverrides.ts`

### 5. Saju: document token / reuse

- **Files**: `src/controllers/FortuneController.ts`, `GetFortunePaymentsUseCase.ts`, `ResultTokenService.ts`, `RegenerateDocumentUseCase.ts`

### 6. New Year: quarters + year correctness

- **Files**: `categoryPromptOverrides.ts`, `document/sasa.prompt.ts`, `PromptLoader.ts`, `fortuneTopicExtractor.ts`

### 7. Document subtitle phrase cleanup

- **Files**: `document/sasa.prompt.ts`, `categoryPromptOverrides.ts`, optional `documentTitleNormalizer.ts`

### 8. Chat history list API

- **Files**: `FortuneController.ts`, `fortuneRoutes.ts` (**Swagger**), new use case + repos, `types/fortune.ts`

### 9. Purchase history — exclude free rows

- **Files**: `GetFortunePaymentsUseCase.ts`

### 10. Payment failure / attempt visibility

- **Files**: `GetFortunePaymentsUseCase.ts`, `GetFortunePaymentDetailUseCase.ts`, `schema.prisma` status enums

### 11. Post-payment result latency

- **Files**: `FortuneController.ts`, `DocumentFortuneUseCase.ts`, `FortuneGPTService.ts`, AI services, `backend/docs/CHAT_DB_AND_TOKEN_OPTIMIZATION_GUIDE.md`

---

## 3) Recommended order

### Phase A (correctness, security, product baseline)

1. **§1 Account chat entitlement** (schema → signup → payment extend → chat checks → remove legacy session quota)  
2. Purchase history filters (#9, #10)  
3. Saju document/token stability (#5)

### Phase B (quality)

4. `nextQuestions` (#2)  
5. Prompt tone (#3)  
6. Off-topic policy (#4)  
7. Document phrasing (#7)  
8. New Year (#6)

### Phase C (features + perf)

9. Chat list API (#8)  
10. Post-payment latency (#11)

---

## 4) Doc / API sync targets

- `src/routes/fortuneRoutes.ts` — Swagger for **`chatUsableUntil`** (or agreed name) and “seconds left” semantics  
- `FORTUNE_API_GUIDE.md` — single entitlement model  
- `CHAT_API_ERROR_CODES.md` — 403 ownership, entitlement expired, migration notes  

---

## 5) Global acceptance criteria

- **Entitlement**: Signup 1h + paid extensions resolve through **one account field**.  
- **Security**: No cross-user `sessionId` chat.  
- **Payments list**: No free/incomplete noise; failed states visible.  
- **Chat/prompts**: `nextQuestions` relevance; JSON schema stable.  
- **New Year**: Quarters + year.  
- **Perf**: Measurable improvement on post-payment first result (baseline vs after).

---

## 6) Notes

- Field name `chatUsableUntil` is an example; keep **one datetime authority** whatever the final name.  
- If mobile/web still expect `remainingTime` on session responses, define a **computed** field from `chatUsableUntil` for backward compatibility during rollout.  
- `categoryPromptOverrides` / `{currentYear}`: document when PromptLoader gains replacements.

---

## 7) Implementation TODO (checklist)

**How to use**: When a task is done, change `[ ]` to `[x]` in this file (or via PR). Keep items in order within each group where possible.

### 7.1 Product catalog (TS only — 1d / 7d / 30d chat, global)

- [ ] Remove per-minute chat from `backend/src/data/fortuneProducts.ts` (`AVAILABLE_CHAT_DURATIONS`, `CHAT_PRICE_PER_MINUTE`, `chatDiscountRates` on `DISCOUNT_RATES`, and related types).
- [ ] Replace category-scoped chat entitlement prices (`CHAT_ENTITLEMENT_AMOUNTS` per category) with **global** amounts for 1 / 7 / 30 days (or a single small table in TS).
- [ ] Refactor `FortuneProductService`: no `durationMinutes` for chat; expose exactly **three** chat SKUs (or agreed periods) **independent of category**; keep document products as today.
- [ ] Update `getProductsByCategory` / `getAllProducts` so chat lines are identical across categories (or move chat products to a dedicated `getChatTopUpProducts()` used once by the client).
- [ ] Align `backend/src/utils/priceCalculator.ts` and `backend/src/types/fortune.ts` (`FortuneProduct`, `PrepareFortunePayment` fields) with the new shape.

### 7.2 Account entitlement (`User`)

- [ ] Add `chatUsableUntil` (or final name) to `User` in `backend/prisma/schema.prisma`; run migrate / `db push` per environment.
- [ ] Set `chatUsableUntil = now + 1 hour` on **every** user creation path (`backend/src/auth/providers.ts`, `backend/src/controllers/AuthController.ts`, any other `prisma.user.create`).
- [ ] Implement a small shared helper e.g. `extendChatUsableUntil(userId, extensionMs)` used by payment completion only.

### 7.3 Chat API & session

- [ ] `ChatFortuneUseCase`: gate on **`User.chatUsableUntil`**; enforce `session.userId ===` authenticated user (pass `userId` from controller).
- [ ] Remove per-turn `consumeTime` as **quota** drain (session may still store logs only).
- [ ] `FortuneController.sendChatMessage`: pass `user.sub`, return **403** on ownership mismatch.

### 7.4 Payment prepare & completion

- [ ] `PrepareFortunePaymentUseCase` / order `metadata`: store **only** TS-resolved extension (e.g. `chatEntitlementDays: 1|7|30` or `extensionMs`) for chat SKUs; no minute-based fields.
- [ ] Single completion path (webhook / verify): on chat payment **COMPLETED**, apply stacking rule to `User.chatUsableUntil` from metadata.
- [ ] `CreateFortuneSessionUseCase`: stop granting chat time on session row; only verify account still has `chatUsableUntil > now` when opening a chat session.

### 7.5 Legacy cleanup & migration

- [ ] Data migration or one-off script: map existing `FortuneSession` time fields / old orders to `User.chatUsableUntil` where needed; document cutover.
- [ ] Deprecate or remove `FortuneSession.chatEntitlementExpiresAt` / session `remainingTime` as **authority** after cutover (keep columns nullable until migration done if required).
- [ ] `ExtendSessionTimeUseCase`, `PurchaseHongsiUseCase`, `sessionExpiryNotifier`, `GetSessionUseCase`: align with account field; update payment list payloads that still imply “session minutes”.

### 7.6 Docs & API contract

- [ ] `backend/src/routes/fortuneRoutes.ts` Swagger: chat products = 1d/7d/30d only; document `chatUsableUntil` / computed `remainingSeconds` if exposed.
- [ ] Sync `FORTUNE_API_GUIDE.md`, `CHAT_API_ERROR_CODES.md`.

### 7.7 Verify

- [ ] `npx tsc --noEmit`
- [ ] Manual smoke: signup → 1h grant → pay 1d → chat works → wait/expiry → `SESSION_TIME_EXPIRED`
- [ ] Manual: cannot chat with another user’s `sessionId` (403)
