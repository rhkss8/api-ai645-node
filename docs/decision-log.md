# Decision Log

## Purpose

Capture product, design, engineering, and process decisions so the project does not rely on chat memory.

Every meaningful decision should be recorded here when it changes how the MVP is built.

## Decision Format

```txt
## YYYY-MM-DD - Short Decision Title
Status: proposed | accepted | replaced
Area: product | design | frontend | ai | data | qa | process

Decision:
- What we decided.

Reason:
- Why this decision is useful now.

Tradeoff:
- What this makes easier.
- What this makes harder.

Review Trigger:
- When to revisit this decision.
```

## 2026-07-19 - Admin Payment Gate Bypass
Status: accepted
Area: product | backend | qa

Decision:
- ADMIN role can pass fortune payment/time checks for production operations testing.
- The bypass is evaluated at runtime and does not extend `User.chatUsableUntil` or create fake payment records.

Reason:
- Operators need to verify paid document and chat flows without repeatedly creating real payments.
- Keeping entitlement/payment rows untouched prevents production analytics, payment history, and user support data from being polluted by admin tests.

Tradeoff:
- Easier: admin accounts can test live gated flows quickly.
- Harder: admin testing is not a substitute for a real payment gateway smoke test.

Review Trigger:
- Revisit when adding multiple admin roles, audit logs, or a staging-only payment provider.
