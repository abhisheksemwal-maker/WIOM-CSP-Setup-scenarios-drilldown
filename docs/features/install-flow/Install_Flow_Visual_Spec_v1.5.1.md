# CSP APP — Install Flow Visual Spec v1.5.1 (Pratibimb Redesign Delta)

**Date:** April 15, 2026
**Supersedes:** [`Install_Flow_Visual_Spec_v1.5.md`](https://github.com/wiom-tech/wiom-csp-app-apr09/blob/release-01/docs/features/install-flow/Install_Flow_Visual_Spec_v1.5.md) (April 9, 2026 — "Draft, pending freeze")
**Surface:** Install Flow (assignment → scheduling → dispatch → delegation → work module → verification → closure)
**Depends on:**
- Component Registry v1.1 — tokens, card spec (2-line, no CTA), CSP accountability model (§5), accent rules
- Wiom DS v2 foundations (wiom-cta, wiom-badge, sd-autolayout, sd-text-container, wiom-design-foundations)
**Brief:** UX Agent Brief — Install Flow v3 (FINAL) + Pratibimb session directive 2026-04-14
**Status:** Draft — pending merge into `wiom-tech/wiom-csp-app-apr09@release-01` via feature PR

---

## What changed v1.5 → v1.5.1

| # | Change | Source |
|---|---|---|
| 1 | **`InstallStateBanner`** — per-state title/subtitle banner at top of drilldown scroll body (13 variants + icon + bg + accent) | Pratibimb 2026-04-14 |
| 2 | **Sticky `WiomCtaBar`** — flat bottom CTA container with 1dp border-top, CTA outside scroll | wiom-cta §5 rule 9 + sd-autolayout §6c |
| 3 | **`WiomButton`** polymorphic CTA — Primary / Secondary / Tertiary / Destructive with leading/trailing icon slots | wiom-cta + session directive |
| 4 | **Exit reclassified** as reversible Tertiary in neutral color (not Destructive red). Moved from §5 bottom row → triple-dot overflow menu for all states except `AWAITING_SLOT_PROPOSAL` where it's **inline Tertiary below primary** | session directive + `feedback_destructive_vs_reversible_ctas.md` |
| 5 | **Vocab register shift** — `ग्राहक` → `कनेक्शन`, `व्यक्ति` → `टेक्निशियन`, `इंस्टॉल` → `सेटअप` throughout install surface copy | session directive + `feedback_wiom_hindi_copy_anchors.md` |
| 6 | **Devanagari transliteration** for English loanwords mid-string — `submit` → `सबमिट`, `verify` → `वेरिफाई` (short ि, not long ी), `confirm` → `कन्फर्म`, `cancel` → `कैंसल` | session directive |
| 7 | **Respectful plural** for named executors — `{name} काम कर रहे हैं`, not `काम कर रहा है` | session directive |
| 8 | **Oblique case** for time expressions — `किसी भी वक्त`, not `कोई भी वक्त` | session directive |
| 9 | **Slot badge tone-down** — `PROPOSED` + `ACTIVE` render as grey text `पेंडिंग है` (no pill background), not state.info purple pill | session direction: "grey text suits better instead of purple chip design" |
| 10 | **Slot filter rule** — when any slot is `CONFIRMED`, hide all non-confirmed siblings | session directive |
| 11 | **State-aware executor header** — action form `टेक्निशियन चुनें` when `task.executor == null`, informational form `टेक्निशियन` otherwise | session directive |
| 12 | **CTA type shift in in-progress / delegated-working states** — Primary `शुरू करें` → Tertiary link-style `कनेक्शन को कॉल करें` with trailing Call icon. Primary affordance is customer coordination, not a structural action | session directive |
| 13 | **`INSTALL_SUBMITTED` as separate state** (split from VERIFICATION_PENDING) — queued vs actively-verifying | Option C |
| 14 | **`SCHEDULING_FAILED` hidden from CSP feed** via `buildTaskFeed()` filter | session directive |
| 15 | **Routing bug fix** — `DELEGATED_OVERDUE` primary CTA now opens executor sheet (was silently falling through to slot sheet) | source-tree bug found this session |
| 16 | **Slot-data callback fix** — `onSlotSubmitted(id, s1d, s1t, s2d, s2t)` now threads slot data through 4 files. Pre-fix, re-submits silently showed the old expired slots | source-tree bug found this session |
| 17 | **Home card fix** — `reasonTimerDisplay` for INS-1052 uses respectful plural (was `सुनील काम कर रहा है`, now `काम कर रहे हैं` — matches banner) | validator-caught drift |
| 18 | **Missing label `cta.start_installation`** added (`सेटअप शुरू करें` / `Start setup`) — was rendering the placeholder `[cta.start_installation]` literally | source-tree drift |

---

## 0. Baseline and scope

This document is a **delta** against v1.5. Read v1.5 first for the full baseline. This file replaces only the sections that change. Everything in v1.5 not explicitly superseded here stands as-is.

### What is NOT changed from v1.5

- §0 Objective — unchanged
- §1 Surface Classification — unchanged (same 5 surfaces)
- §2.1 through §2.4 Card field values — unchanged
- §2.5 End transition states — unchanged except INSTALL_SUBMITTED added
- §2.6–§2.9 Card rules / P74 / Timer / Masked call — unchanged
- §3 Exit principle — unchanged (still: execution surface clean, exit in drilldown)
- §4 Action sheets — same 3 sheets, same 3 triggers; copy changes per §1 tables
- §5 Drilldown skeleton — unchanged (same sections in same order); additions listed per-state in §3 of this doc
- §6 Post-Action Behavior — unchanged
- §7 Edge States — unchanged
- §8 Notifications — 2 keys touched, otherwise unchanged
- §9 Behavioral Invariants (22) — all 22 still hold
- §11 Component Map — **extended** with `InstallStateBanner`, `WiomButton`, `WiomBadge`, `WiomNavRow`, `WiomCtaBar`
- §12 What NOT to Build — unchanged
- §13 Validation Checklist — extended with 4 new items (see §6 of this doc)

---

## 1. Label delta — OLD → KEY → NEW

### 1.1 Section labels (`drilldown.*`)

| v1.5 (OLD) | Key | v1.5.1 (NEW) | Notes |
|---|---|---|---|
| स्थान | `drilldown.location_section` | जगह | Aligned with restore bundle (cross-bundle collision resolved; restore was silently overriding install) |
| शेड्यूल | `drilldown.schedule_section` | कनेक्शन लगने का समय | Explicit over bare "schedule" |
| व्यक्ति | `drilldown.executor_section` | टेक्निशियन चुनें (when `task.executor == null`) | Action form |
| — (new variant) | `drilldown.executor_section.assigned` **(NEW)** | टेक्निशियन | Informational form once executor is assigned |

### 1.2 Flow reason lines (`reason.*`)

| v1.5 (OLD) | Key | v1.5.1 (NEW) | Reason |
|---|---|---|---|
| समय भेजें — ग्राहक को बताना है | `reason.propose_slots` | समय चुनना बाकी है | Action cue over passive status; drop second clause |
| ग्राहक चुन रहा है | `reason.awaiting_customer` | कनेक्शन अभी स्लॉट कन्फर्म कर रहे हैं | ग्राहक → कनेक्शन; Devanagari कन्फर्म |
| समय पक्का हो गया | `reason.slot_confirmed` | समय चुन लिया गया है | Active voice |
| तैयार — भेजने से पहले | `reason.scheduled` | कनेक्शन तैयार है · स्लॉट आने वाला है | Surface actor + next beat |
| आज का काम — तैयार | `reason.scheduled_today` | आज का काम · तैयार रहें | Punctuation + cue |
| फिर से समय भेजें | `reason.reschedule` | कनेक्शन के लिए नया समय चुनें | Action cue, event framing |
| ग्राहक से पुष्टि हो रही है | `reason.scheduling_failed` | कनेक्शन ने कन्फर्म नहीं किया | Factual, not aspirational |
| इंस्टॉल चल रहा है | `reason.in_progress` | सेटअप चल रहा | Register shift |

### 1.3 CTA labels (`cta.*`)

| v1.5 (OLD) | Key | v1.5.1 (NEW) | Note |
|---|---|---|---|
| समय भेजें | `cta.propose_slots` | स्लॉट प्रस्तावित करें | Role-specific verb |
| व्यक्ति चुनें | `cta.assign_executor` | टेक्निशियन चुनें | Role-specific noun |
| कॉल करें | `cta.call_customer` | कनेक्शन को कॉल करें | ग्राहक → कनेक्शन |
| — (missing) | `cta.start_installation` **(NEW)** | सेटअप शुरू करें / Start setup | Was rendering `[cta.start_installation]` placeholder |
| पुष्टि करें | `cta.confirm_exit` | पुष्टि करें | Unchanged |
| शुरू करें | `cta.dispatch` | शुरू करें | Unchanged |
| समय भेजें | `cta.submit_slots` | समय भेजें | Unchanged |
| चुनें | `cta.assign` | चुनें | Unchanged |

### 1.4 Slot badges (`slot.*`)

| v1.5 (OLD) | Key | v1.5.1 (NEW) | Note |
|---|---|---|---|
| भेजा गया | `slot.proposed` | पेंडिंग है | Grey-text pattern (see §3.5 INS-1042) |
| जवाब बाकी | `slot.active` | पेंडिंग है | Same |
| पक्का | `slot.confirmed` | कन्फर्म है | Devanagari transliteration |
| समाप्त | `slot.expired` | समाप्त | Unchanged |

### 1.5 Exit labels (`exit.*`) — UNCHANGED

All 6 keys from v1.5 kept verbatim. `exit.CUSTOMER_CANCELLED` keeps `ग्राहक` because the English label pair is "Customer cancelled" and this is a structured exit reason code, not display copy.

### 1.6 Context labels

| v1.5 (OLD) | Key | v1.5.1 (NEW) | Note |
|---|---|---|---|
| कौन करेगा इंस्टॉल? | `executor.title` | सेटअप कौन करेगा? | Register shift |
| — | `executor.install.title` **(NEW)** | सेटअप कौन करेगा? | New key to kill cross-bundle collision with restore's `कौन ठीक करेगा?` |
| समय आने पर उपलब्ध | `contact.not_yet` | समय आने पर उपलब्ध | Unchanged |
| ग्राहक से पुष्टि हो रही है | `scheduling_failed_system_handling` | कनेक्शन से पुष्टि हो रही है | ग्राहक → कनेक्शन |

### 1.7 Notification labels (`notif.*`)

| v1.5 (OLD) | Key | v1.5.1 (NEW) |
|---|---|---|
| नया इंस्टॉल — समय भेजें | `notif.new_assignment` | नया सेटअप मिला |
| जल्दी समय भेजें — काम जा सकता है | `notif.act_soon` | Unchanged |
| ग्राहक ने समय चुना — व्यक्ति चुनें | `notif.slot_confirmed` | कनेक्शन ने समय चुना — टेक्निशियन चुनें |
| फिर से समय भेजें | `notif.reschedule_needed` | Unchanged |
| समय सीमा करीब | `notif.install_deadline` | सेटअप का समय पास |

### 1.8 Source/section keys — UNCHANGED

All 6 kept verbatim.

### 1.9 Banner strings — NEW (27 proposed keys)

Currently inlined as Unicode escapes in `InstallStateBanner.kt`. Proposed migration to JSON:

| Proposed key | hi value |
|---|---|
| `banner.awaiting_slot_proposal.title` | समय चुनना बाकी है |
| `banner.awaiting_slot_proposal.subtitle` | कनेक्शन से दो स्लॉट पूछने हैं |
| `banner.awaiting_customer.title` | कनेक्शन चुन रहा है |
| `banner.awaiting_customer.subtitle` | दो स्लॉट भेजे हैं · जवाब का इंतज़ार |
| `banner.slot_confirmed.title` | स्लॉट पक्का हुआ |
| `banner.slot_confirmed.subtitle` | अब टेक्निशियन चुनना है |
| `banner.scheduled.title` | सेटअप पक्का हुआ |
| `banner.scheduled_today.title` | आज सेटअप का दिन है |
| `banner.scheduled_today.subtitle` | किसी भी वक्त शुरू कर सकते हो |
| `banner.reschedule.title` | कनेक्शन के लिए नया समय चुनें |
| `banner.reschedule.subtitle` | दोबारा स्लॉट प्रस्ताव भेजो |
| `banner.scheduling_failed.title` | कनेक्शन ने स्लॉट कन्फर्म नहीं किया |
| `banner.scheduling_failed.subtitle` | पुराने स्लॉट कैंसल हुए · CSP कोई काम नहीं |
| `banner.in_progress.title` | सेटअप पर काम चल रहा है |
| `banner.in_progress.subtitle_template` | {executorName} काम कर रहे हैं |
| `banner.in_progress.subtitle_fallback` | काम चालू है |
| `banner.install_submitted.title` | सेटअप सबमिट हुआ |
| `banner.install_submitted.subtitle` | वेरिफाई के लिए तैयार |
| `banner.delegated_not_started.title_template` | {executorName} ने सेटअप अभी शुरू नहीं किया |
| `banner.delegated_not_started.title_fallback` | सेटअप अभी शुरू नहीं हुआ |
| `banner.delegated_not_started.subtitle` | जो व्यक्ति चुना है उसका इंतज़ार |
| `banner.delegated_in_progress.title_template` | {executorName} काम कर रहे हैं |
| `banner.delegated_in_progress.title_fallback` | काम चालू है |
| `banner.delegated_in_progress.subtitle` | सेटअप पर काम चल रहा है |
| `banner.delegated_overdue.title_template` | {executorName} ने कनेक्शन सेटअप में देरी कर दी |
| `banner.delegated_overdue.title_fallback` | टेक्निशियन ने कनेक्शन सेटअप में देरी कर दी |
| `banner.delegated_overdue.subtitle` | सेटअप को जल्दी पूरा करवाएं |
| `banner.verification_pending.title` | सेटअप वेरिफाई हो रहा है |
| `banner.verification_pending.subtitle` | व्योम जाँच रहा है |
| `banner.resolved.title` | सेटअप पूरा हुआ |
| `banner.resolved.subtitle` | कनेक्शन का नेट चालू है |

**PR recommendation:** add these 31 keys (some are template/fallback pairs) to `install_labels_v1.4_hi_en.json` and migrate `InstallStateBanner.bannerVariantFor()` to `WiomLabels.get(...)`.

---

## 2. CTA map — text, key, type, location, action, tokens (per state)

For every install state, this table defines the primary CTA, its rendering location, the tap action, and the design tokens that style it. All CTAs use `WiomButton` with the declared `type`.

| State | CTA text (hi) | Key | Type | Location | Action | Leading icon | Trailing icon |
|---|---|---|---|---|---|---|---|
| `AWAITING_SLOT_PROPOSAL` | स्लॉट प्रस्तावित करें | `cta.propose_slots` | Primary | Sticky `WiomCtaBar` | Opens `SlotProposalSheet` | — | — |
| `AWAITING_SLOT_PROPOSAL` (secondary exit) | नहीं कर पाएँगे | `exit.link` | Tertiary | **Inline** below primary in WiomCtaBar | Opens `ExitReasonSheet` | — | — |
| `AWAITING_CUSTOMER_SELECTION` | — | — | — | — | — | — | — |
| `SLOT_CONFIRMED` | टेक्निशियन चुनें | `cta.assign_executor` | Primary | Sticky `WiomCtaBar` | Opens `ExecutorAssignmentSheet` | — | — |
| `SCHEDULED` (slot day) | सेटअप शुरू करें | `cta.start_installation` | Primary | Sticky `WiomCtaBar` | Navigates to install flow | — | — |
| `SCHEDULED` (future) | — | — | — | — | — | — | — |
| `NEEDS_RESCHEDULING` | स्लॉट प्रस्तावित करें | `cta.propose_slots` | Primary | Sticky `WiomCtaBar` | Opens `SlotProposalSheet` | — | — |
| `SCHEDULING_FAILED` | — | — | — | — | Feed-hidden; no drilldown surface required | — | — |
| `IN_PROGRESS` (self) | कनेक्शन को कॉल करें | `cta.call_customer` | **Tertiary** | Sticky `WiomCtaBar` | `Intent.ACTION_DIAL` (masked call) | — | `Icons.Filled.Call` |
| `INSTALL_SUBMITTED` | — | — | — | — | — | — | — |
| `DELEGATED_NOT_STARTED` | कनेक्शन को कॉल करें | `cta.call_customer` | Tertiary | Sticky `WiomCtaBar` | Masked call | — | `Icons.Filled.Call` |
| `DELEGATED_IN_PROGRESS` | कनेक्शन को कॉल करें | `cta.call_customer` | Tertiary | Sticky `WiomCtaBar` | Masked call | — | `Icons.Filled.Call` |
| `DELEGATED_OVERDUE` | टेक्निशियन बदलें | `cta.assign_executor` | **Secondary** | Sticky `WiomCtaBar` | Opens `ExecutorAssignmentSheet` | — | — |
| `VERIFICATION_PENDING` | — | — | — | — | — | — | — |
| `RESOLVED` | — | — | — | — | — | — | — |
| **All states except `AWAITING_SLOT_PROPOSAL`** (exit) | नहीं कर पाएँगे | `exit.link` | Tertiary | **Triple-dot overflow menu** in ModuleHeader | Opens `ExitReasonSheet` | — | — |

### 2.1 CTA design tokens (applies to every WiomButton instance)

| Property | Primary | Secondary | Tertiary | Destructive |
|---|---|---|---|---|
| Background | `WiomColors.brandPrimary` (#D9008D) | `WiomColors.bgSurface` (#FFFFFF) | transparent | `WiomColors.bgNegative` (#FFE5E7 redesign) |
| Text color | `WiomColors.textOnBrand` (#FFFFFF) | `WiomColors.textPrimary` (#161021) | `WiomColors.textPrimary` (#161021) | `WiomColors.stateNegative` (#D92130 redesign) |
| Border | none | 1dp `WiomColors.strokeSecondary` (#D7D3E0) | none | none |
| Typography | `WiomTextStyle.cta` — 16sp SemiBold (redesign) / Bold (baseline) | same | same | same |
| Min height | `WiomComponent.ctaHeight` = 52dp (≥48dp tap target) | same | same | same |
| Corner radius | `WiomRadius.cta` = 16dp | same | same | same |
| Horizontal padding | `WiomComponent.ctaPaddingHorizontal` = 16dp | same | same | same |
| Vertical padding | `WiomComponent.ctaPaddingVertical` = 12dp | same | same | same |
| Icon-text gap | `WiomSpacing.sm` = 8dp | same | same | same |
| Pressed bg | `WiomColors.brandPrimaryPressed` | ripple | ripple | ripple |

### 2.2 WiomCtaBar (sticky bottom container)

| Property | Token |
|---|---|
| Background | `WiomColors.bgSurface` (#FFFFFF) |
| Border-top | 1dp `WiomColors.strokePrimary` (#E8E4F0) |
| Shadow | none (flat) |
| Horizontal padding | `WiomSpacing.lg` = 16dp |
| Vertical padding | `WiomSpacing.md` = 12dp |
| Inter-button gap (when stacked) | `WiomSpacing.sm` = 8dp |

### 2.3 Overflow menu (triple-dot)

| Property | Token |
|---|---|
| Container bg | `WiomColors.bgSurface` |
| Item text style | `WiomTextStyle.menuItem` — 16sp Regular |
| Item text color | `WiomColors.textPrimary` (exit is **neutral**, not destructive red) |
| Item min height | 48dp |
| Item horizontal padding | `WiomSpacing.lg` = 16dp |

---

## 3. Per-state drilldown callouts with design tokens

Each state has:
- **Structural callouts** (HIDDEN / FORMAT / NEW / MODIFIED)
- **Banner token table** (InstallStateBanner properties per state)
- **Deadline pill token table** (if different from default)
- **Section token notes** (only where they differ from the generic drilldown)

All states inherit the shared drilldown skeleton token values:
- Screen bg: `WiomColors.bgScreen` (#FAF9FC redesign)
- Section gap: `WiomSpacing.xxl` = 24dp
- Card surface: `WiomColors.bgSurface` (#FFFFFF)
- Card radius: `WiomRadius.card` = 12dp
- Card padding: `WiomSpacing.cardPadding` = 16dp (redesign)
- Card border: 1dp `WiomColors.strokePrimary`
- Inter-card gap: `WiomElevation.interCardGap` = 16dp (redesign)

---

### 3.1 INS-1041 — AWAITING_SLOT_PROPOSAL

#### Callouts
- **HIDDEN** Executor section (v1.5 "from SLOT_CONFIRMED onward")
- **HIDDEN** Scheduling slot rows (no slots exist)
- **NEW** `InstallStateBanner` at top of scroll body
- **FORMAT** Deadline pill text weight Regular → Bold
- **MODIFIED** Exit link: from §5 bottom row → **inline Tertiary below primary in WiomCtaBar**
- **MODIFIED** `cta.propose_slots` text: समय भेजें → स्लॉट प्रस्तावित करें

#### Banner
| Property | Token / Value |
|---|---|
| Title (hi) | समय चुनना बाकी है |
| Subtitle (hi) | कनेक्शन से दो स्लॉट पूछने हैं |
| Icon | `Icons.Filled.Schedule`, 20dp |
| Icon tint | `WiomColors.stateWarning` (#B85C00 redesign) |
| Background | `WiomColors.bgUrgent` (#FFF2BF redesign) |
| Accent (title color) | `WiomColors.stateWarning` |
| Subtitle color | `WiomColors.textPrimary` |
| Title style | `WiomTextStyle.cardIdentity` — 14sp SemiBold / 24sp LH |
| Subtitle style | `WiomTextStyle.bodySmall` — 12sp Regular / 20sp LH |
| Title `maxLines` | 2 |
| Container radius | `WiomRadius.card` = 12dp |
| Container padding | horizontal `WiomSpacing.lg` (16dp), vertical `WiomSpacing.md` (12dp) |
| Elevation | 2dp shadow (wiom-design-foundations shadow.md) |
| Icon-text gap | `WiomSpacing.sm` = 8dp |

#### Deadline pill
| Property | Token / Value |
|---|---|
| Font weight | Bold (was Regular) |
| Text color | `WiomColors.textPrimary` |
| Style | `WiomTextStyle.reasonTimer` = 14sp SemiBold → **override to Bold for this redesign** |

#### CTAs
| Slot | Element | Token |
|---|---|---|
| Primary (sticky) | `WiomButton` Primary `स्लॉट प्रस्तावित करें` | see §2.1 Primary row |
| Inline tertiary (in same bar, below primary) | `WiomButton` Tertiary `नहीं कर पाएँगे` | see §2.1 Tertiary row |

---

### 3.2 INS-1042 — AWAITING_CUSTOMER_SELECTION

#### Callouts
- **HIDDEN** Executor section (same rule as 1041)
- **HIDDEN** Primary CTA (state blocked on customer; no CSP action)
- **NEW** Banner
- **FORMAT** Slot status badge: v1.5 `ACTIVE` = `state.info` + `bg.info` pill → v1.5.1 **grey text**, no pill
- **MODIFIED** `slot.active` + `slot.proposed` = पेंडिंग है (identical, both slots)
- **MODIFIED** `reason.awaiting_customer` = ग्राहक चुन रहा है → कनेक्शन अभी स्लॉट कन्फर्म कर रहे हैं

#### Banner
| Property | Token / Value |
|---|---|
| Title | कनेक्शन चुन रहा है |
| Subtitle | दो स्लॉट भेजे हैं · जवाब का इंतज़ार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` (#6D17CE redesign — purple) |
| Background | `WiomColors.bgInfo` (#F1E5FF redesign) |
| Accent | `WiomColors.stateInfo` |
| Subtitle color | `WiomColors.textPrimary` |

#### Slot badge (both slots show `पेंडिंग है`)
| Property | Token / Value |
|---|---|
| Text | पेंडिंग है |
| Text color | `WiomColors.textSecondary` (#5C5570 redesign) |
| Background | none (no pill) |
| Text style | `WiomTextStyle.bodySmall` — 12sp Regular |
| Radius | — (no container) |

#### CTAs
| Slot | Element |
|---|---|
| Primary | — (disabled / not rendered) |
| Overflow | `नहीं कर पाएँगे` Tertiary — see §2.3 |

---

### 3.3 INS-1043 — SLOT_CONFIRMED

#### Callouts
- **NEW** Banner
- **FORMAT** Slot section filter: only the confirmed slot is shown; EXPIRED/CANCELLED siblings hidden
- **MODIFIED** `drilldown.executor_section` header = व्यक्ति → टेक्निशियन चुनें (action form)
- **MODIFIED** `cta.assign_executor` = व्यक्ति चुनें → टेक्निशियन चुनें
- **MODIFIED** `ExecutorAssignmentSheet` title = कौन करेगा इंस्टॉल? → सेटअप कौन करेगा?
- **MODIFIED** Executor sheet radio list: drop `(स्वयं)` suffix
- **FORMAT** Sheet drag handle color = `WiomColors.strokeSecondary` (#D7D3E0)

#### Banner
| Property | Token / Value |
|---|---|
| Title | स्लॉट पक्का हुआ |
| Subtitle | अब टेक्निशियन चुनना है |
| Icon | `Icons.Filled.Check` |
| Icon tint | `WiomColors.statePositive` (#008043 redesign) |
| Background | `WiomColors.bgPositive` (#E1FAED redesign) |
| Accent | `WiomColors.statePositive` |

#### Confirmed slot chip
| Property | Token / Value |
|---|---|
| Text | कन्फर्म है |
| Text color | `WiomColors.statePositive` |
| Background | `WiomColors.bgPositive` pill |
| Radius | `WiomRadius.tiny` = 4dp |
| Typography | `WiomTextStyle.chipState` — 12sp SemiBold / 0.3sp tracking |

#### Executor section (action header)
| Property | Token / Value |
|---|---|
| Header text | टेक्निशियन चुनें (bundle key `drilldown.executor_section`) |
| Header color | `WiomColors.textPrimary` |
| Header style | `WiomTextStyle.cardIdentity` |

#### CTAs
| Slot | Element |
|---|---|
| Primary (sticky) | Primary `टेक्निशियन चुनें` → `ExecutorAssignmentSheet` |
| Overflow | `नहीं कर पाएँगे` |

---

### 3.4 INS-1044 — IN_PROGRESS (self)

#### Callouts
- **NEW** Banner with executor-name template
- **MODIFIED** Primary CTA type: Primary solid → **Tertiary link-style with trailing Call icon**
- **MODIFIED** Timeline cue: `Install chalu hai` → `Slot aane wala hai` / today cue
- **DIVERGENCE from v1.5 §3** Exit in overflow menu allowed (v1.5 says no exit in IN_PROGRESS)
- **MODIFIED** `reason.in_progress` = इंस्टॉल चल रहा है → सेटअप चल रहा

#### Banner
| Property | Token / Value |
|---|---|
| Title | सेटअप पर काम चल रहा है |
| Subtitle (template) | `{executorName} काम कर रहे हैं` (respectful plural) |
| Subtitle (fallback) | काम चालू है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |
| Accent | `WiomColors.stateInfo` |

#### CTAs
| Slot | Element |
|---|---|
| Primary (sticky) | **Tertiary** `कनेक्शन को कॉल करें` + trailing `Icons.Filled.Call` → masked call |
| Overflow | `नहीं कर पाएँगे` |

---

### 3.5 INS-1045 — DELEGATED_OVERDUE

#### Callouts
- **NEW** Event-style banner with named actor + past-action verb
- **FORMAT** Banner title `maxLines = 2` (long names don't truncate)
- **FORMAT** Accent = negative color family (only state using red bg)
- **MODIFIED** Executor section shows `कन्फर्म है` chip (problem is execution, not assignment)
- **NEW** Inline call icon on right edge of executor row, aligned with chip above
- **MODIFIED** Primary CTA type = Secondary `टेक्निशियन बदलें`
- **FIX** Routing — `TaskDrilldownScreen` when-block now includes `DELEGATED_OVERDUE` → `ExecutorAssignmentSheet` (was falling through)

#### Banner
| Property | Token / Value |
|---|---|
| Title (template) | `{executorName} ने कनेक्शन सेटअप में देरी कर दी` |
| Title (fallback) | टेक्निशियन ने कनेक्शन सेटअप में देरी कर दी |
| Subtitle | सेटअप को जल्दी पूरा करवाएं |
| Icon | `Icons.Filled.Warning` |
| Icon tint | `WiomColors.stateNegative` (#D92130 redesign) |
| Background | `WiomColors.bgNegative` (#FFE5E7 redesign) |
| Accent | `WiomColors.stateNegative` |
| Title `maxLines` | 2 |

#### Inline call icon in executor row
| Property | Token / Value |
|---|---|
| Icon | `Icons.Filled.Call` |
| Tint | `WiomColors.textSecondary` |
| Size | 20dp |
| Tap target | 48dp × 48dp |
| Position | Right edge of row, vertically aligned with chip above |

#### CTAs
| Slot | Element |
|---|---|
| Primary (sticky) | **Secondary** `टेक्निशियन बदलें` → `ExecutorAssignmentSheet` |
| Overflow | `नहीं कर पाएँगे` |

---

### 3.6 INS-1046 — RESOLVED

#### Callouts
- **NEW** Banner
- **MODIFIED** Subtitle: `ग्राहक का नेट चालू है` → `कनेक्शन का नेट चालू है`
- **HIDDEN** No primary CTA (task done)

#### Banner
| Property | Token / Value |
|---|---|
| Title | सेटअप पूरा हुआ |
| Subtitle | कनेक्शन का नेट चालू है |
| Icon | `Icons.Filled.Check` |
| Icon tint | `WiomColors.statePositive` |
| Background | `WiomColors.bgPositive` |
| Accent | `WiomColors.statePositive` |

---

### 3.7 INS-1047 — SCHEDULED (slot day)

#### Callouts
- **NEW** Banner with today cue
- **NEW** Label key `cta.start_installation` (was rendering placeholder literally)
- **MODIFIED** Subtitle: `कोई भी वक्त` → `किसी भी वक्त` (oblique case)
- **FORMAT** Deadline pill Bold weight

#### Banner
| Property | Token / Value |
|---|---|
| Title | आज सेटअप का दिन है |
| Subtitle | किसी भी वक्त शुरू कर सकते हो |
| Icon | `Icons.Filled.Schedule` |
| Icon tint | `WiomColors.stateWarning` |
| Background | `WiomColors.bgUrgent` |
| Accent | `WiomColors.stateWarning` |

#### CTAs
| Slot | Element |
|---|---|
| Primary (sticky) | Primary `सेटअप शुरू करें` (key `cta.start_installation`) → install flow |
| Overflow | `नहीं कर पाएँगे` |

---

### 3.8 INS-1047b — SCHEDULED (not slot day) — GAP STATE

Banner branch exists in `InstallStateBanner.bannerVariantFor()` but no mock card seeded. Not feed-visible in the redesign APK. **Debug panel should expose this variant** (see §7).

| Property | Token / Value |
|---|---|
| Title | सेटअप पक्का हुआ |
| Subtitle | `task.deadlineDisplay` (e.g. `3 दिन बाकी`) |
| Icon | `Icons.Filled.Schedule` |
| Background | `WiomColors.bgPositive` |
| Accent | `WiomColors.statePositive` |

---

### 3.9 INS-1048 — NEEDS_RESCHEDULING

#### Callouts
- **NEW** Banner with action framing (not shame framing)
- **HIDDEN** Executor section (can't pick executor without confirmed slot)
- **REMOVED** Repeated subtext `कनेक्शन के लिए दोबारा स्लॉट चुनें`
- **FIX** Slot section after resubmit shows new slots (callback chain bug fixed)
- **MODIFIED** `reason.reschedule` = फिर से समय भेजें → कनेक्शन के लिए नया समय चुनें

#### Banner
| Property | Token / Value |
|---|---|
| Title | कनेक्शन के लिए नया समय चुनें |
| Subtitle | दोबारा स्लॉट प्रस्ताव भेजो |
| Icon | `Icons.Filled.Warning` |
| Icon tint | `WiomColors.stateWarning` |
| Background | `WiomColors.bgUrgent` |
| Accent | `WiomColors.stateWarning` |

#### CTAs
| Slot | Element |
|---|---|
| Primary (sticky) | Primary `स्लॉट प्रस्तावित करें` → `SlotProposalSheet` |
| Overflow | `नहीं कर पाएँगे` |

---

### 3.10 INS-1049 — SCHEDULING_FAILED

#### Callouts
- **HIDDEN FROM FEED ENTIRELY** via `MockTaskRepository.buildTaskFeed()` filter
- **NEW** Banner (if deep-linked)
- **MODIFIED** Transliteration: `confirm` → `कन्फर्म`, `cancel` → `कैंसल`
- **MODIFIED** `reason.scheduling_failed` = ग्राहक से पुष्टि हो रही है → कनेक्शन ने कन्फर्म नहीं किया

#### Banner
| Property | Token / Value |
|---|---|
| Title | कनेक्शन ने स्लॉट कन्फर्म नहीं किया |
| Subtitle | पुराने स्लॉट कैंसल हुए · CSP कोई काम नहीं |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

### 3.11 INS-1050 — INSTALL_SUBMITTED (NEW state vs v1.5)

#### Callouts
- **NEW** State — v1.5 §2.5 only defined VERIFICATION_PENDING → RESOLVED
- **NEW** Banner with queued semantics (distinct from VERIFICATION_PENDING active semantics)
- **NEW** Deadline `सबमिट हो चुका है`
- **NEW** Timeline event `सेटअप सबमिट हुआ` (Devanagari)
- **HIDDEN** No primary CTA, no exit (v1.5 §3 rule preserved)

#### Banner
| Property | Token / Value |
|---|---|
| Title | सेटअप सबमिट हुआ |
| Subtitle | वेरिफाई के लिए तैयार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

### 3.12 INS-1051 — DELEGATED_NOT_STARTED

#### Callouts
- **NEW** Banner with event framing (named actor + past negative)
- **MODIFIED** Primary CTA = Tertiary + trailing Call icon `कनेक्शन को कॉल करें`
- **LOOSE END** User flagged "rajesh would not have a space in spelling" — unreproduced

#### Banner
| Property | Token / Value |
|---|---|
| Title (template) | `{executorName} ने सेटअप अभी शुरू नहीं किया` |
| Title (fallback) | सेटअप अभी शुरू नहीं हुआ |
| Subtitle | जो व्यक्ति चुना है उसका इंतज़ार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

### 3.13 INS-1052 — DELEGATED_IN_PROGRESS

#### Callouts
- **NEW** Banner with respectful plural
- **FIX** `reasonTimerDisplay` for home card: `सुनील काम कर रहा है` → `काम कर रहे हैं` (was drifting from banner)
- **MODIFIED** Primary CTA = Tertiary + trailing Call icon

#### Banner
| Property | Token / Value |
|---|---|
| Title (template) | `{executorName} काम कर रहे हैं` |
| Title (fallback) | काम चालू है |
| Subtitle | सेटअप पर काम चल रहा है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

### 3.14 INS-1053 — VERIFICATION_PENDING

#### Callouts
- **NEW** Banner with actively-verifying semantics (distinct from INS-1050 queued)
- **NEW** Deadline `वेरिफिकेशन चल रहा है`
- **NEW** Timeline event `वेरिफाई शुरू हुआ`
- **FORMAT** Short `ि` matra throughout (`वेरिफाई`, `वेरिफिकेशन`)
- **HIDDEN** No primary CTA (waiting on system)

#### Banner
| Property | Token / Value |
|---|---|
| Title | सेटअप वेरिफाई हो रहा है |
| Subtitle | व्योम जाँच रहा है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

## 4. Design token reference (quick lookup)

### 4.1 Color tokens used by the install drilldown

| Token | Redesign hex | Used by |
|---|---|---|
| `WiomColors.brandPrimary` | #D9008D | Primary CTA bg, brand chevrons |
| `WiomColors.textPrimary` | #161021 | Primary text, neutral button text |
| `WiomColors.textSecondary` | #5C5570 | Metadata, slot pending text, call icon |
| `WiomColors.textHint` | #A7A1B2 | Disabled, version strings |
| `WiomColors.textOnBrand` | #FFFFFF | Text on brand CTAs |
| `WiomColors.bgScreen` | #FAF9FC | Screen background |
| `WiomColors.bgSurface` | #FFFFFF | Card bg, CTA bar bg |
| `WiomColors.bgUrgent` | #FFF2BF | INS-1041, INS-1047, INS-1048 banner bg |
| `WiomColors.bgPositive` | #E1FAED | INS-1043, INS-1046 banner bg |
| `WiomColors.bgNegative` | #FFE5E7 | INS-1045 banner bg, Destructive button bg |
| `WiomColors.bgInfo` | #F1E5FF | INS-1042, INS-1044, INS-1049, INS-1050, INS-1051, INS-1052, INS-1053 banner bg |
| `WiomColors.statePositive` | #008043 | `slot.confirmed` chip, positive accents |
| `WiomColors.stateNegative` | #D92130 | INS-1045 accent, Destructive text |
| `WiomColors.stateWarning` | #B85C00 | INS-1041, INS-1047, INS-1048 accent |
| `WiomColors.stateInfo` | #6D17CE | Info banner accent (purple, was blue in baseline) |
| `WiomColors.strokePrimary` | #E8E4F0 | Card borders, CTA bar top border |
| `WiomColors.strokeSecondary` | #D7D3E0 | Sheet drag handle, secondary borders |

### 4.2 Typography tokens

| Token | Size / weight / LH | Used by |
|---|---|---|
| `WiomTextStyle.cardIdentity` | 14sp SemiBold / 24sp | Banner title, section headers |
| `WiomTextStyle.cta` | 16sp SemiBold (redesign) / 24sp | WiomButton text |
| `WiomTextStyle.reasonTimer` | 14sp SemiBold / 24sp | Deadline pill, reason lines |
| `WiomTextStyle.reasonTimerOverdue` | 14sp Bold / 24sp | Overdue variants |
| `WiomTextStyle.body` | 14sp Regular / 24sp | Drilldown body text |
| `WiomTextStyle.bodySmall` | 12sp Regular / 20sp / 0.4sp tracking | Banner subtitle, slot pending text |
| `WiomTextStyle.chipState` | 12sp SemiBold / 20sp / 0.3sp tracking | Slot badge chip |
| `WiomTextStyle.menuItem` | 16sp Regular / 24sp | Overflow menu items |

### 4.3 Spacing tokens

| Token | Value | Used by |
|---|---|---|
| `WiomSpacing.xs` | 4dp | Icon-text inline |
| `WiomSpacing.sm` | 8dp | Inter-chip, icon-text in banner |
| `WiomSpacing.md` | 12dp | Card content, CTA bar vertical padding |
| `WiomSpacing.lg` | 16dp | Screen horizontal margin, banner horizontal padding, CTA horizontal padding |
| `WiomSpacing.xxl` | 24dp | Section gaps in drilldown body |
| `WiomSpacing.huge` | 32dp | Major section separations |
| `WiomSpacing.cardPadding` | 16dp (redesign) | All card internal padding |
| `WiomSpacing.sheetContentToCta` | 48dp (redesign) | Sheet content → CTA gap |

### 4.4 Radius tokens

| Token | Value | Used by |
|---|---|---|
| `WiomRadius.tiny` | 4dp | Slot status chip |
| `WiomRadius.chip` | 8dp (redesign) | Assurance chips, small status chips |
| `WiomRadius.card` | 12dp | Cards, banner container |
| `WiomRadius.cta` | 16dp | WiomButton |
| `WiomRadius.dialog` | 24dp | Sheet top corners |

### 4.5 Elevation tokens

| Token | Value | Used by |
|---|---|---|
| `WiomElevation.cardBorderWidth` | 1dp | All card borders, CTA bar top border |
| `WiomElevation.accentBorderWidth` | 4dp | Left accent stripe on cards (timer-driven) |
| `WiomElevation.interCardGap` | 16dp (redesign) | Space between cards in feed |

---

## 5. Divergences from v1.5 flagged for product review

| # | Element | v1.5 says | v1.5.1 does | Why |
|---|---|---|---|---|
| 1 | Slot status badge style (PROPOSED/ACTIVE) | `state.info` + `bg.info` pill | Grey text `पेंडिंग है`, no pill | Tone-down — purple pill implies activity customer hasn't taken |
| 2 | `drilldown.location_section` | स्थान | जगह | Vocab register + resolves cross-bundle collision with restore |
| 3 | `drilldown.executor_section` | व्यक्ति | टेक्निशियन चुनें / टेक्निशियन (state-dependent) | Role-specific; split into action form + informational form |
| 4 | `executor.title` | कौन करेगा इंस्टॉल? | सेटअप कौन करेगा? + new key `executor.install.title` to break restore collision | Register shift + collision fix |
| 5 | INSTALL_SUBMITTED as separate state | Not in v1.5 | Added — queued vs actively-verifying (Option C) | Distinct user-facing meaning |
| 6 | Exit available in IN_PROGRESS | "No (onsite — separate module)" | Allowed via overflow menu | Field reality — CSPs need to back out mid-work occasionally |
| 7 | `reason.scheduling_failed` | ग्राहक से पुष्टि हो रही है | कनेक्शन ने कन्फर्म नहीं किया | Factual not aspirational |
| 8 | Banner component existence | No banner in drilldown | `InstallStateBanner` added | Explicit state communication reduces scanning cost |
| 9 | Inline exit on AWAITING_SLOT_PROPOSAL | Exit in §5 bottom row (all states except 3) | **Inline Tertiary below primary** for this one state only | Fastest escape on empty state |
| 10 | CTA type for IN_PROGRESS + delegated-working | Primary `शुरू करें` / `व्यक्ति चुनें` | Tertiary link-style `कनेक्शन को कॉल करें` with trailing Call icon | Primary affordance in these states is the coordination call |
| 11 | Hindi transliteration mid-Devanagari | Mixed Latin allowed in v1.5 (`ग्राहक से पुष्टि हो रही है` etc.) | Systematic Devanagari — सबमिट, वेरिफाई, कन्फर्म, कैंसल, टेक्निशियन | Register consistency |
| 12 | Executor subtitle grammar | `काम कर रहा है` implicitly singular | Respectful plural `काम कर रहे हैं` for named executors | Cultural register |
| 13 | Time-expression case | `कोई भी वक्त` | `किसी भी वक्त` (oblique) | Correct Hindi grammar |

---

## 6. Validation checklist extensions (over v1.5 §13)

| # | Check |
|---|---|
| 16 | `InstallStateBanner` has a when-branch for all 13 enum values (no silent fallthrough) |
| 17 | Every banner title + subtitle appears either as literal Devanagari or Unicode escape in source |
| 18 | CTA bar is flat with 1dp `strokePrimary` border-top (no shadow) |
| 19 | No raw `Color(0x...)` literals in any install drilldown file — all colors come from `WiomColors.*` |
| 20 | No `FontWeight.Bold` in button text — redesign uses `SemiBold` |
| 21 | All button text uses `WiomTextStyle.cta`, not inline TextStyle |
| 22 | Exit CTA is **never** Destructive type (reversibility rule) |
| 23 | Cross-bundle label collisions: every shared key between install/restore/netbox bundles has matching values OR is renamed with module prefix |
| 24 | No trailing/leading whitespace in `*_hi_en.json` hi values |
| 25 | No Latin English words mid-Devanagari string (submit/verify/confirm/cancel/status) |
| 26 | Respectful plural for any named executor (`Annu`, `Rajesh`, `Sunil`, etc.) |
| 27 | Oblique case for time expressions |
| 28 | `exit.CUSTOMER_CANCELLED` is the only legitimate `ग्राहक` use in install bundle |

All checks are **automated** via the `/validation` harness at [`abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown`](https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown). Run before opening the PR.

---

## 7. Debug panel — install state simulation (next output)

v1.5 doesn't spec a debug panel. v1.5.1 adds the following to `HomeDebugScreen.kt` so reviewers can walk all 13 states + gap states on-device without backend round-trips:

### 7.1 New `HomeDebugConfig` fields

```kotlin
// Install state filter — when set, buildTaskFeed() returns only tasks in this state
val installStateFilter: String = "ALL"  // ALL / AWAITING_SLOT_PROPOSAL / ... / RESOLVED

// Show gap states in the feed (not normally reachable)
val showGapStates: Boolean = false
```

### 7.2 New section in the debug screen

```
┌─ Debug Panel ──────────────────────────────────┐
│  ...                                             │
│                                                  │
│  ── Install State Simulation ───────────────     │
│                                                  │
│  Filter: [dropdown: ALL / 13 states]             │
│  [ ] Include gap states (INS-1047b, ASSIGNED,    │
│      RECONFIRMATION_PENDING)                     │
│                                                  │
│  Quick jump to drilldown:                        │
│  [INS-1041] [INS-1042] [INS-1043] [INS-1044]     │
│  [INS-1045] [INS-1046] [INS-1047] [INS-1047b]    │
│  [INS-1048] [INS-1049] [INS-1050] [INS-1051]     │
│  [INS-1052] [INS-1053]                           │
│                                                  │
│  Each button: deep-links to that task's drilldown│
│                                                  │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

### 7.3 Routing

Each quick-jump button calls:
```kotlin
navController.navigate(
    AppRoutes.taskDrilldown(
        taskId = "INS-1041",
        taskType = "INSTALL",
        currentState = "AWAITING_SLOT_PROPOSAL"
    )
)
```

Mock repo already has the task by id — the navigation graph resolves it and renders the drilldown.

### 7.4 Token spec

| Element | Token |
|---|---|
| Section header | `WiomTextStyle.cardIdentity`, `WiomColors.textPrimary` |
| Filter dropdown | Standard Material3 ExposedDropdownMenu, border `WiomColors.strokeSecondary` |
| Gap-state checkbox | Standard Material3 Checkbox, `checkedColor = WiomColors.brandPrimary` |
| Quick-jump buttons | `WiomButton` Tertiary, 4-column grid, `WiomSpacing.sm` (8dp) gap |
| Button text | State ID, e.g. `INS-1041` in `WiomTextStyle.chipLabel` |
| Container padding | `WiomSpacing.lg` (16dp) horizontal + vertical |
| Section gap | `WiomSpacing.xxl` (24dp) above and below this section |

### 7.5 Implementation notes

- The `installStateFilter` field should be wired into `MockTaskRepository.buildTaskFeed()` via `HomeDebugConfig`
- The `showGapStates` flag controls whether SCHEDULING_FAILED (and future ASSIGNED, RECONFIRMATION_PENDING, SCHEDULED.isSlotDay=false) are included in the feed output
- Quick-jump buttons bypass `buildTaskFeed()` entirely — they construct the drilldown navigation directly
- Debug panel is only accessible via the `Wiom CSP DS` redesign flavor via the header debug button; not shipped to production

---

## 8. What stays from v1.5 §10 catalog

The 49-key catalog in v1.5 §10 is the canonical source of truth. v1.5.1 changes **values** for 15 keys (tables above), **adds** 4 keys (`drilldown.executor_section.assigned`, `cta.start_installation`, `executor.install.title`, plus optionally 31 banner keys), and leaves 32 keys **unchanged**.

Final key count after v1.5.1 lands:
- 49 (v1.5 baseline)
- +4 required new keys = 53
- +31 optional banner keys (if banner migration happens in this PR) = 84

---

## 9. What the PR touches

Source repo: `wiom-tech/wiom-csp-app-apr09@release-01`

File allowlist (enforced by [`/validation/scope-allowlist.txt`](https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown/blob/main/validation/scope-allowlist.txt)):

```
app/build.gradle.kts
app/src/main/java/com/wiom/csp/WiomCspApplication.kt
app/src/redesign/**
app/src/staging/res/**
app/src/main/java/com/wiom/csp/navigation/AppNavGraph.kt
app/src/main/assets/install_labels_v1.4_hi_en.json
app/src/main/assets/restore_labels_v1.0_hi_en.json
app/src/main/assets/netbox_labels_v1.2_hi_en.json
app/src/main/assets/wallet_labels_v1.2_hi_en.json
app/src/main/assets/home_labels_hi_en.json
app/src/main/assets/assurance_strip_labels_v1.0_hi_en.json
core/common/src/main/java/com/wiom/csp/core/common/theme/WiomTokens.kt
core/common/src/main/java/com/wiom/csp/core/common/theme/WiomDsMode.kt
core/common/src/main/java/com/wiom/csp/core/common/composables/WiomButton.kt
core/common/src/main/java/com/wiom/csp/core/common/composables/WiomBadge.kt
core/common/src/main/java/com/wiom/csp/core/common/composables/WiomHeader.kt
core/data/build.gradle.kts
core/data/src/main/java/com/wiom/csp/core/data/repository/DebugConfigs.kt
core/data/src/main/java/com/wiom/csp/core/data/repository/MockTaskRepository.kt
core/model/src/main/java/com/wiom/csp/core/model/AssuranceChipData.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/HomeScreen.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/TaskDrilldownScreen.kt
feature/home/src/main/java/com/wiom/csp/feature/home/viewmodel/HomeViewModel.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/feed/TaskCard.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/InstallStateBanner.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/InstallDrilldownContent.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/ExecutorAssignmentSheet.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/ExitReasonSheet.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/SlotProposalSheet.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/SlotStatusBadge.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/restore/DiagnoseFaultSheet.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/restore/RestoreExecutorSheet.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/strip/AssuranceChip.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/strip/drilldowns/ExposureDrilldown.kt
feature/home/src/main/java/com/wiom/csp/feature/home/ui/strip/drilldowns/QualityDrilldown.kt
feature/wallet/src/main/java/com/wiom/csp/feature/wallet/ui/WalletHomeScreen.kt
docs/features/install-flow/Install_Flow_Visual_Spec_v1.5.1.md   ← this file
```

~30 modified + ~6 new source files + this spec = 37 files in the PR.

---

*Install Flow Visual Spec v1.5.1 | April 15, 2026*
*Delta against v1.5. 1 flow. 13 card states. 3 sheets. 1 drilldown. 53+ keys. 28 validation checks. 13 divergences flagged for review. 4 new components (`InstallStateBanner`, `WiomButton`, `WiomCtaBar`, `WiomBadge`).*
*Depends on: Component Registry v1.1 + Wiom DS v2 foundations. Supersedes v1.5 once merged.*
