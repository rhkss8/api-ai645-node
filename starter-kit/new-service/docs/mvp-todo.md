# MVP Todo

## Execution Rule

Work in vertical slices. A slice is complete only when product flow, data, UI, analytics, and basic QA are connected.

Avoid building isolated screens that do not move the core loop forward.

## Phase 0: Foundation

Goal: create the development harness.

Todos:

- [ ] Create app.
- [ ] Create TypeScript workspace structure.
- [ ] Add formatting and linting.
- [ ] Add test runner.
- [ ] Add route structure.
- [ ] Add shared UI primitives.
- [ ] Add domain model package.
- [ ] Add environment variable convention.

Exit criteria:

- App starts locally.
- TypeScript checks run.
- Tests run.
- Repo has clear package boundaries.

## Phase 1: Product Contracts

Goal: define contracts before building UI deeply.

Todos:

- [ ] Define domain types.
- [ ] Define analytics event names.
- [ ] Define core fixtures.
- [ ] Define core flow acceptance criteria.
- [ ] Define AI JSON schemas if AI is part of the product.

Exit criteria:

- UI, data, and AI share the same domain terms.
- Fixture tests can run without the app.

## Phase 2: First Vertical Slice

Goal: user can complete the first version of the core loop using mocks.

Todos:

- [ ] Build first input screen.
- [ ] Generate mock result.
- [ ] Build review/approval screen.
- [ ] Persist approved result locally or in DB.
- [ ] Track core events.

Exit criteria:

- Fresh user can complete the core loop locally.

## Phase 3: Main Use Flow

Goal: user can repeat the core behavior.

Todos:

- [ ] Build main/home screen.
- [ ] Show persisted user state.
- [ ] Add primary action.
- [ ] Track repeated use events.

Exit criteria:

- User can return and continue using the product.

## Phase 4: Real Integration

Goal: replace mocks with real backend or AI calls.

Todos:

- [ ] Add backend persistence.
- [ ] Add auth if required.
- [ ] Add real AI integration if required.
- [ ] Validate structured outputs.
- [ ] Add fallback behavior.
- [ ] Add regression tests.

Exit criteria:

- Real integrations can be trusted by UI after validation.

## Phase 5: Release Readiness

Goal: prepare closed MVP test.

Todos:

- [ ] Add basic settings screen.
- [ ] Add privacy policy link.
- [ ] Add terms link.
- [ ] Add feedback channel.
- [ ] Run full manual QA.
- [ ] Run test suite.
- [ ] Create build.
- [ ] Recruit first tester cohort.

Exit criteria:

- Closed MVP can be distributed to testers.

## Non-Stop Loop

For every scheduled work cycle:

1. Read this file.
2. Pick the highest incomplete todo that moves the core loop forward.
3. Read the relevant harness docs.
4. Implement the smallest complete slice.
5. Run checks.
6. Mark completed todos.
7. Record blockers, decisions, and lessons.
8. Use `docs/decision-gates.md` for any branch that requires user input.
9. Promote repeated lessons into checklist or starter candidates.
10. Continue to the next todo unless blocked by credentials, external accounts, or user decision.
