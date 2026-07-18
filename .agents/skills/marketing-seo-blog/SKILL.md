---
name: marketing-seo-blog
description: >
  Create or update ForFortune marketing SEO/GEO blog pages and content strategy.
  Use when building pages for search traffic, AI answer visibility, blog-style
  fortune content, dream interpretation, palm reading, yearly fortune, category
  landing pages, ad slots, tracking hooks, sitemap/canonical metadata, or
  scalable `/blog/[category]/[slug]` marketing routes.
---

# Marketing SEO Blog

Use this skill for ForFortune marketing content that must rank in search, be easy for AI answer engines to quote, and convert readers into fortune flows.

## Default Architecture

- Use frontend repo: `/Users/rhkss/Desktop/projects/ai645-front`.
- Use route shape: `/blog/[category]/[slug]`.
- Use marketing route group: `src/app/(marketing)`.
- Do not put SEO articles under `src/app/(default)` because it inherits `DefaultAppShell`, bottom nav, payment drawers, and app-width constraints.
- Use a separate marketing layout:
  - desktop content width around `1280px`
  - article column around `760-860px`
  - right ad/sidebar around `300-360px`
  - responsive single-column under tablet width
- Keep old URLs alive with `permanentRedirect()` when moving content.

## Content Strategy

Before writing, define:

- **Primary keyword**: exact phrase the user searches.
- **Search intent**: interpretation, comparison, checklist, how-to, meaning, timing, or purchase-ready.
- **Category**: stable English slug, e.g. `dream-interpretation`, `palm-reading`, `new-year-fortune`.
- **Slug**: readable English slug, e.g. `snake-dream`, `falling-dream`, `2026`.
- **CTA target**: usually `/fortune/traditional`, `/fortune/daily`, or `/fortune/ask`.

Prefer high-intent fortune topics:

- 꿈해몽: falling dream, snake dream, tooth falling dream, ex lover dream, pregnancy dream, water dream, fire dream.
- 손금: money line, marriage line, life line, fate line.
- 신년운세: year-specific fortune, money luck, love luck, career luck.

## SEO Requirements

Every article must include:

- `generateMetadata()` with title, description, canonical, robots, OG, Twitter.
- `BlogPosting` JSON-LD.
- FAQ section plus `FAQPage` JSON-LD when there are 3+ common questions.
- Sitemap entry for indexable canonical URLs.
- One H1 only.
- Clear H2 sections matching search intent.
- Internal links to related fortune flows or blog topics.
- Permanent redirect for replaced legacy URLs.

Title pattern:

- `키워드, 보기 전에 이것만 알고 가세요`
- `키워드 해몽: 상황별 의미와 조심할 점`
- `키워드 뜻은? 상황별로 달라지는 해석 정리`

Meta description pattern:

- Include the primary keyword early.
- Explain what the reader will learn.
- Avoid overclaiming or deterministic fortune claims.

## GEO Requirements

Make content quotable by AI answer engines:

- Put a direct definition in the first 2-3 paragraphs.
- Use concise summary sentences that can stand alone.
- Include comparison tables for ambiguous topics.
- Include FAQ with direct answers.
- Avoid vague teaser-only copy.
- Do not claim certainty about future events, illness, death, or financial outcomes.

Good GEO sentence shape:

```text
뱀 꿈은 상황에 따라 재물, 긴장감, 관계 경계, 변화의 신호로 해석될 수 있습니다.
```

## Blog Tone

Use a Korean web-blog / Naver-blog-like information tone:

- conversational but not childish
- warm, plain, easy to skim
- short paragraphs
- practical interpretation
- no product-landing hero tone
- no overdramatic mysticism

Avoid:

- "대박 확정", "무조건", "반드시 일어난다"
- hard medical, legal, investment predictions
- app feature explanations in visible body copy
- pages that look like product landing pages

## Page Structure

Recommended order:

1. Blog header: category, title, published date, reading time.
2. Intro: user's situation + direct answer.
3. Table of contents.
4. Top ad slot.
5. Main interpretation sections.
6. Comparison table or situation table.
7. Mid-article ad slot.
8. Checklist or "when to pay attention" section.
9. CTA box to fortune flow.
10. FAQ.
11. Bottom ad slot.
12. Sidebar: display ad + related links + optional tracking note only in dev/demo contexts.

## Ads And Tracking

Add placeholder slots, not third-party scripts, unless explicitly asked.

Required attributes:

- Page root: `data-track-page="seo-..."`
- CTA links: `data-track-click="..."`
- Content sections when useful: `data-track-section="..."`
- Ad slots: `data-ad-slot="..."`

Ad slot naming:

```text
<category>-<slug>-top
<category>-<slug>-mid
<category>-<slug>-bottom
<category>-<slug>-display
```

## Implementation Rules

- Read current app route/layout structure before editing.
- Preserve unrelated user changes.
- Prefer a shared content registry if adding 2+ articles:
  - `src/data/marketing/blog-posts.ts`
  - dynamic page reads article by `{ category, slug }`
  - `generateStaticParams()` from registry
  - sitemap from same registry when practical
- For 1 article prototype, inline content in the page is acceptable.
- For 3+ articles, move data out of route file before duplicating markup.
- Keep content static/SSG or ISR. Do not fetch marketing articles from backend per request unless a CMS/DB requirement is explicit.
- If using DB/CMS later, render with SSG/ISR and cache aggressively.

## Verification

After changes:

- Run `npm run build` in `/Users/rhkss/Desktop/projects/ai645-front`.
- Confirm route appears in build output.
- Confirm canonical URL is the intended public URL.
- Confirm sitemap contains only canonical indexable URL, not legacy redirect URL.
- If visual tools are available, check desktop and mobile widths.
