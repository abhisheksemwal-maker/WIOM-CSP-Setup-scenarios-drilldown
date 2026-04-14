# AI Spec — How to continue this work in a future Claude Code session

This file is written *for an AI coding agent* that picks up this repo in a future session. If you are a human reader, [`human-spec.md`](human-spec.md) is probably what you want.

---

## What you are working on

You are continuing the Pratibimb design-mode redesign of the Wiom CSP (Customer Setup Partner) Android app. Specifically, you are polishing the **install drilldown** across 13 lifecycle states in a parallel `redesign` product flavor that installs side-by-side with the baseline `staging` APK.

Source repo: **`ashishagrawal-iam/wiom-csp-app-apr09`** (branch `release-01-Design`).
Docs repo (this one): **`abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown`**.

All 13 install states are at v1.0 as of 2026-04-14. The remaining work is:
1. Device screenshot verification for INS-1050 / INS-1053 differentiation
2. Resolving the "rajesh has a space" loose end (unreproduced)
3. Migrating the 13 inline Unicode-escape banner strings to the JSON bundle system
4. Picking up whichever surface the user points at next (wallet, assurance strip, drawer, etc.)

---

## Activation

When the user says **"pratibimb"**, **"load pratibimb"**, or **`/pratibimb`**, enter design-critic mode:
- Load UX Designer + UI Designer skill files
- Load the Wiom project context from the user's CLAUDE.md
- Respond: *"Pratibimb loaded. Design skills active."*
- Apply direct design feedback, first-principles critique, no softening

When the user says **"pratibimb, add principle: [X]"**, append the principle to the relevant skill file under `~/.claude/skills/ux-designer/SKILL.md` or `ui-designer/SKILL.md`.

---

## Rules you MUST follow

### 1. Don't improvise new UI
Skills describe *available* patterns, not mandates to apply everywhere they could fit. If you find yourself adding a UI element because "the skill supports this pattern", **stop**. Past incident: an Acknowledge checkbox was added to SlotProposalSheet based on wiom-cta §2 pattern extrapolation. The user caught it: "where did you get that information?" → removed.

Rule: **if adding new UI, it must trace to spec / product / research — not "the skill lists this pattern".**

### 2. Reversibility test for Destructive CTA
Destructive (red, irreversible affordance) is **only** for actions the user cannot undo. Before marking anything Destructive, ask:
> If the user taps this by mistake, can they get back to the previous state in one more step?

If yes → Secondary or Tertiary in neutral colors.
Past incident: exit-install was marked Destructive with a red icon. User corrected — exit reverts to queue (reversible) → neutral Tertiary, no icon.

### 3. No screenshots for inspection (context budget)
Screenshots burn image tokens. Default to:
- Compose source reading for structure questions
- `adb exec-out uiautomator dump /dev/tty` + grep for text / state questions

Use `take_screenshot` only as a last resort for visual-only questions where nothing else works.

### 4. Audit from device first
Source code may not match the APK if someone forgot to rebuild. Always verify findings on the device before reporting them:
```bash
adb install -r app/build/outputs/apk/redesign/debug/app-redesign-debug.apk
adb shell am force-stop com.wiom.csp.redesign
adb shell monkey -p com.wiom.csp.redesign -c android.intent.category.LAUNCHER 1
adb exec-out uiautomator dump /dev/tty > /tmp/ui.xml
grep -o 'text="[^"]*"' /tmp/ui.xml
```

### 5. Mr UX gate before any build
Run a screen-by-screen UX evaluation (goal, expectation, delivery, friction, copy) before building an APK. Documented in `feedback_mr_ux_gate.md` in the user's memory.

### 6. Cross-bundle label collisions are silent bugs
`WiomLabels.init()` flat-merges all `*_hi_en.json` files alphabetically. Same key in two bundles = silent last-writer-wins. Known collisions are documented in [`/data/collision-map.md`](../data/collision-map.md).

