# Typography

## Font families

| Script | Family | Source |
|---|---|---|
| Latin | Noto Sans | Bundled |
| Devanagari | Noto Sans Devanagari | Bundled |

### Auto-detection rule

When picking a font family for runtime-provided text (e.g. an executor name, a deadline string), auto-detect the script:

```kotlin
val isDevanagari = Regex("[\\u0900-\\u097F]").containsMatchIn(text)
val family = if (isDevanagari) NotoSansDevanagari else NotoSans
```

This matters because hard-coding `NotoSans` on a Devanagari string renders with the Latin fallback glyphs, which look visibly wrong.

### Style names to watch

- **Inter** uses `"Semi Bold"` (with space)
- **Noto Sans / Noto Sans Devanagari** use `"SemiBold"` (no space)

When creating TextStyle, always check with `figma.listAvailableFontsAsync()` or the Android equivalent before assuming a style name exists.

---

## Type scale (redesign flavor)

| Style | Size | Weight | Family preferences | Use |
|---|---|---|---|---|
| `heroAmount` | 32sp | Bold | Noto Sans | Wallet hero balance only |
| `titleLg` | 24sp | Bold | Auto | Action sheet titles |
| `titleMd` | 20sp | SemiBold | Auto | Section headers |
| `titleSm` | 16sp | SemiBold | Auto | Banner titles, card titles |
| `bodyLg` | 16sp | Regular | Auto | Sheet labels, radio options |
| `body` | 14sp | Regular | Auto | Drilldown body |
| `bodySm` | 13sp | Regular | Auto | Subtext, metadata |
| `label` | 12sp | SemiBold | Auto | CTA text, chip text |
| `metaXs` | 10sp | Regular | Auto | Badge counts, version strings |

### Redesign-flavor deltas vs staging

- `titleMd` dropped from Bold → **SemiBold** (readability at small sizes)
- `heroAmount` added (new)
- `metaXs` added (new — for badge counts)
- Button font weight Bold → SemiBold

---

## Devanagari adjustments

### Respectful plural for executors

`काम कर रहे हैं` (plural, respectful) is used wherever the CSP refers to an executor by name. `काम कर रहा है` (singular) is considered disrespectful in peer-to-peer tier-2/3 speech.

### Oblique case for time expressions

- `किसी भी वक्त` (oblique) ✅
- `कोई भी वक्त` (nominative) ❌ — grammatically wrong in this context

### Matra choice for English loanwords

- Short `ि` for "ve-ri-faai" — `वेरिफाई`, `वेरिफिकेशन`
- Long `ी` (`वेरीफाई`) creates a visible horizontal gap that reads as a broken word

### Anusvara `ं` preferred

Use `ं` over half-character constructions where phonology allows.

---

## `maxLines` rules

| Element | maxLines | Why |
|---|---|---|
| `InstallStateBanner` title | **2** (was 1) | Event-style titles like `{name} ने कनेक्शन सेटअप में देरी कर दी` don't fit on 1 line |
| `InstallStateBanner` subtitle | 1 | Keep scannable |
| Card title | 1 | Fixed height |
| Drilldown body paragraphs | unlimited | Content-driven |

---

## Line heights

- Titles: 1.25× font size
- Body: 1.5× font size
- Labels: 1.2× font size (tight)

Devanagari needs slightly more vertical room than Latin at the same font size because of descenders and matras — budget an extra 1-2sp where a single line is visibly cramped.
