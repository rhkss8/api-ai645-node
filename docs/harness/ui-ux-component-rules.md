# UI/UX Component Rules

## Purpose

Use this file before implementing or reviewing user-visible UI. It maps user jobs and data shapes to the correct interface grammar so TARS does not turn everything into cards, buttons, or chat bubbles.

These rules are environment-independent. Codex skills, humans, and other agents should all follow this file.

## Default Decision Order

Before choosing a component:

1. Name the user job.
   - Navigate, enter, choose, review, approve, dismiss, inspect, continue, or recover.
2. Name the data shape.
   - Text, number, date, bounded single choice, multiple tags, list item, plan object, AI proposal, status, error, or transcript.
3. Choose the smallest UI grammar that fits.
4. Check whether durable plan state can change.
   - If yes, use a review/approval surface.
5. Check whether the user-visible choice is covered here.
   - If not, pause and update this file or ask for a decision.

## Component Mapping

| Data or User Job                    | Use                                                    | Do Not Use                             | Notes                                                                |
| ----------------------------------- | ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------- |
| Primary app destination             | Bottom tab or primary route control                    | Header-only action                     | 상담, 플랜, 설정 같은 top-level areas must be persistent navigation. |
| Secondary navigation                | Quiet text/icon row, secondary button, back affordance | Primary CTA                            | Use when leaving the current task is not the main action.            |
| Submit, approve, continue, generate | Primary button                                         | Plain link, passive card               | One clear primary action per decision state.                         |
| Cancel, dismiss, skip, later        | Ghost/secondary button                                 | Primary button                         | Keep visually quieter than the main action.                          |
| Short text                          | Labeled text field                                     | Chat bubble, card                      | Use validation near the field.                                       |
| Number with unit                    | Labeled numeric field with suffix                      | Free text sentence                     | Examples: age, height, weight.                                       |
| Date                                | Calendar/date picker                                   | Plain text field, generic button group | Use when the date has min/max or planning meaning.                   |
| Bounded single choice               | Segmented control or radio-style chips                 | Text input, card grid                  | Use for sex, mode, reason categories when one answer is allowed.     |
| Multiple tags                       | Multi-select chips                                     | Dropdown-only, repeated cards          | Use for goals, preferences, avoidances.                              |
| Settings list item                  | List row grouped by section                            | Card per setting                       | Settings are operational, not content cards.                         |
| External link                       | List row with link affordance                          | Primary CTA unless it is the main task | Avoid making release/support links look like product actions.        |
| Chat transcript                     | Assistant/user bubbles                                 | Cards for every message                | Chat is input/history, not product state.                            |
| Chat quick action                   | Compact chips                                          | Large cards                            | A quick action fills the draft or starts a lightweight path.         |
| AI suggestion that may change plan  | Proposal/review card with approve/dismiss              | Direct mutation, plain bubble          | Approval must happen before durable plan change.                     |
| Plan item                           | Plan item card/row with completion control             | Plain paragraph                        | Cards are allowed because plan items are product objects.            |
| Status summary                      | Compact status tile/card                               | Oversized hero card                    | Use sparingly; status should aid scanning.                           |
| Review/comparison state             | Review card or before/after section                    | Chat-only explanation                  | Use when the user must understand change before approving.           |
| Empty state                         | Plain section copy plus next action                    | Decorative card by default             | Give the next action without pretending there is content.            |
| Error/validation                    | Inline error near source                               | Modal/card by default                  | Escalate only if the whole flow is blocked.                          |
| Loading                             | Inline/dedicated loading state for the active surface  | Toast-only feedback                    | Keep the user oriented about what is being prepared.                 |

## Card Policy

Cards are allowed only when the surface represents a bounded object or review state:

- AI proposal.
- Approved/reviewable plan item.
- Plan revision comparison.
- Compact status summary.
- Repeated content object that needs item boundaries.

Cards are not the default for:

- Settings rows.
- Plain explanatory sections.
- Every form group.
- Dates.
- Chat bubbles.
- Top-level navigation.

If a screen has more than two unrelated cards, check whether some should be sections, rows, or inline controls.

## Button Policy

Buttons are actions, not containers for data.

Use buttons for:

- Save.
- Continue.
- Approve.
- Generate.
- Dismiss.
- Navigate intentionally.

Do not use buttons for:

- Displaying passive values.
- Replacing a calendar for date selection.
- Making every setting look tappable when no action exists.
- Encoding product state that should be a status label or plan object.

## Chat Policy

Chat is for:

- Gathering context.
- Asking natural-language questions.
- Requesting meal, exercise, or plan help.
- Displaying conversation history.

Chat is not for:

- Mutating an approved plan without review.
- Replacing structured profile inputs.
- Hiding plan state in transcript text.
- Showing every AI result as only a message bubble.

When chat produces a plan-affecting output, render a structured proposal or review card.

## Settings Policy

Settings screens are operational surfaces.

Use:

- Section headers.
- List rows.
- Form fields.
- Segmented controls/chips.
- One save action per editable group.

Avoid:

- Marketing-style hero cards.
- Card per setting.
- Ambiguous button-looking values.
- Free text for constrained values like dates.

## Date Policy

Use `CalendarDatePicker` or an equivalent date picker when:

- The date affects planning.
- There is a valid range.
- The date is optional but meaningful.
- The user benefits from month/day context.

Use plain text only when:

- The value is not user-picked.
- The date is read-only.
- The UI is a debug/admin-only surface.

## Approval Policy

Durable plan state must not change until the user explicitly approves.

Plan-affecting AI outputs need:

- Type label.
- Human-readable summary.
- Affected items or clear preview.
- Primary approve action.
- Dismiss or secondary action when appropriate.
- Reassurance that the current plan is unchanged until approval.

## Review Checklist

Before marking UI work complete:

- Did every surface map to a user job and data shape?
- Did dates use date grammar?
- Did settings use rows/fields instead of repeated cards?
- Did AI plan changes use approval grammar?
- Are buttons only used for actions?
- Are cards reserved for product objects or review states?
- Is there a clear empty/loading/error state when relevant?
- Does the screen still feel like a calm planner?
