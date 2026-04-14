# Install Drilldown State Reference

The install task moves through 13 lifecycle states. Each state has its own drilldown view, banner, and CTA set. This directory has one markdown file per state with the final (redesigned) copy, structural rules, and rationale.

---

## State table

| ID | State | Short form | Card | Status |
|---|---|---|---|---|
| INS-1041 | `AWAITING_SLOT_PROPOSAL` | समय चुनना बाकी है | [INS-1041.md](INS-1041.md) | ✅ polished |
| INS-1042 | `AWAITING_CUSTOMER_SELECTION` | कनेक्शन लगने का समय | [INS-1042.md](INS-1042.md) | ✅ polished |
| INS-1043 | `SLOT_CONFIRMED` | टेक्निशियन चुनना बाकी | [INS-1043.md](INS-1043.md) | ✅ polished |
| INS-1044 | `IN_PROGRESS` (self) | काम चालू है | [INS-1044.md](INS-1044.md) | ✅ polished |
| INS-1045 | `DELEGATED_OVERDUE` | देरी हो गई | [INS-1045.md](INS-1045.md) | ✅ polished |
| INS-1046 | `COMPLETED` | कनेक्शन का नेट चालू है | [INS-1046.md](INS-1046.md) | ✅ polished |
| INS-1047 | `INSTALL_DUE_SOON` | सेटअप जल्दी | [INS-1047.md](INS-1047.md) | ✅ polished |
| INS-1048 | `NEEDS_RESCHEDULING` | नया समय चुनें | [INS-1048.md](INS-1048.md) | ✅ polished |
| INS-1049 | `SCHEDULING_FAILED` | (hidden from CSP feed) | [INS-1049.md](INS-1049.md) | ✅ hidden by design |
| INS-1050 | `INSTALL_SUBMITTED` | सेटअप सबमिट हुआ | [INS-1050.md](INS-1050.md) | ✅ polished |
| INS-1051 | `DELEGATED_NOT_STARTED` | {name} ने शुरू नहीं किया | [INS-1051.md](INS-1051.md) | ✅ polished |
| INS-1052 | `DELEGATED_IN_PROGRESS` | {name} काम कर रहे हैं | [INS-1052.md](INS-1052.md) | ✅ polished |
| INS-1053 | `VERIFICATION_PENDING` | सेटअप वेरिफाई हो रहा है | [INS-1053.md](INS-1053.md) | ✅ polished |
| RST-2087 | Restore task (reference) | — | [RST-2087.md](RST-2087.md) | reference only |
| NBX-301 | NetBox task (reference) | — | [NBX-301.md](NBX-301.md) | reference only |

All 13 install states are at v1.0. The 8-PR merge plan in [`/specs/human-spec.md`](../specs/human-spec.md) groups them into reviewable chunks.

---

## Drilldown structure (universal)

Every install drilldown renders this skeleton, with state-aware toggles:

```
┌─ ModuleHeader ──────────────────────────┐
│  ←  सेटअप बाकी है        ⋮ (overflow)   │  ← triple-dot exits to overflow menu
├─────────────────────────────────────────┤
│                                          │  Scroll body:
│  InstallStateBanner                      │  - Banner (always)
│  (state-aware title / subtitle / icon)   │  - Timeline (if events exist)
│                                          │  - Location section
│  Timeline events (optional)              │  - Slot section (state-gated filter)
│                                          │  - Executor section (state-gated visibility)
│  Location section                        │  - Customer contact
│                                          │
│  Slot section                            │
│   ↪ filter: if any CONFIRMED → show      │
│     only confirmed; else show all        │
│                                          │
│  Executor section                        │
│   ↪ hidden for: AWAITING_SLOT_PROPOSAL,  │
│     AWAITING_CUSTOMER_SELECTION,         │
│     NEEDS_RESCHEDULING                   │
│                                          │
│  Customer contact row                    │
│                                          │
├─ WiomCtaBar (sticky, flat, 1dp border) ─┤
│  [Primary CTA]                           │
│  [Tertiary CTA (optional)]               │
└─────────────────────────────────────────┘
```

---

## State-aware rules

### Slot section filter
- If **any** slot in the task is `CONFIRMED` → show only the confirmed slot, hide siblings
- Else → show all slots (PROPOSED / EXPIRED / CANCELLED / REJECTED)
- Bug caught this session: after resubmit in `NEEDS_RESCHEDULING`, old EXPIRED siblings still showed. Root cause was a dropped callback arg — see [`/ux-copy/changelog.md`](../ux-copy/changelog.md) §INS-1048.

### Executor section header
- If `task.executor == null` → action header: `टेक्निशियन चुनें`
- Else → informational header: `टेक्निशियन`
- Completely hidden for: `AWAITING_SLOT_PROPOSAL`, `AWAITING_CUSTOMER_SELECTION`, `NEEDS_RESCHEDULING`

### Exit-install routing
- `AWAITING_SLOT_PROPOSAL` → inline tertiary "नहीं कर पाएँगे" below the primary CTA (user asked for it out of the overflow menu for this state specifically — fastest escape on empty state)
- All other states → triple-dot overflow menu → `नहीं कर पाएँगे`
- Never Destructive (exit reverts task to queue = reversible)

---

## Vocabulary rules (apply everywhere)

| Before | After | Why |
|---|---|---|
| ग्राहक | कनेक्शन | Domain term — a subscribing household is a "connection" in Wiom |
| सेटअप submit हुआ | सेटअप सबमिट हुआ | Devanagari transliteration preferred over Latin word |
| वेरीफाई | वेरिफाई | Short `ि` matra (long `ी` creates visible gap in "verify") |
| काम कर रहा है | काम कर रहे हैं | Respectful plural for executors |
| जवाब बाकी (as secondary line) | state-specific line | जवाब बाकी means "awaiting reply" — wrong for IN_PROGRESS |
| अभी जवाब बाकी है | समय चुनना बाकी है | AWAITING_SLOT_PROPOSAL needs action cue, not status |
| अनुसूची इतिहास | कनेक्शन का स्टेटस | Sanskritization rejected |
| व्यक्ति चुनें | टेक्निशियन चुनें | Role-specific, matches field language |

Full vocabulary list in [`/ux-copy/vocab-swaps.md`](../ux-copy/vocab-swaps.md).

---

## How to read a per-state doc

Each state file is organised as:

1. **Scenario** — when does the state fire, what does the CSP see
2. **Banner** — title / subtitle / icon / bg color
3. **Deadline pill** — copy in the deadline pill on the card
4. **Timeline** — events shown in the drilldown timeline
5. **Section visibility** — slots, executor, location
6. **CTAs** — primary / tertiary / overflow
7. **Rationale** — why this copy / structure
8. **Source refs** — file paths and line numbers
