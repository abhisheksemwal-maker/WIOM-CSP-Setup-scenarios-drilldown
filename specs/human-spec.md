# Human Spec — Reviewer's Guide

This file is for an engineering manager, designer, or product reviewer who needs to understand what the Pratibimb session changed and why, without reading Kotlin.

---

## What is this?

A parallel **`redesign`** product flavor of the Wiom CSP Android app, built alongside the existing staging build. Both APKs install side-by-side on the same device (different `applicationId` suffixes), so you can A/B them without losing the baseline.

The redesign focuses on **one surface only**: the install drilldown, across all 13 states in the install lifecycle state machine. Other surfaces (wallet, assurance strip, drawer, NetBox, restore) are untouched in this flavor.

---

## Why a parallel flavor, not a branch diff?

1. **A/B on device** — the manager reviews both builds on the same phone
2. **No merge risk** — staging code paths are unchanged at runtime via the `WiomDsMode.isRedesign` flag
3. **Cheap rollback** — if any state regresses, flip the flag back to false and ship staging
4. **Design velocity** — redesign changes don't block staging releases

---

## The 8-PR merge plan

If and when the manager decides to land the redesign into `release-01-Design`, the changes are split into 8 reviewable PRs. Each PR is independently reviewable and leaves the app working.

| PR | Scope | Files touched (approx) |
|---|---|---|
| 1 | **Product flavor setup** — `redesign` flavor, `applicationIdSuffix`, `WiomDsMode.isRedesign` flag, `WiomCspApplication.onCreate()` wiring | `app/build.gradle.kts`, `WiomCspApplication.kt`, `WiomDsMode.kt` |
| 2 | **DS token forks** — getter-based branches in `WiomTokens.kt` for colors, typography, spacing, radius | `core/common/.../WiomTokens.kt` |
| 3 | **New component layer** — `WiomButton`, `WiomBadge*`, `WiomNavRow`, `WiomCtaBar` | `core/common/.../composables/` |
| 4 | **`InstallStateBanner` + 13 state variants** | `feature/home/.../drilldowns/install/InstallStateBanner.kt` |
| 5 | **`InstallDrilldownRedesigned`** — sticky CTA bar, per-state section visibility, slot filter rule, state-aware executor header | `InstallDrilldownContent.kt`, `TaskDrilldownScreen.kt` |
| 6 | **Callback threading + routing bugs** — `onSlotSubmitted` slot data, `DELEGATED_OVERDUE` routing | `AppNavGraph.kt`, `HomeScreen.kt`, `HomeViewModel.kt` |
| 7 | **Label bundle fixes** — cross-bundle collisions aligned, `cta.start_installation` added, vocabulary swaps applied | `app/src/main/assets/*_hi_en.json` |
| 8 | **Mock seed + debug panel** — 13 install seeds + `HomeDebugConfig.taskCount` raised 3→10, `SCHEDULING_FAILED` feed filter | `MockTaskRepository.kt`, `DebugConfigs.kt` |

**Alternative:** a single PR containing everything, if the manager prefers one review pass over multiple. Trade-off: easier to land but harder to bisect regressions.

---

## What to review on the device

### 1. Install side-by-side
```bash
./gradlew :app:assembleStagingDebug :app:assembleRedesignDebug
adb install -r app/build/outputs/apk/staging/debug/app-staging-debug.apk
adb install -r app/build/outputs/apk/redesign/debug/app-redesign-debug.apk
```

Both icons will appear on the launcher. Switch between them to A/B.

### 2. Walk the 13 install states
The redesign flavor's home feed surfaces 13 install task seeds (INS-1041 through INS-1053 minus 1049 which is filter-hidden; INS-1049 is only reachable via deep link). Tap each card to open the drilldown.

Per-state review rubric (from [`/drilldowns/`](../drilldowns/)):
- Banner title + subtitle match the spec?
- Deadline pill text + styling?
- Slot section filter applied (confirmed-only when confirmed)?
- Executor section hidden for the 3 pre-executor states?
- Primary + overflow CTAs correct?
- Exit-install flow from the triple-dot menu (not Destructive)?

### 3. Flow-test the rescheduling bug fix (INS-1048)
1. Open INS-1048 NEEDS_RESCHEDULING
2. Tap `स्लॉट प्रस्तावित करें`
3. Submit two new slots
4. Drilldown refreshes — slot section should now show the **new** slots, not the old EXPIRED siblings

Regression test for the callback-chain slot-data bug fixed this session.

### 4. Flow-test the executor routing fix (INS-1045)
1. Open INS-1045 DELEGATED_OVERDUE
2. Tap `टेक्निशियन बदलें`
3. The **executor assignment sheet** should open, not the slot sheet

Regression test for the `when(state)` routing fix.

---

## What's deliberately NOT in scope

- Wallet redesign (deferred)
- Assurance strip redesign (deferred — flagged as next target)
- Drawer redesign (deferred)
- NetBox task drilldown redesign (deferred)
- Restore task drilldown redesign (flagged — `reason.customer_denied` is the most important Wiom voice moment and deserves its own pass)
- Notification copy (`notif.*` keys are FCM server-owned, backend ticket needed)
- Actual engineering work on integration with the real backend (mock data only)

---

## Loose ends the reviewer should know about

1. **INS-1051 "rajesh has a space"** — user flagged a spelling/spacing issue I couldn't reproduce. Needs clarification on which screen position.
2. **INS-1053 device verification** — final copy was source-confirmed but not dumped on-device after the last edit.
3. **13 banner strings inlined as Unicode escapes** — not controllable from the copy review dashboard. Migrating to JSON bundles is recommended if copy review wants ownership.
4. **Copy dashboard findings** — 8 architectural / DA findings from the earlier copy review session still need filing; 8 open product questions still need answers.
5. **8-PR merge plan has zero commits against it so far** — the redesign work lives as uncommitted changes in the working tree until the manager signs off.

---

## How to decide if you want to land this

**Land it if:**
- You want to reduce the "what does this state mean?" confusion across the CSP field team
- Tier-2/3 Hindi voice quality matters more than this month's sprint velocity
- You accept that 7 of 13 states aren't yet visually screenshot-verified (code is correct, device rendering not yet confirmed)

**Defer it if:**
- You're in a merge freeze (mobile release cut)
- Backend changes to the install state machine are imminent (this redesign would need rework)
- You want a larger copy review pass across wallet + strip + drawer before landing install

---

## Who worked on this

- **Designer / product lead:** Abhishek Semwal (Product/Design, Wiom)
- **Source owner:** Ashish Agrawal (Engineering Manager)
- **Pratibimb mode operator:** Claude Opus 4.6 (1M context) via Claude Code CLI