**Before editing any label key, grep every `*_hi_en.json` file for that key first.** If the key exists in more than one bundle, either align the values or rename one side with a module prefix (`install.*`, `restore.*`).

### 7. Absolute dates in memory
When saving a memory, convert relative dates in the user message to absolute (`Thursday` → `2026-03-05`). Memories decay fast without this.

---

## Protocol for per-state polish

The rhythm the user expects:

1. **Source-reconstruct** the current state (read `InstallStateBanner.kt` + `MockTaskRepository.kt` + the relevant screen file)
2. **Propose changes** in chat before editing
3. **Execute** via Edit tool
4. **Verify** via build + install + uiautomator dump (no screenshots)
5. **Confirm with user** before marking the state polished

Skip step 4 only when the user explicitly says so.

---

## Common gotchas

| Gotcha | Symptom | Fix |
|---|---|---|
| Stale APK on device | Copy doesn't match source | `force-stop` before relaunching; check you built `:redesign` not `:staging` |
| `[cta.xxx]` rendered literally | Missing label key | Add key to the relevant `*_hi_en.json` bundle |
| Slot section shows old slots | Callback chain dropped slot data | Check all 4 files: `AppNavGraph`, `TaskDrilldownScreen`, `HomeScreen.ActionSheetRouter`, `HomeViewModel` |
| Two install states look identical | Missing branch in `InstallStateBanner.bannerVariantFor()` | Add the when-branch |
| Routing bug — wrong sheet opens | Missing branch in `TaskDrilldownScreen.onPrimaryCtaClick` when-block | Add the state to the routing |
| State auto-progresses without user action | Hidden `delay + morphCard` in `HomeViewModel` | Remove the auto-morph; state should only move on user action |
| Label collision silent drift | Two bundles define same key | Align values, or rename one side with module prefix |

---

## File map (most-touched files this session)

| File | Role |
|---|---|
| `feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/InstallStateBanner.kt` | Per-state banner copy via `bannerVariantFor()` |
| `core/data/src/main/java/com/wiom/csp/core/data/repository/MockTaskRepository.kt` | 13 install seeds + restore + netbox seeds + `buildTaskFeed()` filter |
| `feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/InstallDrilldownContent.kt` | `InstallDrilldownRedesigned` branch, slot/executor visibility rules |
| `feature/home/src/main/java/com/wiom/csp/feature/home/ui/TaskDrilldownScreen.kt` | CTA routing, overflow menu, sheet dispatch |
| `feature/home/src/main/java/com/wiom/csp/feature/home/viewmodel/HomeViewModel.kt` | `onSlotSubmitted` with full slot data threading |
| `core/common/src/main/java/com/wiom/csp/core/common/theme/WiomTokens.kt` | DS token forks (getter-based `WiomDsMode.isRedesign` branches) |
| `core/common/src/main/java/com/wiom/csp/core/common/composables/WiomButton.kt` | Polymorphic CTA |
| `core/common/src/main/java/com/wiom/csp/core/common/composables/WiomCtaBar.kt` | Flat bottom container |
| `app/src/main/assets/*_hi_en.json` | Label bundles (WiomLabels flat-merge) |

---

## What to do first when you sit down

1. Read the user's CLAUDE.md (Wiom project context)
2. Read `MEMORY.md` and any `feedback_*.md` files referenced
3. Offer to continue the last session (per user preference)
4. Run `git log -5 --oneline` in the source repo to see what's recent
5. Check `gh pr list` for open PRs targeting `release-01-Design`
6. Wait for the user's direction before making changes

---

## What to do last before ending a session

1. Save a session summary to `MEMORY.md` (what changed, why, what's pending)
2. Add any new rules the user gave you to the appropriate `feedback_*.md` file
3. Update this repo (or at least a memory file) with outstanding loose ends
4. Don't commit or push without explicit user permission

---

## Resume prompt (copy this to start a new session)

See `/RESUME.md` at the root of this repo — has the exact prompt to paste.
