# Design System Spec

## Purpose

This file turns design philosophy into repeatable UI decisions.

Do not treat the design system as a large component library on day one. For MVP, define the smallest set of tokens, components, states, and layout rules needed to make the core loop feel intentional.

## Design System Inputs

Before defining UI tokens, read:

- `docs/design-philosophy.md`
- `docs/design-tone-and-manner.md`
- `docs/interaction-principles.md`
- `docs/ui-quality-philosophy.md`
- `docs/visual-composition-rules.md`
- `docs/service-definition.md`
- `docs/g-stack.md`
- `docs/superpowers.md`

## Visual Personality

Define the product's visual personality in one sentence:

```txt
The product should feel [adjective], [adjective], and [adjective], without feeling [anti-trait] or [anti-trait].
```

Examples:

- Calm, precise, and supportive, without feeling medical or childish.
- Operational, dense, and trustworthy, without feeling cold or bureaucratic.
- Expressive, playful, and fast, without feeling chaotic or toy-like.

## Token Requirements

Define tokens before building repeated UI.

Before choosing token values, define what the screen must make visible without relying on explanatory copy:

- Current user state.
- Primary object.
- Primary action.
- Review, progress, risk, or completion state.

If the screen needs paragraphs to make these clear, fix the layout and object model before tuning colors, type, or radius.

### Color

Required semantic colors:

- `background`
- `surface`
- `surfaceSubtle`
- `border`
- `textPrimary`
- `textSecondary`
- `textMuted`
- `accentPrimary`
- `accentSecondary`
- `success`
- `warning`
- `danger`
- `focus`

Rules:

- Do not build a one-hue interface unless the brand explicitly requires it.
- Avoid relying only on red/green to communicate state.
- Define contrast expectations for text and interactive controls.
- Use color to clarify state, not to decorate empty space.

### Typography

Required text roles:

- `screenTitle`
- `sectionTitle`
- `body`
- `supporting`
- `caption`
- `dataLabel`
- `buttonLabel`

Rules:

- Match type scale to the container.
- Do not use hero-sized type inside dense tools.
- Do not scale font size with viewport width.
- Keep letter spacing at `0` unless a brand system explicitly defines otherwise.

### Spacing

Start with a small spacing scale:

```txt
4, 8, 12, 16, 20, 24, 32, 40
```

Rules:

- Use spacing to show hierarchy.
- Do not stack cards inside cards.
- Define stable dimensions for repeated controls, tiles, toolbars, and action bars.

### Shape

Rules:

- Use restrained radius by default.
- Cards should usually be `8px` radius or less unless the brand intentionally uses softer shapes.
- Use shape to group related actions, not to make every section float.

## MVP Component Inventory

Define only the components needed for the core loop.

Required for most products:

- App shell or screen frame.
- Primary button.
- Secondary button.
- Icon button, if icons are used.
- Text input.
- Select, segmented control, or radio group for option sets.
- Checkbox or toggle for binary settings.
- Card for repeated items only.
- Empty state.
- Loading state.
- Error state.
- Confirmation or review surface.

For AI products:

- AI response surface.
- Structured suggestion card.
- User approval control.
- Invalid or uncertain AI output state.
- Human-editable correction state.

## State Model

Every important UI component should define:

- Default.
- Hover or press.
- Focus.
- Disabled.
- Loading.
- Error.
- Empty.
- Success or approved, if relevant.

## Layout Rules

- Build the actual product experience as the first screen, not a marketing page.
- Make current state, primary object, and next action visible in the first viewport.
- Use visual hierarchy, state, grouping, progress, and object structure before helper copy.
- Keep operational tools dense but readable.
- Keep consumer apps warm but not decorative.
- Do not use generic chatbot layout if chat is only one input method.
- Do not use a dashboard when the product's core promise is a guided flow.
- Keep primary action visible without drowning the user in actions.
- Avoid title, paragraph, card-stack screens unless the product object genuinely requires that format.
- Avoid repeated same-weight text blocks; convert them into structured objects, status rows, or direct manipulation controls.

## Design System Done Criteria

The design system is ready for MVP implementation when:

- Tokens exist for color, type, spacing, and state.
- The core loop can be represented with the component inventory.
- The first viewport passes the three-second visibility test.
- Important UI objects have visible states and clear actions.
- Primary, secondary, and destructive actions are visually distinct.
- AI or automation outputs are reviewable before they mutate user data.
- Mobile and desktop constraints are documented when relevant.
