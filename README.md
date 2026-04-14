# Wiom CSP — Install Drilldown Scenarios & Deployment Context

This repository is the single source of truth for the Wiom CSP Android app's install-task drilldown redesign. It holds everything needed for a human reviewer or an AI coding agent to understand the state machine, rebuild the APK from source, and continue the per-state polish.

It was created at the end of a multi-session Pratibimb design-mode pass that redesigned all 13 install lifecycle states in a parallel `redesign` product flavor.

---

## Audience

| Reader | Start here |
|---|---|
| Engineering manager / reviewer | [`specs/human-spec.md`](specs/human-spec.md) |
| Designer / copywriter | [`ux-copy/changelog.md`](ux-copy/changelog.md), [`drilldowns/`](drilldowns/) |
| Android developer | [`build/README.md`](build/README.md), [`design-system/tokens.md`](design-system/tokens.md) |
| Future AI coding agent | [`specs/ai-spec.md`](specs/ai-spec.md) |

---

## Map of the repo

```
/build/                Kotlin native APK build guide
  └── README.md        SDK, flavors, staging vs redesign, gradle commands, verify recipe

/drilldowns/           One MD per install state + restore + netbox
  ├── README.md        State overview + card status table
  ├── INS-1041.md      AWAITING_SLOT_PROPOSAL
  ├── INS-1042.md      AWAITING_CUSTOMER_SELECTION
  ├── INS-1043.md      SLOT_CONFIRMED
  ├── INS-1044.md      IN_PROGRESS (self)
  ├── INS-1045.md      DELEGATED_OVERDUE
  ├── INS-1046.md      COMPLETED (net chalu hai)
  ├── INS-1047.md      INSTALL_DUE_SOON
  ├── INS-1048.md      NEEDS_RESCHEDULING
  ├── INS-1049.md      SCHEDULING_FAILED (hidden from CSP feed)
  ├── INS-1050.md      INSTALL_SUBMITTED
  ├── INS-1051.md      DELEGATED_NOT_STARTED
  ├── INS-1052.md      DELEGATED_IN_PROGRESS
  ├── INS-1053.md      VERIFICATION_PENDING
  ├── RST-2087.md      Restore task seed
  └── NBX-301.md       NetBox task seed

/design-system/        DS tokens, typography, component layer
  ├── tokens.md        Color + spacing + radius + elevation values
  ├── typography.md    Noto Sans + Noto Sans Devanagari rules
  └── components.md    WiomButton / WiomBadge / WiomNavRow / WiomCtaBar / InstallStateBanner

/ux-copy/              Copy changelog + anchors
  ├── changelog.md     Before → after per state, with reason
  ├── hindi-anchors.md Converged vocab (Devanagari submit/verify, plurals, oblique case)
  └── vocab-swaps.md   ग्राहक → कनेक्शन, सेटअप → (context-specific native alts), etc.

/specs/
  ├── human-spec.md    Manager-reviewable rationale + 8-PR merge plan
  └── ai-spec.md       Future-session protocol (Pratibimb, no-screenshots, no-improvisation)

/data/
  ├── mock-seeds.md    MockTaskRepository structure + all 15 seed tasks
  ├── label-bundles.md WiomLabels merge order + cross-bundle collision anti-pattern
  └── collision-map.md Known label key collisions and resolutions

/assets/               Screenshots, exports, or diagrams (optional)
```

---

## Project model in one paragraph

The Wiom CSP (Customer Setup Partner) app is an Android Jetpack Compose app that manages install, restore, and NetBox-return tasks for field partners. An install task moves through 13 states. Each state has a drilldown surface that the CSP opens from the home feed. The drilldown shows a banner (state-aware title + subtitle), optional timeline, slots section, executor section, and a sticky CTA bar at the bottom. This repository captures the redesigned version of those 13 drilldowns — built as a parallel `redesign` product flavor that installs side-by-side with the staging build so the manager can A/B them on the same device.

---

## Where the source lives

The Android source code lives in a separate repository: **`ashishagrawal-iam/wiom-csp-app-apr09`** (branch `release-01-Design`). This repo here is documentation and specs only. The [`build/README.md`](build/README.md) explains how to check out the source repo and produce the `.apk`.

---

## Last updated

2026-04-14 (end of Pratibimb session that completed all 13 install state drilldown polish).
