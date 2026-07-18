# Design Philosophy

## Purpose

Design is not decoration. Design defines how the product thinks, behaves, earns trust, and helps the user move from the current state to the desired state.

Every new service must define its design philosophy before implementation produces UI.

## Design Leadership Choice

For MVP work, default to technical design leadership:

- Build the product's design judgment into documents, components, and QA rules.
- Mentor future contributors through clear examples and constraints.
- Keep design quality repeatable without requiring the same person to review every screen.

People management is a separate leadership path. It matters later, but the starter kit's job is to preserve craft quality through a reusable operating system.

## Four Design Domains

### 1. UX Strategy

UX strategy answers:

- What user problem is the business trying to solve?
- What user behavior proves the product works?
- What constraints shape the solution?
- Which insight makes this service different from existing options?

Required outputs:

- Product promise.
- Primary user emotion before using the product.
- Primary user emotion after using the product.
- Design success metric.
- Design non-goals.

Template:

```txt
This product should help [persona] move from [current emotional/behavioral state] to [desired emotional/behavioral state] by [core interaction].
```

### 2. Interaction Design

Interaction design defines how the user moves through the product.

Required outputs:

- Core interaction loop.
- Primary action.
- Secondary actions.
- Review, confirmation, undo, and error states.
- Navigation and history expectations.

Rule:

Do not hide product strategy inside screens. The core interaction should make the service's promise obvious within the first session.

### 3. Visual and Motion Design

Visual and motion design defines how the product feels.

Required outputs:

- Visual personality.
- Color principles.
- Typography principles.
- Spacing and density principles.
- Component shape language.
- Motion principles.

Rule:

Visual polish must support the product behavior. Avoid generic templates, decorative surfaces, and one-note palettes that do not express the service concept.

### 4. Service Design

Service design covers the experience beyond one screen.

Required outputs:

- End-to-end user journey.
- Touchpoints outside the core app screen.
- Notifications, emails, support, feedback, and onboarding moments.
- Operational constraints that affect the experience.
- Human review or support loops, if needed.

Rule:

If the product promise depends on what happens before or after app use, document that service layer before release.

## Generalist vs Specialist Posture

Most MVP projects need a strong generalist design posture:

- Enough UX strategy to avoid building the wrong product.
- Enough interaction design to make the product usable.
- Enough visual design to create trust.
- Enough service design to validate the real journey.

Specialist depth can be added later when a specific area becomes the bottleneck.

## Design Philosophy Checklist

Before UI implementation starts, answer:

- What must the user feel in the first minute?
- What should the product never make the user feel?
- What is the signature interaction?
- What must be reviewed or confirmed before it changes user data?
- What does good visual quality mean for this domain?
- What existing product category should this avoid looking like?
- What touchpoints outside the app affect the user experience?
- Which design tradeoffs require a user or stakeholder decision?
