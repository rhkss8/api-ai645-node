# Wiki Schema

## Purpose

This wiki is a lightweight knowledge graph generated from original source material in `docs/inbox/`.

Use it for product research, user insights, positioning, design references, and long-lived project context. Do not use it as a mandatory read for every coding task.

## Source Rule

- `docs/inbox/` contains original material from humans or external sources.
- `docs/wiki/` contains Codex-generated synthesis.
- Humans should edit inbox sources, not wiki pages.
- If wiki content conflicts with inbox, current code, tests, or a direct user request, stop and ask which source wins.

## When To Read

Read wiki when:

- Product intent or scope is unclear.
- UX, copy, positioning, persona, pain, or design direction matters.
- A task says "as originally intended", "based on the research", or "according to the references".
- New source material was added to `docs/inbox/` and the user asks to organize it.

Skip wiki when:

- The task is a local bug fix with clear reproduction.
- The change is a narrow refactor.
- Current code and tests are the only relevant source of truth.

## Page Rules

- Use plain Markdown.
- Use `[[Wiki Links]]` to connect related pages.
- One page should explain one concept, decision, user insight, or reference cluster.
- Start each page with a short summary.
- Include a `Sources` section listing inbox files used.
- Do not invent facts missing from the source. Mark uncertainty clearly.

## Suggested Page Shape

```md
# Page Title

Summary:

- One to three bullets.

## Notes

- Key point with links to [[Related Page]].

## Implications

- What this means for product, design, AI, QA, or growth.

## Sources

- `docs/inbox/source-file.md`
```
