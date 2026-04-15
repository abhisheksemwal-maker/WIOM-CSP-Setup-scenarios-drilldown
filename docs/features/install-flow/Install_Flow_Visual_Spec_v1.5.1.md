# CSP APP — Install Flow Visual Spec v1.5.1 (Pratibimb Redesign)

**Date:** April 15, 2026
**Supersedes:** [`Install_Flow_Visual_Spec_v1.5.md`](https://github.com/wiom-tech/wiom-csp-app-apr09/blob/release-01/docs/features/install-flow/Install_Flow_Visual_Spec_v1.5.md) (April 9, 2026)
**Surface:** Install Flow (assignment → scheduling → dispatch → delegation → work module → verification → closure)
**Depends on:**
- Component Registry v1.1 — tokens, card spec (2-line, no CTA), CSP accountability model (§5), accent rules
- Wiom DS v2 foundations (wiom-cta, wiom-badge, sd-autolayout, sd-text-container, wiom-design-foundations)
**Brief:** UX Agent Brief — Install Flow v3 (FINAL) + Pratibimb session directive 2026-04-14
**Status:** Draft — pending merge into `wiom-tech/wiom-csp-app-apr09@release-01` via feature PR
**Replaces:** v1.5 in full. This is a self-contained document — no need to read v1.5 alongside.

---

## What changed v1.5 → v1.5.1

| # | Change | Source |
|---|---|---|
| 1 | **`InstallStateBanner`** — per-state title/subtitle banner at top of drilldown scroll body (13 variants + icon + bg + accent) | Pratibimb 2026-04-14 |
| 2 | **Sticky `WiomCtaBar`** — flat bottom CTA container with 1dp border-top, CTA outside scroll | wiom-cta §5 rule 9 + sd-autolayout §6c |
| 3 | **`WiomButton`** polymorphic CTA — Primary / Secondary / Tertiary / Destructive with leading/trailing icon slots | wiom-cta + session directive |
| 4 | **Exit reclassified** as reversible Tertiary in neutral color (not Destructive red). Moved to triple-dot overflow menu for all states **except** `AWAITING_SLOT_PROPOSAL` where it's inline Tertiary below primary | session directive |
| 5 | **Vocab register shift** — `ग्राहक` → `कनेक्शन`, `व्यक्ति` → `टेक्निशियन`, `इंस्टॉल` → `सेटअप` throughout install surface copy | session directive |
| 6 | **Devanagari transliteration** for English loanwords mid-string — `submit` → `सबमिट`, `verify` → `वेरिफाई` (short ि), `confirm` → `कन्फर्म`, `cancel` → `कैंसल` | session directive |
| 7 | **Respectful plural** for named executors — `{name} काम कर रहे हैं` | session directive |
| 8 | **Oblique case** for time expressions — `किसी भी वक्त` not `कोई भी वक्त` | session directive |
| 9 | **Slot badge tone-down** — `PROPOSED` + `ACTIVE` render as grey text `पेंडिंग है` (no pill background) | session directive |
| 10 | **Slot filter rule** — when any slot is `CONFIRMED`, hide all non-confirmed siblings | session directive |
| 11 | **State-aware executor header** — action form `टेक्निशियन चुनें` when null, informational `टेक्निशियन` otherwise | session directive |
| 12 | **CTA type shift in in-progress / delegated-working states** — Primary → Tertiary link-style `कनेक्शन को कॉल करें` with trailing Call icon | session directive |
| 13 | **`INSTALL_SUBMITTED` as separate state** (split from VERIFICATION_PENDING) — queued vs actively-verifying | Option C |
| 14 | **`SCHEDULING_FAILED` hidden from CSP feed** via `buildTaskFeed()` filter | session directive |
| 15 | **Routing bug fix** — `DELEGATED_OVERDUE` primary CTA now opens executor sheet (was silently falling through) | source-tree bug |
| 16 | **Slot-data callback fix** — `onSlotSubmitted(id, s1d, s1t, s2d, s2t)` now threads slot data through 4 files | source-tree bug |
| 17 | **Home card `reasonTimerDisplay` drift fix** — INS-1052 uses respectful plural (was drifting from banner) | validator-caught |
| 18 | **Missing label `cta.start_installation`** added — was rendering `[cta.start_installation]` placeholder | source-tree drift |

Plus all v1.4 → v1.5 changes still apply (card = 2 lines + no CTA, badge on line 2, delegation states, end transition unification, RESOLVED no auto-dismiss, CSP accountability model).

---

## 0. Objective

```
Primary job: Make the next install action obvious on Home.
Secondary job: Complete scheduling and dispatch with minimal steps.
Key principle: Scheduling IS acceptance. No Accept button.
```

---

## 1. Surface Classification

| Surface | Type | Job |
|---|---|---|
| Install Card (L6 → L4) | Execution (Home card) | Progress install |
| Install Drilldown | Hybrid | Context + act + exit |
| Slot Proposal Sheet | ACTION_SHEET | Date/time input |
| Exit Reason Sheet | ACTION_SHEET | Structured exit reason |
| Executor Assignment Sheet | ACTION_SHEET | Team selection |

---

## 2. Card Field Values

All cards use Component Registry §2.4 container (2-line, no CTA). Type icon 🏠 `home` per Component Registry §2.8. Accent driven by `timer_state` per Component Registry §4. Tap anywhere → drilldown.

### 2.1 Card lines (all states)

```
[🏠] इंस्टॉल · #CN-4021 · सेक्टर 15              9:01 AM    ← Line 1: Identity + timestamp
समय तय करें · 3 दिन बाकी                              ●2    ← Line 2: Context + badge
```

| Element | Spec |
|---|---|
| Icon | `home` (filled), 18dp, `text.secondary` (`WiomColors.textSecondary`) |
| Label + ID + Locality | `WiomTextStyle.cardIdentity` (14sp/600), `WiomColors.textPrimary` |
| Timestamp | `last_update_time`, right-aligned, `WiomTextStyle.bodySmall`, `WiomColors.textSecondary`. Shown only when `update_count > 0`. |
| Badge | Brand circle (per Component Registry §2.12), right-aligned on Line 2. Shown only when `update_count > 0`. |

Locality truncates first if width constrained. Icon and ID never truncate. When `update_count = 0`: no timestamp, no badge — clean card.

### 2.2 Card states — Line 2 (context + urgency)

All states. No CTA on card. Tap → drilldown for all.

| State | Line 2 (reason_display_template) | timerState |
|---|---|---|
| AWAITING_SLOT_PROPOSAL | `समय तय करें · X दिन बाकी` | NORMAL → URGENT → OVERDUE |
| AWAITING_CUSTOMER_SELECTION | `कनेक्शन चुन रहा है` *(v1.5.1: was ग्राहक)* | NORMAL |
| SLOT_CONFIRMED | `टेक्निशियन चुनें · कल 3-5 PM` *(v1.5.1: was व्यक्ति)* | NORMAL |
| SCHEDULED (not slot day) | `लगाना है · शनिवार 3-5 PM` | NORMAL |
| SCHEDULED (slot day) | `आज लगाना है · 3-5 PM` | NORMAL |
| NEEDS_RESCHEDULING | `दोबारा समय तय करें · X दिन बाकी` | URGENT |
| SCHEDULING_FAILED | `शेड्यूल नहीं हो पाया` | NORMAL (**but feed-hidden**, see §7) |

### 2.3 Delegation states — Line 2

Per Component Registry §5.3. When CSP assigns a non-self executor:

| State | Line 2 | timerState |
|---|---|---|
| DELEGATED_NOT_STARTED | `{name} को दिया · {timer}` | NORMAL → escalates |
| DELEGATED_IN_PROGRESS | `{name} काम कर रहे हैं · {timer}` *(v1.5.1: respectful plural)* | NORMAL → escalates |
| DELEGATED_OVERDUE | `{name} से नहीं हुआ · {delay}` | OVERDUE |

Timer/urgency identical to self-execution. CSP remains accountable. Change executor available in drilldown at all times.

### 2.4 Work module states — Line 2

Card shell only. Work module (reach home → cable → setup → OTP) is a separate spec. Card doesn't define work steps — it only tracks entry/exit.

| State | Line 2 | timerState |
|---|---|---|
| IN_PROGRESS (self) | `काम कर रहे हैं · {timer}` | NORMAL → escalates |
| IN_PROGRESS (delegated) | `{name} काम कर रहे हैं · {timer}` | NORMAL → escalates |

Same card container, same 🏠 icon, same identity line. Card evolves — it doesn't restart.

### 2.5 End transition states — Line 2

Per Component Registry §5.4. Unified with Restore. **v1.5.1 adds INSTALL_SUBMITTED as a distinct state** so the CSP sees "submitted, queued for verify" separately from "actively verifying".

| State | Line 2 | timerState | Card behavior |
|---|---|---|---|
| **INSTALL_SUBMITTED** (v1.5.1 new) | `सबमिट हो चुका · वेरिफाई के लिए तैयार` | NORMAL | Tappable. Queued state. |
| VERIFICATION_PENDING | `वेरिफिकेशन चल रहा है` *(v1.5.1: was जाँच हो रही है)* | NORMAL | Tappable. Drilldown shows active verification. |
| RESOLVED | `✓ सेटअप पूरा हुआ · कनेक्शन का नेट चालू है` *(v1.5.1: ग्राहक → कनेक्शन)* | NORMAL (positive color) | **Stays on feed until CSP opens drilldown. Removed on drilldown exit.** If CSP was inside during completion (self-executed), card is removed when he exits — no extra step. |

For Install, OTP = strong proof, so submit → verify → resolved is near-instant. But the card still shows all three states in sequence in v1.5.1.

### 2.6 Card rules

- **Accent driven by timer_state.** Per Component Registry §4.
- **🏠 icon always.** Type-level. Never changes.
- **No CTA on card.** All actions in drilldown.
- **No Exit on card.** Exit is in drilldown only.
- **No "देखें ›".** Card is tappable surface — affordance is visual.
- **Reason line: one line max.** Truncate with ellipsis.
- **Reason understandable without timer.**
- **No auto-dismiss.** RESOLVED stays until acknowledged.

### 2.7 P74 on card

| State | P74 on card? |
|---|---|
| AWAITING_SLOT_PROPOSAL | ✅ In reason line |
| NEEDS_RESCHEDULING | ✅ In reason line |
| All others | ❌ Drilldown only |

### 2.8 Timer behavior

Per Component Registry §2.4. Server sends `timer_state` + `countdown_display`.

| timer_state | Text color | Background |
|---|---|---|
| `normal` | `WiomColors.textPrimary` | None |
| `urgent` | `WiomColors.stateWarning` | `WiomColors.bgUrgent` strip |
| `overdue` | `WiomColors.stateNegative` | `WiomColors.bgOverdue` strip |

### 2.9 Masked call rules

| Rule | Value |
|---|---|
| **Where** | **Drilldown Contact section only. Never on card.** |
| When available | Day of confirmed slot only. Not before. |
| Mechanism | Tap → system connects via cloud telephony. Masked. No number displayed. |
| Purpose | Coordination only ("gate kholo"). Not scheduling. Not renegotiation. |
| Server-driven | `masked_call_available: true/false` in TAS projection |
| Disappears | Task resolved, escalated, or exited |
| Call fails | Error toast. Card unchanged. |
| Never shows | Customer name or phone number. Anywhere. |

---

## 3. Exit Option

### Principle

```
Exception actions must not appear on execution surface (card).
Accessible through drilldown only.
```

### Availability — v1.5.1

| State | Exit in drilldown? | Location |
|---|---|---|
| AWAITING_SLOT_PROPOSAL | Yes | **Inline Tertiary below primary** (only state with inline exit — fastest escape on empty state) |
| AWAITING_CUSTOMER_SELECTION | Yes | Overflow menu |
| SLOT_CONFIRMED | Yes | Overflow menu |
| SCHEDULED | Yes | Overflow menu |
| NEEDS_RESCHEDULING | Yes | Overflow menu |
| SCHEDULING_FAILED | No | N/A (feed-hidden) |
| IN_PROGRESS | **Yes (v1.5.1 diverges from v1.5)** — see §15 item 6 | Overflow menu |
| INSTALL_SUBMITTED | No | N/A (state is informational) |
| DELEGATED_NOT_STARTED | Yes | Overflow menu |
| DELEGATED_IN_PROGRESS | Yes | Overflow menu |
| DELEGATED_OVERDUE | Yes | Overflow menu |
| VERIFICATION_PENDING | No | N/A |
| RESOLVED | No | N/A |

### Reclassification: exit is REVERSIBLE, not DESTRUCTIVE

Exit reverts the task to the queue — the CSP can receive it again. Per the reversibility rule, exit uses **Tertiary type in neutral `textPrimary` color**, never Destructive red. See §14 Design tokens and `feedback_destructive_vs_reversible_ctas.md`.

### Discoverability test

- ❌ Eye lands on exit before primary CTA → failed
- ✅ Exit findable within 5 seconds → card tap → drilldown → (inline for AWAITING_SLOT_PROPOSAL OR triple-dot overflow) → exit visible

---

## 4. Action Sheets

All use shared ACTION_SHEET container (Component Registry §2). v1.5.1 polish: titles 16sp → 24sp Bold, content-to-CTA gap 16 → 48dp (`WiomSpacing.sheetContentToCta`), labels 14sp → 16sp Regular, `WiomButton` throughout, drag handle `WiomColors.strokeSecondary` (#D7D3E0).

### 4.1 Slot Proposal Sheet

**Trigger:** `cta.propose_slots` "स्लॉट प्रस्तावित करें" *(v1.5: was समय भेजें)* in drilldown.

| Element | Spec |
|---|---|
| Title | `[COPY:slots.title]` — "दो समय भेजें" |
| Slot 1 | `[COPY:slots.slot1]` — "पहला समय" + DatePicker + TimeRange |
| Slot 2 | `[COPY:slots.slot2]` — "दूसरा समय" + DatePicker + TimeRange |
| Submit | `[COPY:cta.submit_slots]` — disabled until valid |

Validation: different days, not past, within P74. Inline errors.

**On submit:** Implicit acceptance. Sheet closes → server refresh → drilldown re-renders with AWAITING_CUSTOMER_SELECTION. CSP stays inside drilldown (per Component Registry §2.11). **v1.5.1 bug fix:** slot data now threads through `onSlotSubmitted(id, s1d, s1t, s2d, s2t)` so re-submits in NEEDS_RESCHEDULING show the new slots (previously showed stale EXPIRED siblings).

### 4.2 Exit Reason Sheet

**Trigger:** `exit.link` "नहीं कर पाएँगे" — either inline (AWAITING_SLOT_PROPOSAL) or via triple-dot overflow.

| Element | Spec |
|---|---|
| Title | `[COPY:exit.title]` — "ये काम क्यों नहीं हो सकता?" |
| Options | 4 radio buttons: LOCATION_UNREACHABLE, CAPACITY_FULL, CUSTOMER_CANCELLED, TECHNICIAN_UNAVAILABLE |
| Confirm | `[COPY:cta.confirm_exit]` — disabled until selected |

No free text. REQUIRES_ONLINE. On confirm → task reverts to queue (server). **v1.5.1: sheet pairs `Destructive` primary with `Secondary` "वापस" side-by-side** for easy back-out.

### 4.3 Executor Assignment Sheet

**Trigger:** `cta.assign_executor` "टेक्निशियन चुनें" *(v1.5: was व्यक्ति चुनें)*.

| Element | Spec |
|---|---|
| Title | `[COPY:executor.install.title]` — "सेटअप कौन करेगा?" *(v1.5: was कौन करेगा इंस्टॉल?)* |
| Self option | `[COPY:executor.self]` — "मैं खुद करूँगा". **No `(स्वयं)` suffix** (v1.5.1: removed) |
| Technicians | From roster. 48dp rows. |
| Assign | `[COPY:cta.assign]` — always enabled |

No technicians → skip sheet → auto-assign self → SCHEDULED.

**Note:** New key `executor.install.title` added in v1.5.1 to break the cross-bundle collision with restore's `executor.title = "कौन ठीक करेगा?"` which was silently overriding the install value via `WiomLabels` flat-merge.

---

## 5. Drilldown

**Entry:** Card body tap (all states). All cards are tappable — no "देखें ›" needed.

One unified drilldown for the entire install lifecycle. v1.5.1 restructures the drilldown body with:
- `InstallStateBanner` at the top of the scroll body (NEW)
- Sticky `WiomCtaBar` outside the scroll container (NEW — was inline Primary per v1.5)
- State-aware section visibility rules (executor hidden for 3 states)
- Slot filter rule (confirmed-only when any is confirmed)

### 5.1 Skeleton (v1.5.1)

```
┌──────────────────────────────────────────────────┐
│  ‹ वापस                                       ⋮  │  ← Module header with triple-dot overflow
│                                                   │     (overflow menu = exit for all states
│  [🏠] इंस्टॉल · #CN-4021                         │      except AWAITING_SLOT_PROPOSAL)
│                                                   │
│  ┌─ InstallStateBanner (NEW v1.5.1) ──────────┐   │  ← Banner, 2dp shadow, per-state tokens
│  │ [icon]  Title in accent color (2 lines)    │   │     (see §5.6 for all 13 variants)
│  │         Subtitle in textPrimary            │   │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ── क्या हुआ (3 नए) ─────────────────────────   │  ← Timeline HERE when update_count > 0
│  ┌─ bg.brandTint ────────────────────────────┐   │     (expanded, latest first, new items tinted)
│  │ 2:30 PM  कनेक्शन ने समय चुना              │   │
│  ├───────────────────────────────────────────┤   │
│  │ 1:15 PM  राजेश को दिया                    │   │
│  └───────────────────────────────────────────┘   │
│     9:01 AM  नया अनुरोध मिला                     │  ← old items (no tint)
│     और देखें (2 और)                               │  ← if > 5 items
│                                                   │
│  ── जगह ────────────────────────────────────     │  ← v1.5.1: स्थान → जगह (collision-fixed)
│  [Full service address]                           │
│  नज़दीकी कनेक्शन: [locality, ~distance]          │
│  [COPY:assignment_source_label] — text.secondary  │
│                                                   │
│  ── कनेक्शन लगने का समय ──────────────────       │  ← v1.5.1: schedule section, new name
│  स्थिति: [COPY:status_label]                     │
│  पहला: Day, Time  [badge]                        │  ← v1.5.1: grey "पेंडिंग है" (see §5.5)
│  दूसरा: Day, Time  [badge]                        │
│                                                   │
│  ── टेक्निशियन चुनें ─ OR ─ टेक्निशियन ─        │  ← v1.5.1: state-aware header
│  अन्नू / अभी तय नहीं                              │     (action form when executor == null)
│                                                   │
│  ── समय सीमा ──────────────────────────────      │
│  ⏱ X दिन बाकी                                    │  ← v1.5.1: Bold weight
│                                                   │
│  ── संपर्क ─────────────────────────────────     │
│  [कॉल करें]  (slot day only)                     │
│  or [COPY:contact.not_yet] "समय आने पर उपलब्ध"   │
│                                                   │
│  ▸ [COPY:scheduling_timeline] (collapsed)        │
│                                                   │
├──────────────────────────────────────────────────┤
│  ┌─ WiomCtaBar (NEW v1.5.1, sticky, flat) ───┐   │  ← CTA outside scroll, flat, 1dp border-top
│  │ [ Primary CTA ]                            │   │
│  │ [ Inline tertiary (AWAITING_SLOT only) ]   │   │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Key structural changes from v1.5:**
- Banner component added at top of scroll body
- Primary CTA moved to **sticky WiomCtaBar outside scroll** (was inline at bottom of scroll per v1.5)
- Exit moved from §5 bottom row → overflow menu (or inline below primary for AWAITING_SLOT_PROPOSAL)
- Triple-dot overflow menu added to ModuleHeader

### 5.2 Sections

| Section | Content | Visibility (v1.5.1) |
|---|---|---|
| Banner *(NEW)* | Per-state title + subtitle + icon + bg | Always. Top of scroll body. |
| Timeline | Event log. Above other sections if `update_count > 0`; below if 0. | Conditional position. |
| Location (जगह) | Full service address + nearest existing connection (D&A) + assignment source | Always. |
| Scheduling (कनेक्शन लगने का समय) | Status + slot details + per-slot badges. **Filter: show only CONFIRMED when any is confirmed.** | Hidden when no slots (AWAITING_SLOT_PROPOSAL). |
| Executor | Assigned or "अभी तय नहीं". **State-aware header: `टेक्निशियन चुनें` (action) or `टेक्निशियन` (informational).** | Hidden for AWAITING_SLOT_PROPOSAL, AWAITING_CUSTOMER_SELECTION, NEEDS_RESCHEDULING (can't pick executor without confirmed slot). |
| Deadline | P74 countdown (always visible in drilldown). **v1.5.1: Bold weight.** | Always |
| Contact | Masked call CTA (slot day) or "समय आने पर उपलब्ध" (not yet) | Always (content varies) |
| Primary CTA *(sticky)* | Per-state button in WiomCtaBar. Per v1.5.1 §5.8 CTA map. | States with actionable next step. Hidden for passive-wait states. |
| Overflow menu | Exit + future overflow items. Triple-dot in ModuleHeader. | All states except the 3 terminal-info states (INSTALL_SUBMITTED, VERIFICATION_PENDING, RESOLVED) and SCHEDULING_FAILED (feed-hidden). |

### 5.3 Assignment source guardrail

All values (new/retry/reallocation) render identically: `WiomTextStyle.body`, `WiomColors.textSecondary`. No color-coding. No icons. Prevents decline bias.

### 5.4 Privacy rules in drilldown

| Data | Shown? |
|---|---|
| Full service address | ✅ Yes — location section |
| Nearest existing connection | ✅ Yes — location section |
| Customer name | ❌ Never |
| Customer phone | ❌ Never (masked call only) |
| Assignment source | ✅ Yes — neutral styling |

### 5.5 Slot status badges (v1.5.1 updates)

| Status | v1.5 style | v1.5.1 style | Rationale |
|---|---|---|---|
| PROPOSED | `text.secondary`, no bg | **Grey text "पेंडिंग है"**, no bg | Tone-down — customer hasn't acted |
| ACTIVE | `state.info`, `bg.info` pill | **Grey text "पेंडिंग है"**, no bg | Same — customer hasn't differentiated, no activity to imply |
| CONFIRMED | `state.positive`, `bg.positive` pill | `WiomColors.statePositive` + `WiomColors.bgPositive` pill, radius `WiomRadius.tiny` (4dp), text "कन्फर्म है" | Unchanged behaviour, tokenized values |
| EXPIRED | `text.hint`, strikethrough | **Hidden entirely** when any slot is CONFIRMED (filter rule). Otherwise `WiomColors.textHint` + strikethrough. | Cleanliness |
| CANCELLED | `text.hint`, strikethrough | Same as EXPIRED | Cleanliness |

### 5.6 Banner spec (NEW in v1.5.1)

`InstallStateBanner` renders a per-state title + subtitle at the top of the drilldown scroll body. Structure and tokens shared across all 13 variants:

| Property | Token |
|---|---|
| Container | Row with icon + column(title + subtitle) |
| Background | Per-state (see §5.11 per-state tables) |
| Radius | `WiomRadius.card` = 12dp |
| Horizontal padding | `WiomSpacing.lg` = 16dp |
| Vertical padding | `WiomSpacing.md` = 12dp |
| Elevation | 2dp shadow (`shadow.md`) |
| Icon | 20dp, tint = accent (per-state) |
| Icon-text gap | `WiomSpacing.sm` = 8dp |
| Title style | `WiomTextStyle.cardIdentity` (14sp SemiBold / 24sp LH) |
| Title color | Per-state accent |
| Title `maxLines` | **2** (was 1 — so event-style titles like `{name} ने कनेक्शन सेटअप में देरी कर दी` fit) |
| Subtitle gap from title | 2dp |
| Subtitle style | `WiomTextStyle.bodySmall` (12sp / 20sp LH / 0.4sp tracking) |
| Subtitle color | `WiomColors.textPrimary` |

Per-state title + subtitle + accent + bg are listed in §5.11 (per-state callouts).

### 5.7 WiomCtaBar spec (NEW in v1.5.1)

Sticky bottom container housing the primary + optional inline-tertiary CTA. CTA sits **outside the scroll container** per sd-autolayout §6c. Flat style per wiom-cta §5 rule 9.

| Property | Token |
|---|---|
| Background | `WiomColors.bgSurface` (#FFFFFF) |
| Border-top | 1dp `WiomColors.strokePrimary` (#E8E4F0) |
| Shadow | none (flat) |
| Horizontal padding | `WiomSpacing.lg` = 16dp |
| Vertical padding | `WiomSpacing.md` = 12dp |
| Inter-button gap (stacked) | `WiomSpacing.sm` = 8dp |
| Position | Fixed bottom of drilldown screen, above safe area |

### 5.8 CTA map per state (NEW in v1.5.1)

Complete table of every install state's primary + tertiary/overflow CTAs with text, key, button type, location, action, and icons.

| State | CTA text (hi) | Key | Type | Location | Action | Leading | Trailing |
|---|---|---|---|---|---|---|---|
| AWAITING_SLOT_PROPOSAL | स्लॉट प्रस्तावित करें | `cta.propose_slots` | Primary | Sticky WiomCtaBar | SlotProposalSheet | — | — |
| AWAITING_SLOT_PROPOSAL (inline) | नहीं कर पाएँगे | `exit.link` | Tertiary | Inline in WiomCtaBar below primary | ExitReasonSheet | — | — |
| AWAITING_CUSTOMER_SELECTION | — | — | — | — | — | — | — |
| SLOT_CONFIRMED | टेक्निशियन चुनें | `cta.assign_executor` | Primary | Sticky | ExecutorAssignmentSheet | — | — |
| SCHEDULED (slot day) | सेटअप शुरू करें | `cta.start_installation` *(NEW key)* | Primary | Sticky | Navigate to install flow | — | — |
| SCHEDULED (future) | — | — | — | — | — | — | — |
| NEEDS_RESCHEDULING | स्लॉट प्रस्तावित करें | `cta.propose_slots` | Primary | Sticky | SlotProposalSheet | — | — |
| SCHEDULING_FAILED | — | — | — | — | (feed-hidden) | — | — |
| IN_PROGRESS (self) | कनेक्शन को कॉल करें | `cta.call_customer` | **Tertiary** | Sticky | Masked call | — | `Icons.Filled.Call` |
| INSTALL_SUBMITTED | — | — | — | — | — | — | — |
| DELEGATED_NOT_STARTED | कनेक्शन को कॉल करें | `cta.call_customer` | Tertiary | Sticky | Masked call | — | `Icons.Filled.Call` |
| DELEGATED_IN_PROGRESS | कनेक्शन को कॉल करें | `cta.call_customer` | Tertiary | Sticky | Masked call | — | `Icons.Filled.Call` |
| DELEGATED_OVERDUE | टेक्निशियन बदलें | `cta.assign_executor` | **Secondary** | Sticky | ExecutorAssignmentSheet | — | — |
| VERIFICATION_PENDING | — | — | — | — | — | — | — |
| RESOLVED | — | — | — | — | — | — | — |
| **All states except AWAITING_SLOT_PROPOSAL** (exit) | नहीं कर पाएँगे | `exit.link` | Tertiary neutral | Triple-dot overflow in ModuleHeader | ExitReasonSheet | — | — |

**Button type tokens:**

| Property | Primary | Secondary | Tertiary | Destructive |
|---|---|---|---|---|
| Background | `WiomColors.brandPrimary` (#D9008D) | `WiomColors.bgSurface` (#FFFFFF) | transparent | `WiomColors.bgNegative` |
| Text color | `WiomColors.textOnBrand` (#FFFFFF) | `WiomColors.textPrimary` (#161021) | `WiomColors.textPrimary` | `WiomColors.stateNegative` |
| Border | none | 1dp `WiomColors.strokeSecondary` | none | none |
| Typography | `WiomTextStyle.cta` — 16sp SemiBold / 24sp LH | same | same | same |
| Min height | `WiomComponent.ctaHeight` = 52dp | same | same | same |
| Corner radius | `WiomRadius.cta` = 16dp | same | same | same |
| Horizontal padding | 16dp (`WiomSpacing.lg`) | same | same | same |
| Vertical padding | 12dp (`WiomSpacing.md`) | same | same | same |
| Icon-text gap | 8dp (`WiomSpacing.sm`) | same | same | same |
| Pressed state | `WiomColors.brandPrimaryPressed` | ripple | ripple | ripple |

**Overflow menu tokens (triple-dot in ModuleHeader):**

| Property | Token |
|---|---|
| Container bg | `WiomColors.bgSurface` |
| Item text | `WiomTextStyle.menuItem` (16sp Regular / 24sp LH) |
| Item text color | `WiomColors.textPrimary` (exit is **neutral**, not red) |
| Item min height | 48dp |
| Item horizontal padding | `WiomSpacing.lg` = 16dp |

### 5.9 Exit link spec (v1.5.1 update)

| Property | v1.5 | v1.5.1 |
|---|---|---|
| Text | `[COPY:exit.link]` "नहीं कर पाएँगे" | unchanged |
| Location | §5 bottom row (all states except 3) | **Triple-dot overflow menu** for all states except AWAITING_SLOT_PROPOSAL. For AWAITING_SLOT_PROPOSAL it's **inline Tertiary below primary in WiomCtaBar**. |
| Type | Pink text link, `bodySmall` / `brand.primary` | `WiomButton` Tertiary, `WiomTextStyle.cta` / `WiomColors.textPrimary` (neutral, not pink) |
| Tap target | Full row, 48dp min height | `WiomButton` 52dp min height |
| Tap | Opens Exit Reason Sheet | unchanged |
| **Reversibility** | Implicit | **Explicit: Tertiary neutral, not Destructive. Task reverts to queue = reversible.** |

### 5.10 Drilldown stacking rule (guardrail)

```
Primary CTA must always be visually ABOVE exit.
Exit must always be the LAST interactive element in the primary-action flow.
For AWAITING_SLOT_PROPOSAL: exit is inline below primary in WiomCtaBar.
For all other states: exit is behind a triple-dot overflow menu (two-tap intent gate).
```

This prevents future drift. If new sections are added to drilldown, they go ABOVE the CTA bar — never below. The overflow menu is the only surface that can contain exit-like actions.

### 5.11 Per-state drilldown callouts

For each of the 13 states, this section lists:
- **HIDDEN** — row/section not rendered
- **FORMAT** — existing element, different visual treatment
- **NEW** — element added in v1.5.1
- **MODIFIED** — existing element, copy/logic change
- **Banner** table with all tokens

---

#### 5.11.1 AWAITING_SLOT_PROPOSAL

**Callouts:**
- **HIDDEN** Executor section
- **HIDDEN** Scheduling section slot rows (no slots exist)
- **NEW** `InstallStateBanner` at top of scroll body
- **FORMAT** Deadline pill text weight Regular → Bold
- **MODIFIED** Exit link moved to **inline Tertiary below primary in WiomCtaBar**
- **MODIFIED** `cta.propose_slots` text: समय भेजें → स्लॉट प्रस्तावित करें

**Banner:**

| Property | Value |
|---|---|
| Title | समय चुनना बाकी है |
| Subtitle | कनेक्शन से दो स्लॉट पूछने हैं |
| Icon | `Icons.Filled.Schedule` |
| Icon tint | `WiomColors.stateWarning` (#B85C00) |
| Background | `WiomColors.bgUrgent` (#FFF2BF) |
| Accent | `WiomColors.stateWarning` |
| Subtitle color | `WiomColors.textPrimary` |

**CTA row:** Primary `स्लॉट प्रस्तावित करें` + inline Tertiary `नहीं कर पाएँगे`

---

#### 5.11.2 AWAITING_CUSTOMER_SELECTION

**Callouts:**
- **HIDDEN** Executor section
- **HIDDEN** Primary CTA (state blocked on customer)
- **NEW** Banner
- **FORMAT** Slot status badge: v1.5 purple pill → v1.5.1 grey text, no pill
- **MODIFIED** `slot.active` + `slot.proposed` = पेंडिंग है (identical)

**Banner:**

| Property | Value |
|---|---|
| Title | कनेक्शन चुन रहा है |
| Subtitle | दो स्लॉट भेजे हैं · जवाब का इंतज़ार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` (#6D17CE) |
| Background | `WiomColors.bgInfo` (#F1E5FF) |
| Accent | `WiomColors.stateInfo` |

**CTA row:** No primary. Exit in triple-dot overflow.

---

#### 5.11.3 SLOT_CONFIRMED

**Callouts:**
- **NEW** Banner
- **FORMAT** Slot section filter: only confirmed slot shown
- **MODIFIED** Executor header = टेक्निशियन चुनें (action form)
- **MODIFIED** `cta.assign_executor` = व्यक्ति चुनें → टेक्निशियन चुनें
- **MODIFIED** Sheet title = कौन करेगा इंस्टॉल? → सेटअप कौन करेगा?
- **MODIFIED** Executor radio list: drop `(स्वयं)` suffix
- **FORMAT** Sheet drag handle = `WiomColors.strokeSecondary`

**Banner:**

| Property | Value |
|---|---|
| Title | स्लॉट पक्का हुआ |
| Subtitle | अब टेक्निशियन चुनना है |
| Icon | `Icons.Filled.Check` |
| Icon tint | `WiomColors.statePositive` (#008043) |
| Background | `WiomColors.bgPositive` (#E1FAED) |
| Accent | `WiomColors.statePositive` |

**Confirmed slot chip:** text `कन्फर्म है`, `WiomColors.statePositive` text on `WiomColors.bgPositive` pill, `WiomRadius.tiny` (4dp), `WiomTextStyle.chipState`.

**CTA row:** Primary `टेक्निशियन चुनें` → ExecutorAssignmentSheet.

---

#### 5.11.4 IN_PROGRESS (self)

**Callouts:**
- **NEW** Banner with executor-name template
- **MODIFIED** Primary CTA type: Primary → **Tertiary link-style with trailing Call icon**
- **MODIFIED** Timeline cue: `Install chalu hai` → `Slot aane wala hai` / today cue
- **DIVERGENCE from v1.5 §3** Exit available in overflow (v1.5: no exit for IN_PROGRESS)
- **MODIFIED** `reason.in_progress` = इंस्टॉल चल रहा है → सेटअप चल रहा

**Banner:**

| Property | Value |
|---|---|
| Title | सेटअप पर काम चल रहा है |
| Subtitle (template) | `{executorName} काम कर रहे हैं` (respectful plural) |
| Subtitle (fallback) | काम चालू है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |
| Accent | `WiomColors.stateInfo` |

**CTA row:** Tertiary `कनेक्शन को कॉल करें` + trailing `Icons.Filled.Call` → masked call.

---

#### 5.11.5 DELEGATED_OVERDUE

**Callouts:**
- **NEW** Event-style banner with named actor + past-action verb
- **FORMAT** Banner title `maxLines = 2`
- **FORMAT** Accent = negative color family (only state using red bg)
- **MODIFIED** Executor section shows `कन्फर्म है` chip (problem is execution, not assignment)
- **NEW** Inline call icon on right edge of executor row
- **MODIFIED** Primary CTA type = Secondary `टेक्निशियन बदलें`
- **FIX** Routing — `TaskDrilldownScreen` when-block now includes `DELEGATED_OVERDUE`

**Banner:**

| Property | Value |
|---|---|
| Title (template) | `{executorName} ने कनेक्शन सेटअप में देरी कर दी` |
| Title (fallback) | टेक्निशियन ने कनेक्शन सेटअप में देरी कर दी |
| Subtitle | सेटअप को जल्दी पूरा करवाएं |
| Icon | `Icons.Filled.Warning` |
| Icon tint | `WiomColors.stateNegative` (#D92130) |
| Background | `WiomColors.bgNegative` (#FFE5E7) |
| Accent | `WiomColors.stateNegative` |
| Title `maxLines` | 2 |

**Inline call icon in executor row:** `Icons.Filled.Call`, tint `WiomColors.textSecondary`, 20dp icon in 48dp tap target, right-edge aligned with chip above.

**CTA row:** Secondary `टेक्निशियन बदलें` → ExecutorAssignmentSheet.

---

#### 5.11.6 RESOLVED

**Callouts:**
- **NEW** Banner
- **MODIFIED** Subtitle: `ग्राहक का नेट चालू है` → `कनेक्शन का नेट चालू है`
- **HIDDEN** No primary CTA

**Banner:**

| Property | Value |
|---|---|
| Title | सेटअप पूरा हुआ |
| Subtitle | कनेक्शन का नेट चालू है |
| Icon | `Icons.Filled.Check` |
| Icon tint | `WiomColors.statePositive` |
| Background | `WiomColors.bgPositive` |
| Accent | `WiomColors.statePositive` |

---

#### 5.11.7 SCHEDULED (slot day, `isSlotDay = true`)

**Callouts:**
- **NEW** Banner with today cue
- **NEW** Label key `cta.start_installation` (was rendering `[cta.start_installation]` literal)
- **MODIFIED** Subtitle: `कोई भी वक्त` → `किसी भी वक्त` (oblique case)
- **FORMAT** Deadline pill Bold weight

**Banner:**

| Property | Value |
|---|---|
| Title | आज सेटअप का दिन है |
| Subtitle | किसी भी वक्त शुरू कर सकते हो |
| Icon | `Icons.Filled.Schedule` |
| Icon tint | `WiomColors.stateWarning` |
| Background | `WiomColors.bgUrgent` |
| Accent | `WiomColors.stateWarning` |

**CTA row:** Primary `सेटअप शुरू करें` → install flow.

---

#### 5.11.8 SCHEDULED (future, `isSlotDay = false`) — GAP STATE

Banner branch exists but **no mock card seeded** in v1.5.1. Debug panel should expose this variant.

| Property | Value |
|---|---|
| Title | सेटअप पक्का हुआ |
| Subtitle | `task.deadlineDisplay` (e.g. `3 दिन बाकी`) |
| Icon | `Icons.Filled.Schedule` |
| Background | `WiomColors.bgPositive` |
| Accent | `WiomColors.statePositive` |

---

#### 5.11.9 NEEDS_RESCHEDULING

**Callouts:**
- **NEW** Banner with action framing (not shame framing)
- **HIDDEN** Executor section (can't pick executor without confirmed slot)
- **REMOVED** Repeated subtext `कनेक्शन के लिए दोबारा स्लॉट चुनें`
- **FIX** Slot section after resubmit shows new slots (callback chain bug fixed)
- **MODIFIED** `reason.reschedule` = फिर से समय भेजें → कनेक्शन के लिए नया समय चुनें

**Banner:**

| Property | Value |
|---|---|
| Title | कनेक्शन के लिए नया समय चुनें |
| Subtitle | दोबारा स्लॉट प्रस्ताव भेजो |
| Icon | `Icons.Filled.Warning` |
| Icon tint | `WiomColors.stateWarning` |
| Background | `WiomColors.bgUrgent` |
| Accent | `WiomColors.stateWarning` |

**CTA row:** Primary `स्लॉट प्रस्तावित करें` → SlotProposalSheet.

---

#### 5.11.10 SCHEDULING_FAILED

**Callouts:**
- **HIDDEN FROM FEED ENTIRELY** via `MockTaskRepository.buildTaskFeed()` filter
- **NEW** Banner (if deep-linked)
- **MODIFIED** Transliteration: `confirm` → `कन्फर्म`, `cancel` → `कैंसल`
- **MODIFIED** `reason.scheduling_failed` = ग्राहक से पुष्टि हो रही है → कनेक्शन ने कन्फर्म नहीं किया

**Banner:**

| Property | Value |
|---|---|
| Title | कनेक्शन ने स्लॉट कन्फर्म नहीं किया |
| Subtitle | पुराने स्लॉट कैंसल हुए · CSP कोई काम नहीं |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

#### 5.11.11 INSTALL_SUBMITTED (NEW state vs v1.5)

**Callouts:**
- **NEW** State — v1.5 §2.5 only defined VERIFICATION_PENDING → RESOLVED
- **NEW** Banner with queued semantics (distinct from VERIFICATION_PENDING)
- **NEW** Deadline `सबमिट हो चुका है`
- **NEW** Timeline event `सेटअप सबमिट हुआ`
- **HIDDEN** No primary CTA, no exit

**Banner:**

| Property | Value |
|---|---|
| Title | सेटअप सबमिट हुआ |
| Subtitle | वेरिफाई के लिए तैयार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

#### 5.11.12 DELEGATED_NOT_STARTED

**Callouts:**
- **NEW** Banner with event framing (named actor + past negative)
- **MODIFIED** Primary CTA = Tertiary + trailing Call icon
- **LOOSE END** User flagged "rajesh would not have a space in spelling" — unreproduced

**Banner:**

| Property | Value |
|---|---|
| Title (template) | `{executorName} ने सेटअप अभी शुरू नहीं किया` |
| Title (fallback) | सेटअप अभी शुरू नहीं हुआ |
| Subtitle | जो व्यक्ति चुना है उसका इंतज़ार |
| Icon | `Icons.Filled.HourglassBottom` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

#### 5.11.13 DELEGATED_IN_PROGRESS

**Callouts:**
- **NEW** Banner with respectful plural
- **FIX** `reasonTimerDisplay` for home card: `सुनील काम कर रहा है` → `काम कर रहे हैं` (was drifting from banner)
- **MODIFIED** Primary CTA = Tertiary + trailing Call icon

**Banner:**

| Property | Value |
|---|---|
| Title (template) | `{executorName} काम कर रहे हैं` |
| Title (fallback) | काम चालू है |
| Subtitle | सेटअप पर काम चल रहा है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

#### 5.11.14 VERIFICATION_PENDING

**Callouts:**
- **NEW** Banner with actively-verifying semantics (distinct from INS-1050 queued)
- **NEW** Deadline `वेरिफिकेशन चल रहा है`
- **NEW** Timeline event `वेरिफाई शुरू हुआ`
- **FORMAT** Short `ि` matra throughout (`वेरिफाई`, `वेरिफिकेशन`)
- **HIDDEN** No primary CTA

**Banner:**

| Property | Value |
|---|---|
| Title | सेटअप वेरिफाई हो रहा है |
| Subtitle | व्योम जाँच रहा है |
| Icon | `Icons.Filled.Sync` |
| Icon tint | `WiomColors.stateInfo` |
| Background | `WiomColors.bgInfo` |

---

## 6. Post-Action Behavior

| Action | Before | After | Mechanism |
|---|---|---|---|
| Submit slots (first) | L6 AWAITING_SLOT | L4 AWAITING_CUSTOMER | Server refresh (implicit accept) |
| Submit slots (reschedule) | NEEDS_RESCHEDULING | AWAITING_CUSTOMER | Server refresh — **v1.5.1: slot data now threads through callback chain** |
| Assign executor | SLOT_CONFIRMED | SCHEDULED | Server refresh |
| Dispatch | SCHEDULED | IN_PROGRESS | DIRECT optimistic. Rollback: revert + toast. |
| Call Customer | Any (slot day, from drilldown) | No state change | DIRECT. Call fails → error toast. |
| Exit | Any eligible | Task reverts to queue | Server refresh — **v1.5.1: task can be received again (reversible)** |
| Submit install | IN_PROGRESS | INSTALL_SUBMITTED → VERIFICATION_PENDING → RESOLVED | Server refresh. v1.5.1 splits INSTALL_SUBMITTED from VERIFICATION_PENDING. |

No optimistic morph for ACTION_SHEET flows. Optimistic only for DIRECT (Dispatch, Call).

### P41 expiry during slot sheet

Submit → server returns error → toast `[COPY:assignment_expired]` → card disappears.

---

## 7. Edge States

| State | Treatment |
|---|---|
| No install tasks | No card |
| P41 expires | Card disappears. Toast. |
| P41 expires during sheet | Submit fails. Toast. Card disappears. |
| Customer selects slot live | Card updates in-place |
| SCHEDULING_FAILED live | **v1.5.1: filter-hidden from CSP feed entirely** (was: CTAs disappear, passive) |
| P74 nearing expiry | Timer: normal → urgent → overdue |
| Offline | CTAs disabled. Toast. |
| Dispatch reject | Revert to SCHEDULED. Toast. |
| Call fails | Error toast. Card unchanged. |

---

## 8. Notifications

| Event | Push? | Key | v1.5.1 value |
|---|---|---|---|
| New assignment | ✅ | `notif.new_assignment` | नया सेटअप मिला *(v1.5: नया इंस्टॉल — समय भेजें)* |
| P41 urgent | ✅ | `notif.act_soon` | जल्दी समय भेजें — काम जा सकता है *(unchanged)* |
| Customer confirmed | ✅ | `notif.slot_confirmed` | कनेक्शन ने समय चुना — टेक्निशियन चुनें *(v1.5: ग्राहक…व्यक्ति)* |
| Reschedule needed | ✅ | `notif.reschedule_needed` | फिर से समय भेजें *(unchanged)* |
| P74 urgent | ✅ | `notif.install_deadline` | सेटअप का समय पास *(v1.5: समय सीमा करीब)* |
| Others | ❌ | — | — |

---

## 9. Behavioral Invariants (22)

All 22 invariants from v1.5 still hold in v1.5.1. No invariant changes — only implementation details + copy register.

| # | Invariant |
|---|---|
| 1 | **No Accept button.** Scheduling IS acceptance. |
| 2 | **Exit in drilldown only.** Never on card. |
| 3 | **Card = 2 lines, no CTA.** Identity + context/urgency. Tap → drilldown. |
| 4 | **🏠 icon = install type.** Fixed. Never changes. |
| 5 | **No "देखें ›".** Tappable affordance is visual (elevation, ripple), not textual. |
| 6 | **No CTA on any install card. Zero exceptions.** All actions live in drilldown. |
| 7 | **Call Customer = drilldown only, day of confirmed slot only.** Never on card. |
| 8 | **No customer name or phone.** Masked call only. |
| 9 | **Service address in drilldown only.** Never on card. |
| 10 | **Accent driven by timer_state.** Per Component Registry §4. |
| 11 | **All cards behave identically.** No passive/active distinction. |
| 12 | **P74 on card for bottleneck states only.** |
| 13 | **Assignment source in drilldown.** Visually neutral. |
| 14 | **Primary CTA in drilldown only.** Per state. |
| 15 | **Auto-assign if no team.** |
| 16 | **No exit consequences shown.** |
| 17 | **Reason line = one line max.** Truncate. |
| 18 | **Reason understandable without timer.** |
| 19 | **No optimistic morph for ACTION_SHEET.** |
| 20 | **Journey continuity.** Card evolves through all states. Same identity line. |
| 21 | **Full refresh after every action.** |
| 22 | **No auto-dismiss.** RESOLVED stays until CSP acknowledges by opening drilldown. |

---

## 10. Hindi Label Keys (v1.5.1 — 53 required + 31 optional banner keys)

v1.5.1 updates values for 15 keys from v1.5, adds 4 required keys (`drilldown.executor_section.assigned`, `cta.start_installation`, `executor.install.title`, plus internal `slot.*` tone-down values), and proposes 31 optional banner keys for a follow-up migration pass.

### 10.1 Flow keys (8)

| Key | v1.5.1 Hindi | v1.5 Hindi (if changed) | English |
|---|---|---|---|
| `reason.propose_slots` | समय चुनना बाकी है | *(was: समय भेजें — ग्राहक को बताना है)* | Propose a suitable time |
| `reason.awaiting_customer` | कनेक्शन अभी स्लॉट कन्फर्म कर रहे हैं | *(was: ग्राहक चुन रहा है)* | Connection is choosing slot |
| `reason.slot_confirmed` | समय चुन लिया गया है | *(was: समय पक्का हो गया)* | Time is confirmed |
| `reason.scheduled` | कनेक्शन तैयार है · स्लॉट आने वाला है | *(was: तैयार — भेजने से पहले)* | Connection is ready · Upcoming slot |
| `reason.scheduled_today` | आज का काम · तैयार रहें | *(was: आज का काम — तैयार)* | Today's work · Be ready |
| `reason.reschedule` | कनेक्शन के लिए नया समय चुनें | *(was: फिर से समय भेजें)* | Propose new times for connection |
| `reason.scheduling_failed` | कनेक्शन ने कन्फर्म नहीं किया | *(was: ग्राहक से पुष्टि हो रही है)* | Connection didn't confirm |
| `reason.in_progress` | सेटअप चल रहा | *(was: इंस्टॉल चल रहा है)* | Install in progress |

### 10.2 CTA keys (9)

| Key | v1.5.1 Hindi | v1.5 Hindi (if changed) | English |
|---|---|---|---|
| `cta.propose_slots` | स्लॉट प्रस्तावित करें | *(was: समय भेजें)* | Propose times |
| `cta.submit_slots` | समय भेजें | — | Submit times |
| `cta.assign_executor` | टेक्निशियन चुनें | *(was: व्यक्ति चुनें)* | Choose technician |
| `cta.assign` | चुनें | — | Assign |
| `cta.dispatch` | शुरू करें | — | Start / Dispatch |
| `cta.start_installation` **(NEW)** | सेटअप शुरू करें | *(key did not exist — was rendering `[cta.start_installation]` placeholder)* | Start setup |
| `cta.call_customer` | कनेक्शन को कॉल करें | *(was: कॉल करें / ग्राहक को कॉल करें)* | Call customer |
| `cta.confirm_exit` | पुष्टि करें | — | Confirm exit |

### 10.3 Exit keys (6) — UNCHANGED

| Key | Hindi | English |
|---|---|---|
| `exit.title` | ये काम क्यों नहीं हो सकता? | Why can't you do this? |
| `exit.link` | नहीं कर पाएँगे | Can't do this |
| `exit.LOCATION_UNREACHABLE` | जगह तक पहुँच नहीं | Location unreachable |
| `exit.CAPACITY_FULL` | अभी क्षमता नहीं | At capacity |
| `exit.CUSTOMER_CANCELLED` | ग्राहक ने रद्द किया | Customer cancelled *(legitimate `ग्राहक` — English label pair)* |
| `exit.TECHNICIAN_UNAVAILABLE` | टेक्नीशियन उपलब्ध नहीं | Technician unavailable |

### 10.4 Context keys (10)

| Key | v1.5.1 Hindi | v1.5 Hindi (if changed) | English |
|---|---|---|---|
| `slots.title` | दो समय भेजें | — | Propose two slots |
| `slots.slot1` | पहला समय | — | First slot |
| `slots.slot2` | दूसरा समय | — | Second slot |
| `executor.title` | सेटअप कौन करेगा? | *(was: कौन करेगा इंस्टॉल?)* | Who will setup? |
| `executor.install.title` **(NEW)** | सेटअप कौन करेगा? | *(new key — breaks cross-bundle collision with restore's executor.title = "कौन ठीक करेगा?")* | Who will setup? |
| `executor.self` | मैं खुद करूँगा | — | I'll do it myself |
| `executor.not_assigned` | अभी तय नहीं | — | Not assigned yet |
| `contact.not_yet` | समय आने पर उपलब्ध | — | Available on slot day |
| `contact.call_label` | कॉल करें | — | Call |
| `scheduling_failed_system_handling` | कनेक्शन से पुष्टि हो रही है | *(was: ग्राहक से पुष्टि हो रही है)* | Confirming with customer |

### 10.5 Source + section keys (6) — UNCHANGED

| Key | Hindi | English |
|---|---|---|
| `assignment_source.new` | नया अनुरोध | New request |
| `assignment_source.retry` | पुनः प्रयास | Retry |
| `assignment_source.reallocation` | पुनः आवंटन | Reassigned |
| `assignment_expired` | समय निकल गया | Expired |
| `requires_online` | इंटरनेट ज़रूरी है | Requires internet |
| `scheduling_timeline` | शेड्यूल इतिहास | Scheduling history |

### 10.6 Slot badge keys (4)

| Key | v1.5.1 Hindi | v1.5 Hindi | English |
|---|---|---|---|
| `slot.proposed` | पेंडिंग है | *(was: भेजा गया)* | Proposed |
| `slot.active` | पेंडिंग है | *(was: जवाब बाकी)* | Awaiting |
| `slot.confirmed` | कन्फर्म है | *(was: पक्का)* | Confirmed |
| `slot.expired` | समाप्त | — | Expired |

### 10.7 Notification keys (5)

| Key | v1.5.1 Hindi | v1.5 Hindi (if changed) | English |
|---|---|---|---|
| `notif.new_assignment` | नया सेटअप मिला | *(was: नया इंस्टॉल — समय भेजें)* | New install — propose |
| `notif.act_soon` | जल्दी समय भेजें — काम जा सकता है | — | Respond soon |
| `notif.slot_confirmed` | कनेक्शन ने समय चुना — टेक्निशियन चुनें | *(was: ग्राहक ने समय चुना — व्यक्ति चुनें)* | Customer picked — assign |
| `notif.reschedule_needed` | फिर से समय भेजें | — | Repropose |
| `notif.install_deadline` | सेटअप का समय पास | *(was: समय सीमा करीब)* | Deadline approaching |

### 10.8 Section label keys (4)

| Key | v1.5.1 Hindi | v1.5 Hindi (if changed) | English |
|---|---|---|---|
| `drilldown.location_section` | जगह | *(was: स्थान)* | Location |
| `drilldown.schedule_section` | कनेक्शन लगने का समय | *(was: शेड्यूल)* | Schedule |
| `drilldown.executor_section` | टेक्निशियन चुनें (action form) | *(was: व्यक्ति — single static label)* | Choose technician |
| `drilldown.executor_section.assigned` **(NEW)** | टेक्निशियन | *(new — informational form once executor assigned)* | Technician |

### 10.9 Banner keys (31 NEW — proposed for migration)

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
| `banner.in_progress.subtitle_template` | `{executorName} काम कर रहे हैं` |
| `banner.in_progress.subtitle_fallback` | काम चालू है |
| `banner.install_submitted.title` | सेटअप सबमिट हुआ |
| `banner.install_submitted.subtitle` | वेरिफाई के लिए तैयार |
| `banner.delegated_not_started.title_template` | `{executorName} ने सेटअप अभी शुरू नहीं किया` |
| `banner.delegated_not_started.title_fallback` | सेटअप अभी शुरू नहीं हुआ |
| `banner.delegated_not_started.subtitle` | जो व्यक्ति चुना है उसका इंतज़ार |
| `banner.delegated_in_progress.title_template` | `{executorName} काम कर रहे हैं` |
| `banner.delegated_in_progress.title_fallback` | काम चालू है |
| `banner.delegated_in_progress.subtitle` | सेटअप पर काम चल रहा है |
| `banner.delegated_overdue.title_template` | `{executorName} ने कनेक्शन सेटअप में देरी कर दी` |
| `banner.delegated_overdue.title_fallback` | टेक्निशियन ने कनेक्शन सेटअप में देरी कर दी |
| `banner.delegated_overdue.subtitle` | सेटअप को जल्दी पूरा करवाएं |
| `banner.verification_pending.title` | सेटअप वेरिफाई हो रहा है |
| `banner.verification_pending.subtitle` | व्योम जाँच रहा है |
| `banner.resolved.title` | सेटअप पूरा हुआ |
| `banner.resolved.subtitle` | कनेक्शन का नेट चालू है |

**Key count: 49 baseline (v1.5) + 4 required new (`drilldown.executor_section.assigned`, `cta.start_installation`, `executor.install.title`, `INSTALL_SUBMITTED` reason if migrated) = 53 required. +31 optional banner keys = 84 if banner migration lands in same PR.**

---

## 11. Component Map

| Need | Source | New? |
|---|---|---|
| Card container (2-line, no CTA), timer, accent | Component Registry §2.4 v1.1 | No |
| Type icon (🏠) | Component Registry §2.8 | No |
| Update badge (brand circle ●N) | Component Registry §2.12 | No |
| Timeline highlight (bg.brandTint) | Component Registry §2.13 | No |
| ACTION_SHEET container | Component Registry §2.7 | No |
| Toast | Component Registry §2.6 | No |
| **DatePickerTrigger** | — | Yes (v1.5) |
| **TimeRangePicker** | — | Yes (v1.5) |
| **SlotStatusBadge** | Wiom DS / wiom-badge skill | **v1.5.1: restyled** — `WiomRadius.tiny`, `WiomTextStyle.chipState`, grey for pending |
| **MaskedCallCTA** | — | Yes (v1.5) |
| **`InstallStateBanner`** | v1.5.1 | **Yes (NEW in v1.5.1)** — 13 per-state variants in one component |
| **`WiomButton`** | core:common, wiom-cta skill | **Yes (NEW in v1.5.1)** — polymorphic CTA, 4 types, leading/trailing icon slots |
| **`WiomBadge`** family | core:common, wiom-badge skill | **Yes (NEW in v1.5.1)** — Count / Dot / LabelTinted variants |
| **`WiomNavRow`** | core:common | **Yes (NEW in v1.5.1)** — navigation affordance, chevron row |
| **`WiomCtaBar`** | core:common | **Yes (NEW in v1.5.1)** — sticky flat bottom container with 1dp border-top |
| **`WiomHeader`** with triple-dot overflow menu | core:common (extended) | **Yes (extended in v1.5.1)** — adds overflow menu slot |

**Summary:** 4 new v1.5 components (still needed) + 5 new v1.5.1 components (`InstallStateBanner`, `WiomButton`, `WiomBadge`, `WiomNavRow`, `WiomCtaBar`) + 1 extended (`WiomHeader`). **10 component additions total.**

---

## 12. What NOT to Build

- No Accept button
- No Exit on card
- No customer name or phone anywhere
- No address on card (drilldown only)
- No Call CTA on any card — drilldown only, slot day only
- No actual phone number display
- No copy/paste of contact info
- No negotiation UI
- No install dashboard/counter
- No animations beyond fade
- No exit consequences
- No color-coded assignment source
- **No Destructive red styling for exit** (v1.5.1 — exit is reversible, uses neutral Tertiary)
- **No `InstallStateBanner` variants outside the 13 enum values** — any new state must add a when-branch, never silently fall through
- **No raw `Color(0x...)` literals in install drilldown files** — must come from `WiomColors.*`
- **No `FontWeight.Bold` in button text** — v1.5.1 uses `FontWeight.SemiBold` via `WiomTextStyle.cta`
- **No emoji in functional button text** — use Material Icons via `leadingIcon` / `trailingIcon`

---

## 13. Validation Checklist (28 items)

v1.5 had 15 validation checks. v1.5.1 adds 13 more. All 28 are automated via the [`/validation`](https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown/tree/main/validation) harness — run before opening the PR.

### v1.5 checks (still hold)

| # | Check |
|---|---|
| 1 | First action = Propose Slots (not Accept) — in drilldown |
| 2 | 🏠 icon on identity line |
| 3 | No CTA on any card — all actions in drilldown |
| 4 | No "देखें ›" — cards are tappable surfaces |
| 5 | Update badge `(N)` visible when > 0, resets on drilldown open |
| 6 | Exit in drilldown only, discoverable <5s |
| 7 | Service address in drilldown, not card |
| 8 | Customer name/phone never visible |
| 9 | Call CTA appears ONLY on slot day, in drilldown |
| 10 | Masked call — no number shown |
| 11 | All cards behave identically — no passive/active |
| 12 | RESOLVED stays until CSP acknowledges — no auto-dismiss |
| 13 | Delegation states show executor name in Line 2 |
| 14 | Card feels like one journey through all states |
| 15 | Timer treatment per Component Registry §2.4 v1.1 |

### v1.5.1 additions

| # | Check |
|---|---|
| 16 | `InstallStateBanner` has a when-branch for all 13 `InstallState` enum values — no silent fallthrough |
| 17 | Every banner title + subtitle appears either as literal Devanagari or Unicode escape in source |
| 18 | CTA bar is flat with 1dp `strokePrimary` border-top (no shadow) |
| 19 | No raw `Color(0x...)` literals in any install drilldown file — all colors come from `WiomColors.*` |
| 20 | No `FontWeight.Bold` in button text — redesign uses `SemiBold` via `WiomTextStyle.cta` |
| 21 | All button text uses `WiomTextStyle.cta`, not inline TextStyle |
| 22 | Exit CTA is **never** Destructive type (reversibility rule) |
| 23 | Cross-bundle label collisions: every shared key between install/restore/netbox bundles has matching values OR is renamed with module prefix |
| 24 | No trailing/leading whitespace in `*_hi_en.json` hi values |
| 25 | No Latin English words mid-Devanagari string (submit/verify/confirm/cancel/status) |
| 26 | Respectful plural for any named executor (Annu, Rajesh, Sunil, etc.) |
| 27 | Oblique case for time expressions (`किसी भी वक्त`, not `कोई भी वक्त`) |
| 28 | `exit.CUSTOMER_CANCELLED` is the only legitimate `ग्राहक` in the install bundle |

---

## 14. Design Token Reference

Quick lookup for every token referenced anywhere in this spec. All values come from `core/common/src/main/java/com/wiom/csp/core/common/theme/WiomTokens.kt`. Tokens with getter-based forks read from `WiomDsMode.isRedesign` — the redesign hex is shown.

### 14.1 Color tokens

| Token | Redesign hex | Used by |
|---|---|---|
| `WiomColors.brandPrimary` | #D9008D | Primary CTA bg, brand chevrons |
| `WiomColors.textPrimary` | #161021 | Primary text, neutral button text, exit link |
| `WiomColors.textSecondary` | #5C5570 | Metadata, slot pending text, call icon, timestamps |
| `WiomColors.textHint` | #A7A1B2 | Disabled, version strings |
| `WiomColors.textOnBrand` | #FFFFFF | Text on brand CTAs |
| `WiomColors.bgScreen` | #FAF9FC | Screen background |
| `WiomColors.bgSurface` | #FFFFFF | Card bg, CTA bar bg |
| `WiomColors.bgUrgent` | #FFF2BF | AWAITING_SLOT_PROPOSAL, SCHEDULED (today), NEEDS_RESCHEDULING banner bg |
| `WiomColors.bgPositive` | #E1FAED | SLOT_CONFIRMED, RESOLVED banner bg; confirmed slot chip bg |
| `WiomColors.bgNegative` | #FFE5E7 | DELEGATED_OVERDUE banner bg, Destructive button bg |
| `WiomColors.bgInfo` | #F1E5FF | AWAITING_CUSTOMER_SELECTION, IN_PROGRESS, SCHEDULING_FAILED, INSTALL_SUBMITTED, DELEGATED_NOT_STARTED, DELEGATED_IN_PROGRESS, VERIFICATION_PENDING banner bg |
| `WiomColors.statePositive` | #008043 | `slot.confirmed` chip text, positive accents |
| `WiomColors.stateNegative` | #D92130 | DELEGATED_OVERDUE banner accent, Destructive button text |
| `WiomColors.stateWarning` | #B85C00 | AWAITING_SLOT_PROPOSAL, SCHEDULED (today), NEEDS_RESCHEDULING banner accent |
| `WiomColors.stateInfo` | #6D17CE | Info banner accent (purple — was blue in baseline) |
| `WiomColors.strokePrimary` | #E8E4F0 | Card borders, CTA bar top border |
| `WiomColors.strokeSecondary` | #D7D3E0 | Sheet drag handle, secondary borders |
| `WiomColors.brandPrimaryPressed` | #A30070 | Primary CTA pressed state |

### 14.2 Typography tokens

| Token | Size / weight / LH | Used by |
|---|---|---|
| `WiomTextStyle.cardIdentity` | 14sp SemiBold / 24sp | Banner title, section headers, card identity |
| `WiomTextStyle.cta` | 16sp SemiBold (redesign) / 24sp LH | `WiomButton` text |
| `WiomTextStyle.reasonTimer` | 14sp SemiBold / 24sp | Deadline pill, reason lines |
| `WiomTextStyle.reasonTimerOverdue` | 14sp Bold / 24sp | Overdue variants |
| `WiomTextStyle.body` | 14sp Regular / 24sp | Drilldown body text |
| `WiomTextStyle.bodySmall` | 12sp Regular / 20sp / 0.4sp tracking | Banner subtitle, slot pending text |
| `WiomTextStyle.chipState` | 12sp SemiBold / 20sp / 0.3sp tracking | Slot confirmed badge chip |
| `WiomTextStyle.chipLabel` | 12sp SemiBold / 20sp / 0.3sp tracking | Assurance chip labels |
| `WiomTextStyle.menuItem` | 16sp Regular / 24sp | Overflow menu items |

### 14.3 Spacing tokens

| Token | Value (redesign) | Used by |
|---|---|---|
| `WiomSpacing.xs` | 4dp | Icon-text inline |
| `WiomSpacing.sm` | 8dp | Inter-chip, icon-text in banner, inter-button gap in CTA bar |
| `WiomSpacing.md` | 12dp | Card content, CTA bar vertical padding |
| `WiomSpacing.lg` | 16dp | Screen horizontal margin, banner horizontal padding, CTA horizontal padding |
| `WiomSpacing.xxl` | 24dp | Section gaps in drilldown body |
| `WiomSpacing.huge` | 32dp | Major section separations |
| `WiomSpacing.cardPadding` | 16dp | All card internal padding |
| `WiomSpacing.sheetContentToCta` | 48dp | Sheet content → CTA gap (sd-autolayout §3b) |

### 14.4 Radius tokens

| Token | Value (redesign) | Used by |
|---|---|---|
| `WiomRadius.tiny` | 4dp | Slot status chip |
| `WiomRadius.chip` | 8dp | Assurance chips, small status chips |
| `WiomRadius.card` | 12dp | Cards, banner container |
| `WiomRadius.cta` | 16dp | WiomButton |
| `WiomRadius.dialog` | 24dp | Sheet top corners |

### 14.5 Elevation tokens

| Token | Value (redesign) | Used by |
|---|---|---|
| `WiomElevation.cardBorderWidth` | 1dp | All card borders, CTA bar top border |
| `WiomElevation.accentBorderWidth` | 4dp | Left accent stripe on cards (timer-driven) |
| `WiomElevation.interCardGap` | 16dp | Space between cards in feed |

### 14.6 Component dimension tokens

| Token | Value | Used by |
|---|---|---|
| `WiomComponent.headerHeight` | 48dp | Module header |
| `WiomComponent.headerIconSize` | 48dp | Back button, overflow button tap target |
| `WiomComponent.ctaHeight` | 52dp | WiomButton min height |
| `WiomComponent.ctaPaddingVertical` | 12dp | Button vertical padding |
| `WiomComponent.ctaPaddingHorizontal` | 16dp | Button horizontal padding |

---

## 15. Divergences from v1.5 flagged for product review

Places where v1.5.1 intentionally differs from v1.5. Each needs a product call before the PR lands.

| # | Element | v1.5 says | v1.5.1 does | Why |
|---|---|---|---|---|
| 1 | Slot status badge style (PROPOSED/ACTIVE) | `state.info` + `bg.info` pill | Grey text `पेंडिंग है`, no pill | Tone-down — purple pill implies activity customer hasn't taken |
| 2 | `drilldown.location_section` | स्थान | जगह | Vocab register + resolves cross-bundle collision with restore |
| 3 | `drilldown.executor_section` | व्यक्ति | टेक्निशियन चुनें (action) / टेक्निशियन (info) | Role-specific; state-dependent |
| 4 | `executor.title` | कौन करेगा इंस्टॉल? | सेटअप कौन करेगा? + new key `executor.install.title` | Register shift + collision fix |
| 5 | INSTALL_SUBMITTED as separate state | Not in v1.5 | Added — queued vs actively-verifying (Option C) | Distinct user-facing meaning |
| 6 | Exit available in IN_PROGRESS | "No (onsite — separate module)" | Allowed via overflow menu | Field reality — CSPs need to back out mid-work occasionally |
| 7 | `reason.scheduling_failed` | ग्राहक से पुष्टि हो रही है | कनेक्शन ने कन्फर्म नहीं किया | Factual not aspirational |
| 8 | Banner component existence | No banner in drilldown | `InstallStateBanner` added | Explicit state communication reduces scanning cost |
| 9 | Inline exit on AWAITING_SLOT_PROPOSAL | Exit in §5 bottom row (all states except 3) | Inline Tertiary below primary for this one state only | Fastest escape on empty state |
| 10 | CTA type for IN_PROGRESS + delegated-working | Primary `शुरू करें` / `व्यक्ति चुनें` | Tertiary link-style `कनेक्शन को कॉल करें` with trailing Call icon | Primary affordance in these states is the coordination call |
| 11 | Hindi transliteration mid-Devanagari | Mixed Latin allowed | Systematic Devanagari — सबमिट, वेरिफाई, कन्फर्म, कैंसल, टेक्निशियन | Register consistency |
| 12 | Executor subtitle grammar | `काम कर रहा है` implicitly singular | Respectful plural `काम कर रहे हैं` | Cultural register |
| 13 | Time-expression case | `कोई भी वक्त` | `किसी भी वक्त` (oblique) | Correct Hindi grammar |
| 14 | Exit link styling | Pink brand.primary 12sp "text link" | Neutral Tertiary WiomButton — not pink, not brand | Reversibility rule (neutral color for non-destructive exit) |
| 15 | Primary CTA location | Inline at bottom of scroll per v1.5 skeleton | **Sticky WiomCtaBar outside scroll** | sd-autolayout §6c (CTA outside scroll) |

---

## 16. Debug Panel Spec (NEW in v1.5.1)

v1.5 does not spec a debug panel. v1.5.1 adds install-state simulation to `HomeDebugScreen.kt` so reviewers can walk all 13 states + gap states on-device without backend round-trips.

### 16.1 New `HomeDebugConfig` fields

```kotlin
// Install state filter — when set, buildTaskFeed() returns only tasks in this state
val installStateFilter: String = "ALL"  // ALL / AWAITING_SLOT_PROPOSAL / ... / RESOLVED

// Show gap states in the feed (not normally reachable)
val showGapStates: Boolean = false
```

### 16.2 New section in HomeDebugScreen

```
┌─ Debug Panel ──────────────────────────────────┐
│  ...existing sections...                         │
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
└──────────────────────────────────────────────────┘
```

### 16.3 Routing

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

### 16.4 Token spec

| Element | Token |
|---|---|
| Section header | `WiomTextStyle.cardIdentity`, `WiomColors.textPrimary` |
| Filter dropdown | Standard Material3 `ExposedDropdownMenu`, border `WiomColors.strokeSecondary` |
| Gap-state checkbox | Material3 Checkbox, `checkedColor = WiomColors.brandPrimary` |
| Quick-jump buttons | `WiomButton` Tertiary, 4-column grid, `WiomSpacing.sm` (8dp) gap |
| Button text | State ID, e.g. `INS-1041`, `WiomTextStyle.chipLabel` |
| Container padding | `WiomSpacing.lg` (16dp) horizontal + vertical |
| Section gap | `WiomSpacing.xxl` (24dp) above and below |

### 16.5 Implementation notes

- `installStateFilter` wires into `MockTaskRepository.buildTaskFeed()` via `HomeDebugConfig`
- `showGapStates` controls whether `SCHEDULING_FAILED` (and future `ASSIGNED`, `RECONFIRMATION_PENDING`, `SCHEDULED.isSlotDay=false`) are included in feed output
- Quick-jump buttons bypass `buildTaskFeed()` entirely — they construct the drilldown navigation directly
- Debug panel is only accessible via the `Wiom CSP DS` redesign flavor header debug button; not shipped to production

---

## 17. PR File Allowlist

Source repo: `wiom-tech/wiom-csp-app-apr09@release-01`

Files the feature PR may touch (enforced by [`/validation/scope-allowlist.txt`](https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown/blob/main/validation/scope-allowlist.txt)):

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
feature/home/src/main/java/com/wiom/csp/feature/home/ui/debug/HomeDebugScreen.kt
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
*Self-contained replacement for v1.5. 1 flow. 13 card states + 1 gap variant. 3 sheets. 1 drilldown. 53 required keys + 31 optional banner keys. 28 validation checks. 15 divergences flagged for product review. 10 component additions (5 new in v1.5.1 + 4 new in v1.5 still needed + 1 extended).*
*Depends on: Component Registry v1.1 + Wiom DS v2 foundations. Supersedes v1.5 once merged to `wiom-tech/wiom-csp-app-apr09@release-01`.*
