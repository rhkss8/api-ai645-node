# Analytics Events

## Goal

The MVP test must answer whether the core loop creates the intended user transformation.

## Primary Metrics

- `[Primary metric]`
- `[Secondary metric]`
- `[Secondary metric]`

## Event Naming Rules

- Use uppercase snake case.
- Event names describe user actions or system milestones.
- Keep payloads small and structured.

## Required Events

### Activation

- `USER_STARTED`
- `ONBOARDING_STARTED`
- `ONBOARDING_COMPLETED`

### Core Loop

- `CORE_ACTION_STARTED`
- `CORE_ACTION_SUCCEEDED`
- `CORE_ACTION_FAILED`
- `CORE_RESULT_APPROVED`
- `CORE_RESULT_DISMISSED`

### Return

- `APP_OPENED`
- `USER_RETURNED_AFTER_CORE_ACTION`

## Minimum Payloads

```ts
{
  userId: string;
  sessionId?: string;
  source?: string;
}
```

## Dashboard Questions

At the end of the MVP test, answer:

- How many users reached the core loop?
- How many completed it?
- How many returned?
- Which step caused the most drop-off?
- Did the core action correlate with retention?
