# AI Contracts

## Goal

AI must produce structured, reviewable outputs for product flows. It must not behave like an unconstrained chatbot unless chat is the product's core interface.

## AI Functions

### `[functionName]`

Input:

- `[Input field]`
- `[Input field]`

Output:

- `[Structured output]`
- `[Structured output]`

### `[functionName]`

Input:

- `[Input field]`

Output:

- `[Structured output]`

## Output Rules

- Return JSON only for product flows.
- Use domain terms from the product docs.
- Include user-facing copy separately from structured data.
- Do not mutate persisted state until the user approves, unless the flow explicitly does not require approval.
- Invalid AI output must be handled safely.

## Initial JSON Shapes

```ts
type ExampleOutput = {
  id?: string;
  summary: string;
  items: Array<{
    title: string;
    description: string;
  }>;
};
```

## Fixture Cases

Create fixtures for:

- `[Common persona case]`
- `[Edge case]`
- `[Failure or fallback case]`

## Regression Rule

Every prompt change must run AI fixtures.

The test must verify:

- JSON parses.
- Required fields exist.
- User-facing copy follows tone rules.
- The app can render the result.
