---
name: ad-monetization-readiness
description: >
  Check ForFortune marketing/blog pages for ad monetization readiness before
  adding Google AdSense, Kakao AdFit, or other display ads. Use for ad approval
  preparation, ad policy risk review, fortune/dream/palm-reading content safety,
  privacy-policy cookie requirements, ad-slot labeling, invalid-click prevention,
  and scheduled audits of SEO/GEO content before monetization.
---

# Ad Monetization Readiness

Use this skill before adding real ad scripts or when scheduled jobs audit ForFortune SEO/GEO content for monetization risk.

Primary target: Google AdSense-level safety. If another ad network is used, keep these rules as the baseline and add that network's stricter rules.

## What To Audit

Check these areas:

1. Site readiness
2. Content policy risk
3. Ad placement and labeling
4. Privacy/cookie disclosure
5. Tracking and invalid-click risk
6. SEO content quality

## Site Readiness

Before applying or enabling ads:

- Site has enough indexable original content. Prefer at least 10-20 substantial marketing articles before review.
- Each article has unique value, not thin duplicated text.
- Pages are crawlable and present in sitemap.
- Canonical URLs point to the indexable page, not legacy redirects.
- The site has accessible privacy policy, terms/service, and contact/support routes.
- The site owner can edit HTML/source and add ad verification code.

## Content Policy Risk For Fortune Topics

Fortune, dream interpretation, palm reading, and yearly fortune content can be monetizable if written as interpretive/entertainment/self-reflection content.

Avoid hard claims:

- disease diagnosis or "illness is certain"
- death, accident, disaster, pregnancy, or miscarriage prediction as fact
- guaranteed investment return, lottery win, business success, or debt solution
- "you must do X or bad things will happen"
- fear-based urgency or manipulation
- hate, harassment, illegal activity, adult/sexual content, weapons, drugs, gambling, counterfeit goods
- medical/scientific claims that contradict authoritative consensus
- copied or scraped dream dictionary content

Preferred framing:

- "해석될 수 있습니다"
- "참고해볼 수 있습니다"
- "현재 심리나 상황을 돌아보는 단서로 볼 수 있습니다"
- "미래를 단정하기보다 선택을 정리하는 참고 자료로 활용하세요"

## Forbidden Or Risky Phrases

Flag and rewrite:

- "무조건 일어납니다"
- "반드시 돈을 법니다"
- "투자하면 수익 보장"
- "질병이 확정입니다"
- "죽음/사고가 예고됩니다"
- "광고 클릭해주세요"
- "광고 눌러서 응원해주세요"
- "이 광고를 확인하세요" when near ad units
- any copy that points visually or verbally to ads

## Ad Placement Rules

Ad units must be clearly distinguishable from content.

Do:

- Label ad slots as `광고`, `Advertisement`, `Advertisements`, or `Sponsored`.
- Keep sufficient spacing between CTA buttons, navigation links, and ads.
- Use stable dimensions to avoid layout shift.
- Keep ad density lower than content density.
- Use placeholders before approval; add real scripts only after account/site approval.

Do not:

- Place ads inside deceptive navigation.
- Put ads in popups/popunders.
- Put ads in pages with little or no content.
- Make ads look like article cards, menu items, or download buttons.
- Use arrows, animations, or text that draws attention to ads.
- Place ads so users accidentally click while scrolling or tapping CTA/buttons.

Recommended slot names:

```text
<category>-<slug>-top
<category>-<slug>-mid
<category>-<slug>-bottom
<category>-<slug>-display
```

Required implementation markers:

- `data-ad-slot="..."`
- `data-track-section="ad-slot"` or `data-track-section="display-ad"`
- visible label text: `광고 영역` or equivalent

## Privacy And Cookie Requirements

Before real ad scripts:

- Privacy policy must disclose third-party ad vendors including Google if AdSense is used.
- Privacy policy must explain advertising cookies and personalized ads.
- Include opt-out guidance for personalized ads.
- If other ad networks are used, disclose those vendors too.
- Do not send personally identifiable information to ad tags or analytics events.

If the user asks to implement AdSense, check privacy policy first. If missing, add/update it before enabling ad scripts.

## Tracking Safety

Tracking is allowed, but avoid invalid-click risk.

Track:

- page view intent
- article CTA clicks
- internal related-link clicks
- ad slot viewability placeholder events if needed

Do not:

- track or encourage ad clicks manually unless the ad network provides compliant reporting
- create custom click handlers on real ad iframes/scripts
- simulate impressions or clicks
- auto-refresh ads unless the network explicitly supports it

Use attributes already used in marketing pages:

- `data-track-page`
- `data-track-section`
- `data-track-click`
- `data-ad-slot`

## SEO Content Quality Gate

For every monetized article:

- Minimum useful body length: usually 1,000-1,500 Korean characters or more.
- Include FAQ, situation-specific interpretation, and practical checklist.
- Include one clear CTA to a ForFortune flow.
- Avoid pages that exist only to show ads.
- Avoid mass-generated near-duplicates. Same template is fine; same content is not.

## Audit Output Format

When auditing, report:

```text
광고 준비도:
- 통과 / 보완 필요

리스크:
- [high|medium|low] 위치/문구 — 문제 — 수정 방향

필수 보완:
- ...

광고 삽입 가능 여부:
- 지금 가능 / 정책 보완 후 가능 / 콘텐츠 확충 후 가능
```

## Implementation Workflow

For code changes:

1. Inspect current page/layout and privacy policy.
2. Check ad slots and labels.
3. Check risky fortune copy.
4. Add or adjust placeholders first.
5. Only add real ad script when the user explicitly asks and publisher/client IDs are available.
6. Run frontend build after changes.

## References

Use official docs when current policy precision matters:

- Google AdSense eligibility: `https://support.google.com/adsense/answer/9724`
- AdSense program policies: `https://support.google.com/adsense/answer/48182`
- Required privacy/cookie content: `https://support.google.com/adsense/answer/1348695`
- Google Publisher Policies: `https://support.google.com/adsense/answer/10502938`
