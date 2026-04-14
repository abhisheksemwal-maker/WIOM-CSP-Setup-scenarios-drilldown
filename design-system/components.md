# Design System — Components (redesign flavor)

This doc describes the new component layer added in `core:common` as part of the Pratibimb DS redesign. All components are forked by `WiomDsMode.isRedesign` where their staging equivalents differ.

---

## WiomButton

A polymorphic CTA component. Replaces ad-hoc `Button` / `OutlinedButton` / `TextButton` usages across the feature modules.

```kotlin
enum class WiomButtonType { Primary, Secondary, Tertiary, Destructive }

@Composable
fun WiomButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    type: WiomButtonType = WiomButtonType.Primary,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
)
```

### Type rules

| Type | Fill | Text | Border | When |
|---|---|---|---|---|
| `Primary` | `brand600` | white | none | Main positive action (one per surface) |
| `Secondary` | white | `textPrimary` | 1dp `border` | Alt positive action, "back" |
| `Tertiary` | transparent | `textPrimary` | none | Link-style, inline actions |
| `Destructive` | `bgError` | `stateError` | none | **Only** for irreversible data loss |

### Geometry

- Min height: 48dp (HUG sizing)
- Corner radius: 16dp (`radiusLg`)
- Padding: 16dp horizontal, 12dp vertical
- Text: SemiBold 14sp (pre-redesign: Bold)
- Icon + text gap: 8dp

### Reversibility test (Destructive or not?)

Ask: *if the user taps this by mistake, can they get back to the previous state in one step?*
- Exit install → task reverts to queue → **reversible** → Secondary/Tertiary, not Destructive
- Cancel booking → customer can re-book → **reversible** → not Destructive
- Logout → user can log back in → **reversible** → not Destructive
- Delete draft → data is gone → **irreversible** → Destructive
- Return NetBox (confirm) → state is final → Destructive

See [`/specs/ai-spec.md`](../specs/ai-spec.md) for the full reversibility rule and past incidents.

---

## WiomBadge family

| Component | Shape | Use |
|---|---|---|
| `WiomBadgeCount` | Circle | Numeric badges (notif count, unread) |
| `WiomBadgeDot` | Small filled dot | Presence indicator |
| `WiomBadgeLabelTinted` | Rounded rect | Chips with tinted bg + colored text |

`WiomBadgeLabelTinted` signature:
```kotlin
fun WiomBadgeLabelTinted(
    text: String,
    bg: Color,
    fg: Color,
    modifier: Modifier = Modifier,
)
```

Used by `SlotStatusBadge` (radius-tiny + SemiBold 10sp) for slot chip states (PROPOSED / CONFIRMED / EXPIRED / CANCELLED / REJECTED).

---

## WiomNavRow

Navigation affordance — **not** a CTA. Right chevron row for "view X" or "manage Y" entries. Distinct from `WiomButton.Tertiary` which is for actions.

```kotlin
@Composable
fun WiomNavRow(
    title: String,
    subtitle: String? = null,
    leadingIcon: ImageVector? = null,
    onClick: () -> Unit,
)
```

Rendered as: `[icon] title   subtitle   ›`

---

## WiomCtaBar

Flat bottom container for sticky primary actions. Implements wiom-cta skill §5 rule 9: flat bar with 1dp border-top.

```kotlin
@Composable
fun WiomCtaBar(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
)
```

- Background: `surfaceCard`
- Border-top: 1dp `border`
- Shadow: none
- Padding: 16dp horizontal, 12dp vertical
- Vertical stack: primary CTA first, optional tertiary below (or overflow menu)

CTAs inside `WiomCtaBar` live **outside** the scroll container (sd-autolayout §6c). The drilldown body scrolls independently above the bar.

---

## InstallStateBanner

Per-state banner surfaced at the top of the install drilldown body. State-aware title + subtitle + icon + bg color.

```kotlin
data class BannerVariant(
    val icon: ImageVector,
    val title: String,
    val subtitle: String,
    val bg: Color,
    val accent: Color,
)

fun bannerVariantFor(state: InstallState, executorName: String = ""): BannerVariant
```

See [`/drilldowns/`](../drilldowns/) for the per-state title / subtitle copy and [`/ux-copy/changelog.md`](../ux-copy/changelog.md) for the before → after.

### Geometry
- Full-width card, 16dp padding, 12dp radius
- Icon 24dp, accent color
- Title: 16sp SemiBold, `maxLines = 2` (was 1 — increased for longer event-style titles)
- Subtitle: 13sp Regular, `textSecondary`

---

## Sheet components (polished this session)

### SlotProposalSheet
- Title: `स्लॉट प्रस्तावित करें` — 24sp Bold (was 16sp)
- Content → CTA gap: 48dp (was 16dp)
- Body labels: 16sp Regular (was 14sp)
- Uses WiomButton Primary + Tertiary
- **No acknowledge checkbox** — a checkbox was proposed during the session based on a wiom-cta pattern extrapolation, then removed after pushback. See [`/specs/ai-spec.md`](../specs/ai-spec.md) §no-improvisation.

### ExecutorAssignmentSheet
- Title: `सेटअप कौन करेगा?` (was "व्यक्ति चुनें")
- Radio list: Annu / others, no `(स्वयं)` suffix
- Drag handle color: `#D7D3E0` (`border` token) — DS standard

### ExitReasonSheet
- Destructive Primary (red) + Secondary `वापस` side-by-side
- Radio list of reasons
- 48dp content → CTA gap

---

## Not redesigned (deliberate)

- `WiomHeader` — unchanged
- `AssuranceStrip` — unchanged (polish deferred)
- `WiomDrawerContent` — unchanged
- `WiomToast` — unchanged
