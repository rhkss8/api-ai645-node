# Service Design Blueprint

## Purpose

Service design ensures the product works across the user's real journey, not only inside one screen.

Use this document to define the end-to-end experience, operational constraints, and feedback loops for the MVP.

## Journey Layers

Map the service across these layers:

### 1. User Journey

Document:

- Discovery moment.
- First session.
- Activation moment.
- Repeated use moment.
- Failure or friction moment.
- Return moment.
- Support or feedback moment.

### 2. Product Touchpoints

List every touchpoint:

- App screens.
- Notifications.
- Emails.
- Landing page.
- Payment or checkout, if any.
- Support channel.
- Feedback form.
- Community or human review channel.

### 3. System Actions

List what the system does behind the scenes:

- Creates records.
- Calls AI.
- Sends notifications.
- Writes analytics.
- Syncs data.
- Escalates to human review.

### 4. Operational Actions

List what the team must do:

- Review feedback.
- Monitor failed flows.
- Invite testers.
- Respond to support.
- Update prompts or content.
- Review analytics.

## Blueprint Template

```txt
Stage:
User goal:
User emotion:
User action:
Product touchpoint:
System action:
Team operation:
Failure risk:
Recovery path:
Metric:
```

## MVP Service Constraints

Document constraints early:

- Account or auth limitations.
- Manual operations that are acceptable during MVP.
- AI cost limits.
- Data privacy constraints.
- Support response expectations.
- Device, browser, or platform assumptions.

## Feedback Loop

Every MVP should define:

- When feedback is requested.
- Where feedback is sent.
- Who reviews it.
- How decisions are recorded.
- Which metric or lesson changes the next build slice.

## Service Design QA Checklist

- Does the product promise depend on a touchpoint outside the app?
- Does the user know what happens after they take the core action?
- Does the team know how to respond when something fails?
- Are manual MVP operations documented instead of hidden?
- Are feedback and support channels visible at the right time?
- Does analytics answer the same questions the service blueprint asks?
