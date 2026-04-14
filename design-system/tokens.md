# Design System — Tokens

This is the authoritative list of DS tokens used by the Wiom CSP redesign flavor. Tokens live in `core/common/src/main/java/com/wiom/csp/core/common/theme/WiomTokens.kt` with getter-based forks gated on `WiomDsMode.isRedesign`.

---

## Token fork mechanism

```kotlin
object WiomColors {
    val stateSuccess: Color
        get() = if (WiomDsMode.isRedesign) Color(0xFF008043) else Color(0xFF1A7F37)
    // ... etc
}
```

Every design value that differs between staging and redesign uses this pattern — no compile-time branching, no duplicate files. The runtime flag is set once in `WiomCspApplication.onCreate()`.

---

## Color tokens

### Brand

| Token | Hex | Usage |
|---|---|---|
| `brand600` | `#D9008D` | Primary CTA fill, primary text accents, chevrons |
| `brandSecondary` | `#443152` | Partner app header (bg_partner_header) |

### Neutral

| Token | Hex | Usage |
|---|---|---|
| `textPrimary` | `#161021` | Primary text |
| `textSecondary` | `#665E75` | Secondary text, metadata, icons-on-neutral |
| `textHint` | `#A7A1B2` | Hint, disabled, version strings |
| `border` | `#D7D3E0` | Borders, dividers, sheet drag handles |
| `bgSubtle` | `#E8E4F0` | Subtle backgrounds |
| `bgLavender` | `#F1EDF7` | Icon circle backgrounds |
| `bgScreen` | `#FAF9FC` | Page background |
| `surfaceCard` | `#FFFFFF` | Card background (elevated) |

### Semantic / state

| Token | Hex | Used by |
|---|---|---|
| `stateSuccess` | `#008043` | COMPLETED, proof-passed, confirmed |
| `stateError` | `#D92130` | Not used for "step back" actions |
| `stateWarning` | `#B85C00` | Low stock, cap-hit, IN_PROGRESS deadline pill |
| `stateInfo` | `#6D17CE` | INSTALL_SUBMITTED, VERIFICATION_PENDING, info banners |

### Backgrounds (tinted)

| Token | Hex | Used by |
|---|---|---|
| `bgSuccess` | `#E6F4EC` | COMPLETED banner |
| `bgWarning` | `#FFF3E6` | IN_PROGRESS banner, low-stock chips |
| `bgInfo` | `#F2E9FC` | Submitted / verifying banners |
| `bgError` | `#FDEAEC` | True error states (never exit-install) |

---

## Typography

### Font families

| Script | Family | Picker rule |
|---|---|---|
| Latin | Noto Sans | Default |
| Devanagari | Noto Sans Devanagari | Auto-pick when text matches `/[\u0900-\u097F]/` |

### Styles

| Style | Size | Weight | Use |
|---|---|---|---|
| `heroAmount` | 32sp | Bold | Wallet balance hero |
| `titleLg` | 24sp | Bold | Action sheet titles |
| `titleMd` | 20sp | SemiBold | Section headers (pre-redesign: Bold, redesigned to SemiBold) |
| `titleSm` | 16sp | SemiBold | Banner titles, card titles |
| `bodyLg` | 16sp | Regular | Action sheet labels, radio options |
| `body` | 14sp | Regular | Drilldown body text |
| `bodySm` | 13sp | Regular | Profile subtext, metadata |
| `label` | 12sp | SemiBold | CTA text, chips |
| `metaXs` | 10sp | Regular | Badge counts, version strings |

### Devanagari adjustments

- Respectful plural verbs: `काम कर रहे हैं`, not `काम कर रहा है`
- Oblique case for time expressions: `किसी भी वक्त`, not `कोई भी वक्त`
- Short `ि` matra for "ve-ri-faai": `वेरिफाई`, not `वेरीफाई` (long `ी` creates visible gap)
- Anusvara vs half-n: prefer anusvara where phonology allows

---

## Spacing

All values are multiples of 4. The DS enforces a 4-grid.

| Token | Value | Use |
|---|---|---|
| `xs` | 4dp | Tight icon-text gap |
| `sm` | 8dp | Chip padding, tight row gap |
| `md` | 12dp | Card inner gap |
| `lg` | 16dp | Default content padding |
| `xl` | 24dp | Section gap, sheet title → content gap |
| `xxl` | 48dp | Sheet content → CTA gap |

---

## Radius

| Token | Value | Use |
|---|---|---|
| `radiusTiny` | 6dp | Tiny chips (slot status badges) |
| `radiusSmall` | 8dp | Small chips (was 6dp pre-redesign) |
| `radiusMd` | 12dp | Cards |
| `radiusLg` | 16dp | Buttons (WiomButton) |
| `radiusXl` | 24dp | Large surfaces, sheet top corners |
| `radiusPill` | 999dp | Full pill |

---

## Elevation

| Token | Value | Use |
|---|---|---|
| `elevNone` | 0dp | Flat surfaces |
| `elevCard` | 1dp | Cards on neutral screen bg |
| `elevSheet` | 8dp | Bottom sheets |
| `interCardGap` | 12dp | Space between cards in feed |

The redesign prefers **flat surfaces + 1dp borders** over drop shadows where possible. The sticky CTA bar is flat with a 1dp border-top (wiom-cta skill §5 rule 9).

---

## Where the forks apply

In `WiomTokens.kt`:
- `stateSuccess` / `stateError` / `stateWarning` / `stateInfo` — all 4 flipped
- `heroAmount`, `metaXs` — added (new in redesign)
- `radiusSmall` 6dp → 8dp
- Button font weight Bold → SemiBold

Pre-redesign values are preserved in the `else` branch of each getter so the staging build remains unchanged.
