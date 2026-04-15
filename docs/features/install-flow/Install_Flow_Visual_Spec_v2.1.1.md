# Install Flow Visual Spec v2.1.1 (as built)

**Status:** SHIPPED — as-built, self-contained.
**Supersedes:** v2.1 DRAFT (which remains in the repo for historical context only). v2.1.1 is the sole authoritative spec for the 31-screen NetBox setup wizard.
**Target:** Released on `wiom-tech/wiom-csp-app-apr09@release-01` via PR #41 on 2026-04-16.
**Authoring convention:** Each surface is specced with Wiom DS tokens (`WiomColors` / `WiomTypography` / `WiomSpacing`) and labelled with inline Hindi-first copy via `WiomLabels.pick("<hi>", "<en>")`. Hindi is primary; English is the secondary surface via the app-level language toggle.

## Reading this spec

This document is self-contained. Every surface, component, token, label, navigation rule, and design decision needed to understand or re-implement the NetBox setup wizard is captured inline. No external specs are required. If you are onboarding to the install flow or reviewing a PR touching any wizard screen, this one file tells you everything — there is no "see the DRAFT" or "see v2.0" anywhere that you have to chase.

---

## 0. Overview

### 0.1 Purpose

The installation flow is a sequential, single-session Android wizard run by the CSP (or their field technician) at the customer's home while physically installing the fibre device (NetBox / ONT). The wizard is a **31-screen Hindi-first flow** that replaces the pre-v2.1 release-01 12-screen flow, giving the field agent clearer pacing, explicit review beats after every photo, and a deliberate completion moment.

### 0.2 What the wizard does

1. **Hindi-first copy everywhere.** All titles, body, hints, and CTAs are Hindi by default. English is the secondary language, resolved at render time via `WiomLabels.pick(hi, en)`.
2. **31 surfaces + 3 overlays.** 31 `RedesignScreen` enum members, plus the Exit Confirm dialog, the WiFi Connect dialog, and the Customer Details sheet. Progress is tracked by position in the flow; there is **no top-bar step counter** (see §2.3).
3. **Wiom DS tokens everywhere.** All colors, typography and spacing come from `core/common/theme/WiomTokens.kt` (`WiomColors` / `WiomTypography` / `WiomSpacing` / `WiomRadius` / `WiomTextStyle`). The only residual tier-3 palette (keypad key bg, optical power info tints) lives in `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/theme/WizardColors.kt` as named constants — never raw hex inside screen files.
4. **`WizardTopBar`** — shared top bar on screens that have chrome. Renders title + nullable × close + "मदद" help link. **No step counter, no progress bar.**
5. **Capture + Review pattern** for every photo (selfie, Aadhaar front, Aadhaar back, NetBox, 3-pin, wiring). No photo is auto-submitted; agent always confirms on a review screen before any backend call fires.
6. **Check + Camera + Review triplet** for each placement photo (screens S17–S25). Each photo is preceded by a **side-by-side सही / गलत comparison-card** acknowledgement screen (see §2.4 and each surface section).
7. **Per-task resume state** persisted to `SharedPreferences("wiom_netbox_flow")` under `resume_screen_<taskId>` and `payg_accepted_<taskId>`. Re-entering a task via the Home drilldown lands the agent on the exact screen they last left, not the start (see §1.3).
8. **Back navigation enabled.** System back pops one screen, with a global `ExitDialog` guard for screens where destructive back is risky (§3.32 + S03 BackHandler invariant).
9. **Installation-submit morph** wired through to Home. Completing S32 Happy Code OTP morphs the install card state `SCHEDULED → INSTALL_SUBMITTED` in `HomeViewModel.onInstallSubmitted(taskId)` with `reasonTimerDisplay = "व्योम जाँच रहा है" / "Wiom is verifying"` and a toast. Re-tapping the same task opens the `INSTALL_SUBMITTED` drilldown banner instead of re-entering the wizard.

### 0.3 Entry point

Host (Home task drilldown) calls:
```kotlin
navController.navigate(installationRedesignGraphRoute(taskId, customerMobile, bookingPaid))
```
from the SCHEDULED install card CTA in `feature/home/ui/drilldowns/install/`. Graph route:
```
installation_redesign_graph/{taskId}/{customerMobile}/{bookingPaid}
```
Start destination: `RedesignScreen.Entry` (see §1.2) — a 1-frame redirector that reads the per-task resume target and jumps to either `s3` (fresh start) or the saved resume screen.

### 0.4 Exit points

| Trigger | Destination | Mechanism |
|---|---|---|
| × icon on any chrome screen → agent confirms exit in ExitDialog | Back to Home | `showExitDialog = true` → `ExitDialog` → `onExitConfirmed()` → host `onBack()` |
| × icon → agent cancels exit dialog (taps `नहीं`) | Stay on current surface | Dialog dismisses, state preserved |
| System back on S03 PayG | Open exit dialog | `BackHandler { onClose() }` — S03 has no × icon, system back is the only exit (§3.5) |
| System back on any other screen | One screen back via `goPrev()` | `BackHandler` inside each screen, resume-state persists |
| Payment required after Aadhaar Review | Payment screen outside install graph | Host `onPayment` lambda (when `bookingPaid == false`) |
| S32 Happy Code OTP complete (4-digit valid) | Back to Home + card morph | `onCodeComplete` → `onInstallationComplete(taskId)` → host invokes `HomeViewModel.onInstallSubmitted(taskId)` → morphs install card `SCHEDULED → INSTALL_SUBMITTED`, emits `toast.install_submitted`, pops graph |

---

## 1. Navigation graph

### 1.1 Route order (flowOrder)

The 31-screen flow is modeled as a `RedesignScreen` enum. `RedesignScreen.flowOrder` lists the 31 screens in forward order; `nextAfter(current)` returns the next screen or falls back to `"s3"`. The route strings are exactly the short keys `s3`, `s4`, `s4b`, `s5`, `s6`, `s8`, `s8c`, `s11`, `s12`, `s13`, `s14`, `s15`, `s16`, `s17`, `s18`, `s19`, `s20`, `s21`, `s22`, `s23`, `s24`, `s25`, `s26`, `s27`, `s28`, `s29`, `s30`, `s31`, `s32` — there is intentionally no `s01`, `s02`, `s07`, `s09`, `s10`, or `s33` in the enum (see §1.4 "Screens explicitly not in this flow").

```
Phase 1 · PayG + Transfer + Arrival
  s3     PayG Acknowledge            (graph start after Entry router)
  s4     Transfer Info
  s4b    Arrival Confirm             (dialog chain — see §3.5)

Phase 2 · Selfie
  s5     Selfie Capture
  s6     Selfie Review

Phase 3 · Aadhaar
  s8     Aadhaar Camera + Review FSM (single screen with 3-state review)

Phase 4 · PayG Info
  s8c    PayG System Info (audio)

Phase 5 · Payment + Power
  s12    Payment Checklist
  s13    Power-Up Timer
  s14    Switch-On Confirm
  s11    Customer Details

Phase 6 · ISP
  s15    ISP Recharge Audio
  s16    ISP Form (+ WiFi Connect dialog)

Phase 7 · Placement + Photos
  s17    Placement Check  (side-by-side सही/गलत cards)
  s18    NetBox Camera
  s19    NetBox Photo Review
  s20    3-Pin Check      (side-by-side सही/गलत cards)
  s21    3-Pin Camera
  s22    3-Pin Photo Review
  s23    Wiring Check     (side-by-side सही/गलत cards)
  s24    Wiring Camera
  s25    Wiring Photo Review

Phase 8 · Provisioning + Complete
  s26    Provisioning Loading
  s27    Provisioning Success
  s28    Optical Power
  s29    Speed Test
  s30    Recharge Info Audio
  s31    Happy Code Prompt
  s32    Happy Code OTP   (last visible screen; triggers onInstallSubmitted morph)
```

**Important:** the decimal labels above are the human-facing phase groupings, not the route keys. The route keys are the literal strings `s3..s32` (plus `s4b`, `s8c`) used inside `RedesignScreen.flowOrder`. They are not monotonic (`s12` appears before `s13` in the enum but is reached **after** `s13` chronologically in Phase 5 because Phase 5 orders Payment Checklist → Power-Up → Switch-On → Customer Details; the enum ordering is historical from the reference repo port). `flowOrder` is the canonical source of next/prev sequencing — never assume from the numeric suffix.

### 1.2 Graph entry router — `RedesignScreen.Entry`

A new `RedesignScreen.Entry` composable (route literal `"entry"`) is the graph's actual start destination. It is **not a user-facing screen** — it is a 1-frame redirector that:

1. Reads the per-task resume target from `FlowViewModel` (see §1.3).
2. Navigates to either `s3` (if `resume_screen_<taskId>` is unset) or the saved resume screen (if set).
3. Pops itself out of the back stack so system back never returns to Entry.

Code sketch (the as-built composable in `navigation/RedesignNavGraph.kt`):
```kotlin
composable("entry") { backStackEntry ->
  val vm = rememberWizardVm(backStackEntry)
  LaunchedEffect(Unit) {
    val resume = vm.resumeScreenOrNull() ?: "s3"
    navController.navigate(resume) {
      popUpTo("entry") { inclusive = true }
    }
  }
}
```

Entry exists because release-01 needs resume semantics across drilldown re-entry — re-tapping an in-progress install from Home must land the agent on the last screen they left, not force them to re-enter 20 screens to get back to where they were.

### 1.3 State management — per-task resume via `FlowViewModel`

`FlowViewModel` is graph-scoped (one instance shared across all 31 composables inside the graph) via:
```kotlin
val parentEntry = remember(backStackEntry) { navController.getBackStackEntry("installation_redesign_graph/{taskId}/{customerMobile}/{bookingPaid}") }
val vm: FlowViewModel = viewModel(viewModelStoreOwner = parentEntry)
```

`FlowViewModel.init(context: Context, taskId: String)` re-keys the VM whenever the active taskId changes. Resume state is **keyed per task**:

```
SharedPreferences("wiom_netbox_flow"):
  resume_screen_<taskId>     → "s16", "s22", etc.  (last route navigated within that task's run)
  payg_accepted_<taskId>     → true | false         (set once S03 checkbox is ticked)
```

On every screen navigation, `onNavigate(routeId)` is called from a `LaunchedEffect(route)` inside `rememberWizardVm()`, which persists the current screen to `resume_screen_<taskId>`. Every `composable(route)` block threads `backStackEntry` into `rememberWizardVm` via:

```kotlin
composable("s16") { backStackEntry ->
  val vm = rememberWizardVm(backStackEntry)
  LaunchedEffect("s16") { vm.onNavigate("s16") }
  S16IspFormScreen(...)
}
```

**Why per-task scoping:** if two installs are queued, finishing install A must not pre-seed install B's resume to the wrong step. Per-task keys eliminate cross-contamination.

**Debug bucket:** the debug wizard control panel uses `taskId = "debug"` as its own bucket. Debug navigation never leaks into real tasks.

**Reset affordance:** `NetboxWizardControlPanelScreen` (accessible from `HomeDebugScreen` via the 🐛 button) includes a "🗑 Reset wizard state" button that calls `prefs.edit().clear()`, wiping all `resume_screen_*` and `payg_accepted_*` entries across every task bucket.

**Hindi/English copy:** every user-visible wizard string (roughly 124 strings across 23 files) goes through `WiomLabels.pick("<hindi>", "<english>")`. There is **no keyed JSON lookup** for wizard strings — they are inline at the call site. The pick() helper flips to English when `WiomLabels.currentLang == "en"` and falls back to Hindi when `en` is empty, so the wizard respects the app-level language toggle set in `feature/settings`. The **one** exception is the completion toast on `HomeViewModel.onInstallSubmitted()` which uses keyed labels (see §6).

### 1.4 Screens explicitly not in this flow

Three screens from the upstream reference repo were deliberately removed during the port and are not part of the `RedesignScreen` enum:

- **`s01` TaskList.** The reference repo was a standalone demo app that rendered its own task list; release-01's Home screen + chip strip + task drilldown sheet IS the task list + detail. Keeping `s01` would show the same install task twice. Removed.
- **`s02` TaskDetail.** Same reasoning — the install drilldown sheet rendered by `feature/home/ui/drilldowns/install/` IS the task detail. Removed.
- **`s33` Lottery.** Out of scope for the CSP channel. The reference repo used it as a gamification moment for a B2C prototype; in CSP the wizard hands off cleanly to the `INSTALL_SUBMITTED` drilldown state via the onInstallSubmitted morph (§0.4), which does the celebration job via the drilldown banner. Removed.

Consequence: `flowOrder` starts at `s3`, not `s1`. `nextAfter()` fallback returns `"s3"` not `"s1"`. `InstallationCompleteScreen` is not a surface — S32 Happy Code OTP is the last visible screen before the host pops back to Home.

### 1.5 Back-stack behaviour

Each composable is its own NavGraph destination — unlike the upstream reference which drove the flow from a single composable with an in-memory `currentStep` enum. Per-screen destinations let release-01 preserve its usual `BackHandler` + `popBackStack` contract, and let each screen manage its own lifecycle (CameraX use-case, MediaPlayer release, LaunchedEffect scope) cleanly.

Forward navigation uses `navController.navigate(next)` where `next = RedesignScreen.nextAfter(currentRoute)`. Backward navigation is a plain `navController.popBackStack()`. There is no custom state-driven host; the navigation graph IS the state.

Exit (agent taps × → confirms in ExitDialog) uses `navController.popBackStack("installation_redesign_graph/...", inclusive = true)` and the host `onBack()` lambda to return to Home.

---

## 2. Design system

### 2.1 Color palette — `WiomColors` (canonical)

All wizard colors come from `core/common/theme/WiomTokens.kt`. The wizard uses the following subset; named constants only, no raw hex inside screen files.

| Token | Hex | Role |
|---|---|---|
| `WiomColors.brandPrimary` | `#D9008D` | Primary CTA background, active input borders, brand accent |
| `WiomColors.brandPrimaryLight` | `#FFE5F6` | Pressed / hover CTA background |
| `WiomColors.brandPrimarySecondary` | `#FFCCED` | Brand secondary (reserved) |
| `WiomColors.brandSecondary` | `#443152` | Dark purple header band behind Selfie / Aadhaar title bands + Happy Code keypad container |
| `WiomColors.brandSecondaryLight` | `#60506C` | Header band secondary |
| `WiomColors.bgPrimary` | `#FAF9FC` | Wizard page background (off-white lavender) |
| `WiomColors.bgSecondary` | `#F1EDF7` | Lavender surface — progress-bar track, photo placeholder bg, Aadhaar download circle button, ExitDialog secondary CTA bg |
| `WiomColors.surfaceCard` | `#FFFFFF` | Card background (SetupCard, WifiConnectDialog, ExitDialog container) |
| `WiomColors.borderDefault` | `#E8E4F0` | Default 1.dp card border |
| `WiomColors.borderFocus` | `#352D42` | Focused input border + top-bar close × glyph color |
| `WiomColors.textPrimary` | `#161021` | Primary body text, screen titles, Aadhaar download glyph |
| `WiomColors.textSecondary` | `#665E75` | Subtitle, hint, secondary label |
| `WiomColors.textHint` | `#A7A1B2` | Placeholder, disabled glyph |
| `WiomColors.success` | `#008043` | Success state (validated field ticks, checklist DONE icon, success moment text) |
| `WiomColors.successBg` | `#C9F0DD` | Success state background (SuccessGreenBg) |
| `WiomColors.error` | `#D92130` | Error state (validation error, destructive warning) |
| `WiomColors.errorBg` | `#FFF0F0` | Error state background (Optical Power OOR circle) |
| `WiomColors.warning` | `#FF8000` | Warning chip, 3-pin warning border |
| `WiomColors.warningText` | `#B85C00` | Warning chip text |
| `WiomColors.warningBg` | `#FFE6CC` | Warning chip background |
| `WiomColors.info` | `#6D17CE` | Info purple state |
| `WiomColors.infoBg` | `#F1E5FF` | Info state background (PayG speaker illustration circle) |
| `WiomColors.ctaDisabled` | `#A7A1B2` | Primary CTA disabled background |
| `WiomColors.ispPrefillBg` | `#E1FAED` | ISP form pre-filled field background |
| `WiomColors.ispPrefillBorder` | `#A5E5C6` | ISP form pre-filled field border |
| `WiomColors.gold` | `#FFD888` | Celebration accent (reserved — not used in v2.1.1 since Lottery is removed) |

The residual tier-3 palette constants (Happy Code keypad backspace bg `#FFD3CC` / icon `#E01E00`, Happy Code hint pill bg `#F9DFEE`) live in `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/theme/WizardColors.kt` as named constants:

```kotlin
object WizardColors {
  val KeypadBackspaceBg = Color(0xFFFFD3CC)
  val KeypadBackspaceIcon = Color(0xFFE01E00)
  val HappyCodeHintBg = Color(0xFFF9DFEE)
}
```

These are not part of `WiomColors` because they are install-wizard-specific tints that don't need to be reused elsewhere in the app.

### 2.2 Typography

All wizard text uses `WiomTypography` styles (from `core/common/theme/WiomTokens.kt`) with explicit sizes/weights specified inline where the DS doesn't cover a specific case (e.g. 64sp timer display, 100sp celebratory emoji).

| Role | Size | Weight | Line height | Color token | Used on |
|---|---|---|---|---|---|
| Screen title (24sp) | 24.sp | Bold | 32.sp | `textPrimary` | PayG title, Switch-On title, Happy Code Prompt title, Exit Dialog title, most main screen titles |
| Screen title (20sp small) | 20.sp | Bold | 28.sp | `textPrimary` or `bgPrimary` (on HeaderPurple band) | Aadhaar Camera title, Camera screen headers, 3-pin dialog title, Payment Checklist title |
| Section label | 16.sp | SemiBold | — | `textSecondary` | "आधार कार्ड" section header, ISP form labels |
| Customer name (TransferInfo) | 18.sp | Bold | — | `textPrimary` | S04, S11 customer name rows |
| Body | 16.sp | Normal | 24.sp | `textSecondary` (default) or `textPrimary` | Subtitles, body paragraphs, Optical Power messages |
| Small body | 14.sp / 13.sp | Normal | 18–20.sp | `textSecondary` | Address rows, helper text |
| CTA label (Primary / Secondary / Tertiary) | 16.sp | Bold | — | `bgPrimary` on Primary, `brandPrimary` on Secondary/Tertiary | `WiomButton` |
| Hint pill | 12.sp | SemiBold | — | `brandPrimary` | Happy Code OTP hint |
| Thumbnail label | 12.sp | SemiBold | — | `textSecondary` | Aadhaar Review thumbnail captions |
| Timer display | 64.sp | Bold | — | `textPrimary` | Power-Up Timer countdown |
| Optical Power value | 32.sp | Bold | — | `textPrimary` (checking), `success` (in-range), `error` (OOR) | §3.26 Optical Power |
| Speed Test number | 48.sp | Bold | — | `success` (if ≥80) or `textPrimary` | §3.27 Speed Test |
| Celebratory headline (retained for success moments) | 24.sp | Bold | — | `textPrimary` | §3.27 Provisioning Success |

Font family is picked automatically per-glyph script: `Noto Sans` for Latin text, `Noto Sans Devanagari` for Devanagari text. The wizard composables do not need to worry about this — `WiomTextStyle` already handles the font-family selection via text-style presets.

### 2.3 Shared components

#### `WizardTopBar` — persistent top bar

File: `feature/installation/.../redesign/components/WizardTopBar.kt`

Parameters:
```kotlin
@Composable
fun WizardTopBar(
  title: String,
  onClose: (() -> Unit)?,   // null on S03 PayG (BackHandler invariant, §3.5)
  showHelp: Boolean = true, // "मदद" link on the right — currently a visual affordance only
  modifier: Modifier = Modifier
)
```

**There is no `currentStep`, `totalSteps` or `progress` parameter on `WizardTopBar`.** The v2.1 DRAFT step counter (`"चरण N / 8"`) is **not rendered** — the grouping was aspirational and didn't map cleanly to the 31 surfaces, and the CSP doesn't think in terms of numbered steps, they think in terms of "what's the next thing to do". Title + × + help link is sufficient chrome.

Layout:
- Container: `Row(fillMaxWidth, background = WiomColors.bgPrimary).statusBarsPadding()`
- Close `×` (if `onClose != null`): 48.dp clickable Box with centered `Text("✕", 20.sp, color = WiomColors.borderFocus)`
- Title: weight-1 centered `Text(title, style = WiomTextStyle.titleMedium, color = WiomColors.textPrimary)`
- Help link: `Box(padding = 12.dp)` with `Text("मदद", 14.sp, SemiBold, color = WiomColors.brandPrimary)` — currently no click handler wired; reserved for future WhatsApp / FAQ integration

**`statusBarsPadding()` invariant:** `WizardTopBar` applies `.statusBarsPadding()` internally. **Any screen that omits the top bar (S13 Power-Up Timer, S26 Provisioning Loading, S05 Selfie Camera full-bleed, S08 Aadhaar Camera sub-state, S18 / S21 / S24 PhotoCaptureScreen) must apply `.statusBarsPadding()` on the outer Column** so chrome does not collide with the Android system status bar. This is a hard rule, not a recommendation. See §2.8.

#### `WiomButton` — primary/secondary/tertiary CTA

File: `core/common/ui/WiomButton.kt`

```kotlin
enum class WiomButtonType { Primary, Secondary, Tertiary }

@Composable
fun WiomButton(
  type: WiomButtonType,
  label: String,
  onClick: () -> Unit,
  enabled: Boolean = true,
  modifier: Modifier = Modifier
)
```

- **Primary** — `brandPrimary` fill, `bgPrimary` label, 48.dp height, 16.dp corners, 16.sp Bold label. Used on all forward-advance CTAs.
- **Secondary** — transparent fill, 1.dp `brandPrimary` outline, `brandPrimary` label, 48.dp height, 16.dp corners, 16.sp SemiBold label. Used on "फिर से लें"-style alternate actions (S11 Save Aadhaar before the redesign moved it to an icon button — now largely unused in the wizard except for the Optical Power "ऑफिस कॉल करके मदद लें" escalation).
- **Tertiary** — transparent fill, no border, `brandPrimary` label, 48.dp minimum height, 16.sp SemiBold label. Used on **S15 ISP Recharge Audio** and **S30 Recharge Info Audio** for the "समझ गया" / "Got it" acknowledgement. This is the link-style CTA that the v2.1 DRAFT called "GhostButton" — it is now a concrete component (`WiomButton(type = Tertiary)`) wrapping Material 3 `TextButton` with Wiom brand colors. **There is no separate "GhostButton TODO"** — the Tertiary variant fulfils that role.

S08c PayG System Info does **not** use Tertiary — it uses Primary `आगे बढ़ें` (stronger acknowledgement semantics for the system-info beat after Aadhaar is captured).

#### `WizardCtaBar` — bottom CTA stack

File: `feature/installation/.../redesign/components/WizardCtaBar.kt`

A `Column` wrapper that:
- Applies `navigationBarsPadding()` to clear the Android nav bar
- Applies 16.dp horizontal padding
- Hosts 1–2 `WiomButton` children stacked vertically with 12.dp spacing

Used on every screen that has a bottom-anchored CTA. Not used on screens with no CTA (S13 Power-Up Timer, S26 Provisioning Loading, S29 Speed Test auto-advance, S32 auto-advance on 4th digit).

#### `PhotoCaptureScreen` — full-bleed CameraX capture surface

File: `feature/installation/.../redesign/camera/PhotoCaptureScreen.kt`

Used by: S05 Selfie Capture, S08 Aadhaar Camera (front + back), S18 NetBox Camera, S21 3-Pin Camera, S24 Wiring Camera.

Parameters:
```kotlin
@Composable
fun PhotoCaptureScreen(
  title: String,
  ctaLabel: String,
  overlay: CameraOverlay = CameraOverlay.None,
  onCaptured: (Uri) -> Unit,
  onBack: () -> Unit
)

sealed class CameraOverlay {
  object None : CameraOverlay()
  object AadhaarCard : CameraOverlay()        // dashed card-shaped cutout — §3.4
}
```

Layout (top-to-bottom):
1. Full-screen CameraX `PreviewView` as the bottommost layer.
2. `.statusBarsPadding()` wrapper around the inline ✕ button in the top-left — 36.dp circle, black @ 50% alpha, white ✕ glyph. Taps call `onBack()`.
3. Optional overlay (per `overlay` param):
   - **`None`** — no overlay. Used for Selfie, NetBox, 3-Pin, Wiring camera screens (full-bleed preview).
   - **`AadhaarCard`** — `drawWithContent + BlendMode.Clear` dashed card-shaped cutout over a `Color.Black @ 55% alpha` scrim. Cutout spec: `width = fillMaxWidth - 2 * 16.dp`, `height = 199.dp`, corners `16.dp`, dashed stroke `Color(0xB3FAF9FC)` at 2.dp with `dashPathEffect(floatArrayOf(10f, 10f))`. Gives the CSP a real "align card here" target matching the Aadhaar aspect ratio.
4. Bottom capture CTA — `WiomButton(type = Primary, label = ctaLabel)` inside a `WizardCtaBar` anchored to the bottom. Tapping triggers the CameraX `ImageCapture.takePicture()` use case; on success calls `onCaptured(uri)`.

Permissions: the screen checks `Manifest.permission.CAMERA` on entry. If not granted, a `rememberLauncherForActivityResult` flow requests it; on deny it falls back to a "Camera permission required" message with a Secondary "Open settings" CTA that launches `ACTION_APPLICATION_DETAILS_SETTINGS`.

Real CameraX wiring (no system camera intent). The previous v2.1 DRAFT contemplated `ActivityResultContracts.TakePicture()`; v2.1.1 uses CameraX `ImageCapture` use-case end-to-end so the overlay can be drawn directly on the preview surface.

#### `TimerAudioCheckScreen` — shared audio-briefing scaffold for S17/S20/S23

File: `feature/installation/.../redesign/components/TimerAudioCheckScreen.kt`

Used by: S17 Placement Check, S20 3-Pin Check, S23 Wiring Check. These three surfaces share a common scaffold:
1. Plays an audio briefing on entry
2. Shows a progress bar ticking down
3. After the audio completes, reveals a **side-by-side सही / गलत comparison cards row** (see §2.4) and a checkbox CTA
4. On checkbox tick, immediately advances to the corresponding Camera screen

Parameters:
```kotlin
@Composable
fun TimerAudioCheckScreen(
  title: String,                      // question-form title e.g. "नेट बॉक्स सही जगह लगाया है?"
  audioResId: Int,                    // R.raw.netbox_placement etc.
  correctImage: Int,                  // painter resource for the सही card
  incorrectImage: Int,                // painter resource for the गलत card
  checkboxLabel: String,              // statement-form "... सही से लगाया गया है"
  onChecked: () -> Unit,
  onBack: () -> Unit
)
```

Layout:
1. `WizardTopBar(title = title, onClose = { showExitDialog = true })`
2. Outer `Column(fillMaxSize, background = WiomColors.bgPrimary, padding = 16.dp)`
3. Title `Text(title, style = 24.sp Bold textPrimary, lineHeight = 32.sp)`
4. **Side-by-side comparison cards Row** — see §2.4 for the shared component spec.
5. Progress bar (4.dp tall, `bgSecondary` track, `brandPrimary` fill) below the cards, wrapped in `AnimatedVisibility(visible = !showCheckbox)` so it fades out once audio ends.
6. Checkbox revealed via `AnimatedVisibility(visible = showCheckbox)` after `audioDurationMs + bufferMs`: `Row` with a tick-box + `Text(checkboxLabel)`. Tap fires `onChecked()` immediately (no 450ms pacing delay).
7. `WizardCtaBar` containing a disabled `WiomButton(type = Primary, label = "आगे बढ़ें")` that enables once the checkbox is ticked — on v2.1.1 the checkbox IS the advance trigger; the CTA is a visual confirmation that fires `onChecked()` in the same 300ms window.

The MediaPlayer is created in a `DisposableEffect` keyed on `audioResId`, released on dispose. On config change the audio restarts from the beginning (acceptable — these audio clips are 2–12 seconds).

### 2.4 Side-by-side सही / गलत comparison cards (S17 / S20 / S23)

Replaces the single-illustration + checkbox pattern from the v2.1 DRAFT with **two side-by-side illustrated cards** — a correct example (सही) and an incorrect example (गलत).

Layout inside `TimerAudioCheckScreen` body:
```
Row(
  modifier = Modifier.fillMaxWidth(),
  horizontalArrangement = Arrangement.spacedBy(16.dp)
) {
  ComparisonCard(
    modifier = Modifier.weight(1f),
    image = correctImage,
    label = "सही",
    isCorrect = true
  )
  ComparisonCard(
    modifier = Modifier.weight(1f),
    image = incorrectImage,
    label = "गलत",
    isCorrect = false
  )
}
```

Each `ComparisonCard`:
- `Column(clip RoundedCornerShape(12.dp), border = 2.dp BorderStroke(...))` — `success` border for isCorrect=true, `error` border for isCorrect=false
- Illustration at top: `Image(painterResource(image), modifier = Modifier.fillMaxWidth().aspectRatio(1f))`
- Badge row at bottom: `Row(padding = 8.dp, verticalAlignment = CenterVertically)` containing:
  - A 20.dp circle (`success` / `error` bg) with white `✓` / `✕` glyph
  - `Spacer(6.dp)`
  - `Text(label = "सही" | "गलत", 14.sp SemiBold, color = success | error)`

**Rationale for the shift from single-illustration to side-by-side cards:** comprehension. The CSP sees the correct and incorrect examples simultaneously instead of having to infer from a single image. Confirmed during v2.0 UAT as the biggest gap in the reference repo's pattern.

Asset paths (drawables referenced):
- S17 Placement Check: `correctImage = R.drawable.placement_correct`, `incorrectImage = R.drawable.placement_incorrect`
- S20 3-Pin Check: `correctImage = R.drawable.threepin_correct`, `incorrectImage = R.drawable.threepin_incorrect`
- S23 Wiring Check: `correctImage = R.drawable.wiring_correct`, `incorrectImage = R.drawable.wiring_incorrect`

### 2.5 `ExitDialog` — component contract

File: `feature/installation/.../redesign/dialogs/ExitDialog.kt`

Triggered by: `showExitDialog = true` on any screen whose `WizardTopBar.onClose` was tapped, and by S03's `BackHandler { onClose() }` invariant (§3.5).

Implementation notes:
- Uses `androidx.compose.ui.window.Dialog(properties = DialogProperties(usePlatformDefaultWidth = false))`. The non-platform width lets the dialog card size itself correctly on tablets, and the `Dialog` wrapper (as opposed to a plain `Box` overlay) ensures taps cannot leak to the dimmed backdrop.
- Dim backdrop: `Color.Black @ 50% alpha` filling the screen behind the dialog.

Layout:
1. Outer `Box(fillMaxSize, background = Color.Black.copy(alpha = 0.5f), contentAlignment = Center)`
2. Dialog `Column(width = wrap, clip RoundedCornerShape(24.dp), background = WiomColors.surfaceCard, padding horizontal = 32.dp, vertical = 24.dp, horizontalAlignment = Center)`
3. **Warning circle** — `Box(size = 96.dp, clip CircleShape, background = WiomColors.warningBg, contentAlignment = Center)` containing `Text("⚠️", 48.sp)`
4. `Spacer(20.dp)`
5. **Title** — `Text(WiomLabels.pick("सेटअप पर काम जारी है!", "Setup is still in progress!"), 24.sp, Bold, WiomColors.textPrimary, textAlign = Center, lineHeight = 32.sp)`
6. `Spacer(8.dp)`
7. **Body** — `Text(WiomLabels.pick("क्या आप अभी भी इसे रोकना चाहते हैं?", "Do you still want to stop it?"), 16.sp, WiomColors.textSecondary, textAlign = Center)`
8. `Spacer(24.dp)`
9. **Primary CTA (STAY, safe action)** — `WiomButton(type = Primary, label = WiomLabels.pick("नहीं", "No"), onClick = onDismiss)`. `brandPrimary` fill, 48.dp, 16.dp corners. **Note the polarity:** Primary = stay, which is reversed from normal CTA semantics. Deliberate — we want the safe action on the strongest CTA.
10. `Spacer(12.dp)`
11. **Secondary CTA (EXIT, destructive)** — built inline:
```kotlin
Box(
  modifier = Modifier
    .fillMaxWidth()
    .height(48.dp)
    .clip(RoundedCornerShape(16.dp))
    .background(WiomColors.bgSecondary)
    .clickable { onExitConfirmed() },
  contentAlignment = Alignment.Center
) {
  Text(
    WiomLabels.pick("हाँ, सेटअप रोकें", "Yes, Stop Setup"),
    style = WiomTextStyle.labelLarge,
    color = WiomColors.textPrimary
  )
}
```
This is **NOT** `WiomButton(type = Secondary)` — which would render with a `brandPrimary` stroke that visually competes with the Primary "नहीं". The lavender-filled Box reads as a quieter, clearly secondary affordance.

**CTA polarity is reversed** (Primary = stay, Secondary = exit). Deliberate — two-tap intent (overflow menu → exit CTA → confirm) protects against accidental exits, and pairing the destructive action with a quieter visual weight signals "you probably don't want to do this" without blocking the agent who genuinely does.

---

## 3. Surfaces

### 3.1 S05 — Selfie Capture

**Purpose.** First proof-of-presence: agent takes a selfie wearing their Wiom Expert t-shirt. The screen's only job is to launch the camera and, on successful capture, advance to `S06 Selfie Review`. No backend call fires here — `closeStep(SELFIE)` fires from Review.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s4b `ArrivalConfirm` after both dialogs confirmed | s6 `SelfieReview` on successful capture |

**Layout.** Full-bleed `PhotoCaptureScreen` with:
- `title = "सेल्फी खींचें" / "Take Selfie"` (rendered in a small header band inside the screen, `WiomColors.brandSecondary` background, 20.sp Bold)
- Header subtitle: `"Wiom Expert की टी-शर्ट पहने हुए सेल्फी लें" / "Take a selfie wearing your Wiom Expert t-shirt"` — 14.sp, on HeaderPurple band
- `overlay = CameraOverlay.None`
- `ctaLabel = "सेल्फी लें" / "Take Selfie"` on the bottom Primary CTA

On capture success: `state.selfieUri = uri`, `navController.navigate("s6")`.

**BackHandler:** system back on S05 returns to `s4b` which re-shows the Arrival Confirm dialog chain. Exit path: inline ✕ in top-left → `ExitDialog`.

**`.statusBarsPadding()` invariant:** S05 is full-bleed; its inline ✕ wrapper uses `.statusBarsPadding()` so the close hit target doesn't land under the system clock.

**Labels (inline):**
- Title: `WiomLabels.pick("सेल्फी खींचें", "Take Selfie")`
- Subtitle: `WiomLabels.pick("Wiom Expert की टी-शर्ट पहने हुए सेल्फी लें", "Take a selfie wearing your Wiom Expert t-shirt")`
- CTA: `WiomLabels.pick("सेल्फी लें", "Take Selfie")`

---

### 3.2 S06 — Selfie Review

**Purpose.** Show the captured selfie at full size so the agent can confirm it's usable (face visible, correct person, wearing the t-shirt) before committing. On confirm, **this is where `closeStep(SELFIE)` fires** — the first backend call in the flow. On retake, the agent is sent back to `s5` with `selfieUri = null`.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s5 `SelfieCapture` after camera success | s8 `AadhaarCamera` after `closeStep(SELFIE)` success |
| — | s5 `SelfieCapture` via "फिर से लें" retake |

**Layout.**
1. `WizardTopBar(title = "सेल्फी" / "Selfie", onClose = { showExitDialog = true })`
2. `Column(fillMaxSize, background = WiomColors.bgPrimary)`
3. **Header band** — `Column(fillMaxWidth, background = WiomColors.brandSecondary, padding = 16.dp)`:
   - `Text("रॉकस्टार!" / "Rockstar!", 24.sp, Bold, WiomColors.bgPrimary)` — single-line header, celebratory tone
4. **Preview area** — `Column(weight = 1f, padding = 16.dp, horizontalAlignment = CenterHorizontally)`:
   - `Box(fillMaxWidth, height = 400.dp, clip RoundedCornerShape(16.dp))` containing `AsyncImage(model = selfieUri, contentScale = ContentScale.Crop, fillMaxSize)`
   - `Spacer(8.dp)`
   - `Text("फिर से लें" / "Retake", 14.sp SemiBold, WiomColors.brandPrimary, clickable { onRetake() })` — text link below preview
5. `WizardCtaBar`:
   - `WiomButton(type = Primary, label = "कस्टमर के आधार कार्ड की फोटो लें" / "Take customer's Aadhaar photo", onClick = { submitSelfie() })`
   - Submit disables the CTA, fires `closeStep(SELFIE)`; on success navigates to `s8`.

**States.**
| State | Visual |
|---|---|
| Idle (preview loaded, ready to submit) | Full preview + retake link + enabled CTA |
| Submitting | CTA disabled, inline spinner |
| Submit error | Toast via `ConfirmationToast` + CTA re-enabled |

**Labels (inline):**
- Header: `WiomLabels.pick("रॉकस्टार!", "Rockstar!")`
- Retake: `WiomLabels.pick("फिर से लें", "Retake")`
- CTA: `WiomLabels.pick("कस्टमर के आधार कार्ड की फोटो लें", "Take customer's Aadhaar photo")`

---

### 3.3 S03 — PayG Acknowledge

**Purpose.** First gate in the installation flow. Before any capture begins, the agent must listen to a 10-second PayG explanation audio and tick a confirmation checkbox acknowledging the fee structure. The reason: a significant fraction of complaints come from customers who believed the PayG fee was higher than ₹300 — this screen forces the agent to hear the rule in audio form and own the acknowledgement before they can proceed.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| Graph Entry router (fresh start) | s4 `TransferInfo` after checkbox tick → ~450ms pacing delay → auto-advance |

S03 is the `flowOrder.first()` — the Entry router lands here when `resume_screen_<taskId>` is unset.

**Layout.**
1. `WizardTopBar(title = "", onClose = null, showHelp = true)` — **no × icon**. Only exit path is system back → `ExitDialog`.
2. `Column(fillMaxSize, background = WiomColors.bgPrimary, padding horizontal = 16.dp, padding top = 120.dp)`
3. **`horizontalAlignment = Alignment.Start`** — left-aligned body. Illustration, title, subtitle, and checkbox all anchor to the start edge. This is **NOT** centered. (S03 is a content-heavy screen; left alignment reads more like reading material than a hero moment.)
4. **Illustration** — `Box(size = 108.dp, clip CircleShape, background = WiomColors.infoBg, contentAlignment = Center)` containing `Text("🔊", 48.sp)` — speaker emoji on lavender-purple circle
5. `Spacer(24.dp)`
6. **Title** — `Text(WiomLabels.pick("PayG सेटअप में सिर्फ ₹300 सिक्योरिटी फीस होती है", "PayG setup has only a ₹300 security fee"), 24.sp, Bold, WiomColors.textPrimary, lineHeight = 32.sp)`
7. `Spacer(16.dp)`
8. **Subtitle** — `Text(WiomLabels.pick("कस्टमर सिर्फ ₹300 सिक्योरिटी फीस ही पे करता है, नेट बॉक्स के लिए", "Customer only pays ₹300 security fee for the NetBox"), 16.sp, WiomColors.textSecondary, lineHeight = 24.sp)`
   - **Subtitle color is `textSecondary`** (not `textPrimary`). Deliberate — the subtitle is supporting context, not equal emphasis with the title.
9. **Progress bar** — 4.dp tall `Box(fillMaxWidth, clip RoundedCornerShape(2.dp), background = WiomColors.bgSecondary)` with inner `Box(fillMaxHeight, fillMaxWidth(progress), background = WiomColors.brandPrimary)`. Wrapped in `AnimatedVisibility(visible = !showCheckbox)` so it fades out once audio ends. `padding horizontal = 24.dp, vertical = 16.dp`.
10. **Checkbox** — wrapped in `AnimatedVisibility(visible = showCheckbox)`. A tappable row `Row(padding = 16.dp, verticalAlignment = Top) { Checkbox(...) + Text(checkboxLabel, 16.sp, textPrimary) }`. Appears after `audioDurationMs + bufferMs = 10000 + 250 = 10250 ms` from composition start.
11. **Auto-advance.** Once the checkbox is ticked, a `LaunchedEffect(checked) { delay(450); onAccepted() }` fires, setting `payg_accepted_<taskId> = true` in SharedPreferences and navigating to `s4`. There is NO separate "Continue" button — the checkbox IS the CTA.

**BackHandler invariant.** `androidx.activity.compose.BackHandler { onClose() }` — system back intercepts and fires the `ExitDialog` instead of popping the graph. S03 has no × icon (`onClose = null` on `WizardTopBar`). This is a spec invariant: PayG acknowledgement is mandatory, and the only path out without acceptance is via the exit dialog.

**MediaPlayer lifecycle.** `DisposableEffect(audioResId) { player = MediaPlayer.create(context, R.raw.payg_acceptance); player.setOnCompletionListener { ... }; player.start(); onDispose { player.release() } }`. On rotation the player restarts from the beginning (acceptable for a 10s clip).

**Labels (inline):**
- Title: `WiomLabels.pick("PayG सेटअप में सिर्फ ₹300 सिक्योरिटी फीस होती है", "PayG setup has only a ₹300 security fee")`
- Subtitle: `WiomLabels.pick("कस्टमर सिर्फ ₹300 सिक्योरिटी फीस ही पे करता है, नेट बॉक्स के लिए", "Customer only pays ₹300 security fee for the NetBox")`
- Checkbox: `WiomLabels.pick("मैंने समझ लिया है, इस सेटअप में ₹300 के अलावा कोई और पेमेंट नहीं होती है", "I understand that no payment other than ₹300 is collected in this setup")`

---

### 3.4 S04 — Transfer Info

**Purpose.** Give the agent everything they need to coordinate with the customer before arriving at the premises: name, address, speed, one-tap call button, deadline, a tip bar reminder, and (post-call) the family number + ISP prefill hint.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s3 PayG (after checkbox + 450ms auto-advance) | s4b `ArrivalConfirm` via "सेटअप शुरू करें" primary CTA |

**Layout.**
1. `WizardTopBar(title = "नया सेटअप" / "New Setup", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, verticalScroll, padding = 16.dp)`
3. **Deadline card** — `Row(fillMaxWidth, clip RoundedCornerShape(12.dp), border = 1.dp WiomColors.borderDefault, background = WiomColors.surfaceCard, padding = 12.dp)`:
   - `Text("⏰", 20.sp)` + `Spacer(8.dp)` + `Text(WiomLabels.pick("12 January से पहले नेट चालू करना है", "Net must be activated before 12 January"), 14.sp, SemiBold, WiomColors.textPrimary)`
4. `Spacer(16.dp)`
5. **Customer info card** — `SetupCard(padding = 16.dp)` containing:
   - **Name row** — `Row(fillMaxWidth, verticalAlignment = CenterVertically)`:
     - Avatar: `Box(40.dp, CircleShape, background = WiomColors.bgSecondary)` with `Text("👤", 20.sp)` (mock seed literal — real task data wires this from `TaskDetail.customerName`)
     - `Spacer(12.dp)`
     - Name: `Text(customer.name, 18.sp, Bold, WiomColors.textPrimary, weight = 1f)`
     - **Call button**: `Box(40.dp, CircleShape, background = WiomColors.successBg, clickable { onCustomerCalled(); context.startActivity(ACTION_DIAL, tel:${customer.mobile}) })` with `Text("📞", 18.sp)`
     - `Spacer(8.dp)`
     - **Direction button**: `Box(40.dp, CircleShape, background = WiomColors.brandPrimaryLight, clickable { /* stub: geo: intent not wired this PR */ })` with `Text("📍", 18.sp)`
   - `Spacer(16.dp)`
   - **Address row** — `Row` with `Text("📌")` + `Spacer(8.dp)` + address text (14.sp, textSecondary, lineHeight = 20.sp)
   - `Spacer(12.dp)`
   - **Speed row** — `Row` with `Text("⚡")` + speed text (`"100 Mbps स्पीड"` / `"100 Mbps speed"`, 14.sp, SemiBold, textPrimary)
   - **Family number (conditional)** — wrapped in `AnimatedVisibility(visible = customerCalled, enter = fadeIn() + expandVertically())`; reveals 2s after call button is tapped. `Row` with `Text("🎫")` + `Text("फैमिली नंबर: {number}" / "Family number: {number}", 14.sp, SemiBold, textPrimary)`
6. `Spacer(12.dp)`
7. **Tip bar** — `Row(fillMaxWidth, clip RoundedCornerShape(8.dp), background = WiomColors.brandSecondary, padding = 12.dp)`:
   - `Text("💡", 16.sp)` + `Spacer(8.dp)` + `Text(WiomLabels.pick("कस्टमर को कॉल करके, अपने पहुंचने का समय बता दें", "Call the customer and inform them of your arrival time"), 13.sp, Color.White, lineHeight = 18.sp)`
8. **ISP Prefill card (conditional)** — wrapped in `AnimatedVisibility(visible = customerCalled)` same 2s delay:
   - `Row(verticalAlignment = Center)` inside a `Card(background = WiomColors.ispPrefillBg, border = 1.dp WiomColors.ispPrefillBorder, padding = 12.dp)`:
   - `Text("🚀", 20.sp)` + `Spacer(8.dp)` + `Column { Text("सेटअप पर 15 मिनट बचाएँ" / "Save 15 minutes on setup", 14.sp Bold textPrimary); Text("अब ISP अकाउंट की डिटेल्स पहले भर लें" / "Fill in ISP account details now", 13.sp textSecondary) }`
9. `WizardCtaBar`:
   - `WiomButton(type = Primary, label = "सेटअप शुरू करें" / "Start setup", onClick = { navController.navigate("s4b") })`

The primary CTA is always enabled — the call is encouraged but not gating. (Policy decision per UAT feedback.)

**Labels (inline):**
- Header title: `WiomLabels.pick("नया सेटअप", "New Setup")`
- Deadline: `WiomLabels.pick("{date} से पहले नेट चालू करना है", "Net must be activated before {date}")` — the `{date}` is substituted at render time from `task.deadline`
- Speed: `WiomLabels.pick("{mbps} Mbps स्पीड", "{mbps} Mbps speed")`
- Family number: `WiomLabels.pick("फैमिली नंबर: {number}", "Family number: {number}")`
- Tip: `WiomLabels.pick("कस्टमर को कॉल करके, अपने पहुंचने का समय बता दें", "Call the customer and inform them of your arrival time")`
- ISP prefill title: `WiomLabels.pick("सेटअप पर 15 मिनट बचाएँ", "Save 15 minutes on setup")`
- ISP prefill body: `WiomLabels.pick("अब ISP अकाउंट की डिटेल्स पहले भर लें", "Fill in ISP account details now")`
- Primary CTA: `WiomLabels.pick("सेटअप शुरू करें", "Start setup")`

---

### 3.5 S04b — Arrival Confirm (dialog chain)

**Purpose.** Two chained modal dialogs over a dimmed backdrop, confirming (a) the agent has a 3-pin plug, and (b) they have physically arrived at the customer's home. **There is no full-screen body** on s4b — the route renders only the dimmed scrim + the active dialog.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s4 `TransferInfo` via "सेटअप शुरू करें" CTA | s5 `SelfieCapture` after arrival confirmed |

**Layout.**
The route composable is:
```kotlin
composable("s4b") { backStackEntry ->
  val vm = rememberWizardVm(backStackEntry)
  LaunchedEffect("s4b") { vm.onNavigate("s4b") }
  Box(fillMaxSize, background = Color.Black.copy(alpha = 0.5f)) {
    if (!threePinChecked) ThreePinDialog(...)
    else ArrivalDialog(...)
  }
}
```

**Dialog 1 — 3-pin plug warning.** Rendered when `threePinChecked == false`. Full-bleed blocking dialog; agent must read and tick the latched checkbox before proceeding.

Layout:
1. Dialog `Column(clip RoundedCornerShape(24.dp), background = WiomColors.surfaceCard, padding = 24.dp, horizontalAlignment = CenterHorizontally)` centered in the scrim
2. **3-pin illustration** — `Box(fillMaxWidth, height = 160.dp, clip RoundedCornerShape(12.dp), background = WiomColors.infoBg)` with `Image(painterResource(R.drawable.threepin_plug), ...)` as the artwork
3. `Spacer(16.dp)`
4. **Title** — `Text(WiomLabels.pick("नेट बॉक्स के साथ 3-पिन प्लग लगाना भी ज़रूरी है", "A 3-pin plug is also required with the NetBox"), 20.sp, Bold, WiomColors.textPrimary, lineHeight = 28.sp)`
5. `Spacer(12.dp)`
6. **Warning box** — `Row(fillMaxWidth, clip RoundedCornerShape(8.dp), background = WiomColors.warningBg, border = 3.dp WiomColors.warning, padding = 12.dp, verticalAlignment = Center)`:
   - `Text("⚠️", 16.sp)` + `Spacer(8.dp)` + `Text(WiomLabels.pick("3-पिन के बिना सेट अप अधूरा रहेगा", "Setup will be incomplete without a 3-pin plug"), 14.sp, SemiBold, WiomColors.warningText)`
7. `Spacer(20.dp)`
8. **Latched checkbox** — `Row(clickable { threePinChecked = true }) { Checkbox(checked = threePinChecked, onCheckedChange = { threePinChecked = true }) + Text(WiomLabels.pick("मैंने 3-पिन प्लग रख लिया है", "I have a 3-pin plug"), 14.sp, textPrimary) }`. Once ticked, always stays ticked for this graph entry (latched — no unchecking).

On `threePinChecked = true`: `LaunchedEffect(threePinChecked) { delay(600); showArrivalDialog = true }` — 600ms after the checkbox ticks, Dialog 1 hides and Dialog 2 shows.

**Dialog 2 — arrival confirmation.** Rendered when `threePinChecked == true && showArrivalDialog == true`.

Layout:
1. Dialog `Column(clip RoundedCornerShape(24.dp), background = WiomColors.surfaceCard, padding horizontal = 32.dp, vertical = 24.dp, horizontalAlignment = CenterHorizontally)`
2. **House illustration** — `Box(size = 96.dp, clip CircleShape, background = WiomColors.brandPrimaryLight)` with `Image(painterResource(R.drawable.house_graphic), ...)`
3. `Spacer(24.dp)`
4. **Title** — `Text(WiomLabels.pick("क्या आप कस्टमर के घर पर हैं?", "Are you at the customer's home?"), 24.sp, Bold, textPrimary, lineHeight = 32.sp)`
5. `Spacer(24.dp)`
6. **Primary CTA** — `WiomButton(type = Primary, label = WiomLabels.pick("हाँ, पहुँच गया हूँ", "Yes, I have arrived"), onClick = { navController.navigate("s5") })`

**BackHandler.** System back on s4b dismisses the active dialog and pops back to `s4` `TransferInfo` — so if the agent mis-tapped their way in, one back press returns them.

**Labels (inline):**
- ThreePin title: `WiomLabels.pick("नेट बॉक्स के साथ 3-पिन प्लग लगाना भी ज़रूरी है", "A 3-pin plug is also required with the NetBox")`
- ThreePin warning: `WiomLabels.pick("3-पिन के बिना सेट अप अधूरा रहेगा", "Setup will be incomplete without a 3-pin plug")`
- ThreePin checkbox: `WiomLabels.pick("मैंने 3-पिन प्लग रख लिया है", "I have a 3-pin plug")`
- Arrival title: `WiomLabels.pick("क्या आप कस्टमर के घर पर हैं?", "Are you at the customer's home?")`
- Arrival CTA: `WiomLabels.pick("हाँ, पहुँच गया हूँ", "Yes, I have arrived")`

---

### 3.6 S08 — Aadhaar Camera (+ Review FSM)

**Purpose.** Captures one side of the customer's Aadhaar card — front or back — with a dashed Aadhaar-card cutout overlay drawn directly on the CameraX preview. Unlike the v2.1 DRAFT split (separate `AADHAAR_CAMERA` + `AADHAAR_REVIEW` routes), v2.1.1 implements Aadhaar as **a single screen with a 3-state FSM** that toggles between camera view (capture mode) and review view (both-captured mode).

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s6 `SelfieReview` after `closeStep(SELFIE)` success | s8c `PaygSystemInfo` via "आगे बढ़ें" after `closeStep(AADHAR)` success |

**State machine.** The composable tracks `frontUri: Uri?` and `backUri: Uri?` and renders one of three views:

- **State 1 — `frontUri == null && backUri == null`:** Camera view with title **"आधार कार्ड की फोटो लें"** / "Capture Aadhaar photo", `overlay = CameraOverlay.AadhaarCard`, `ctaLabel = "आगे की फोटो लें"` / "Take front photo". On capture, sets `frontUri = uri` and stays on the screen → State 2.
- **State 2 — `frontUri != null && backUri == null`:** Camera view with title still **"आधार कार्ड की फोटो लें"** (unchanged — the agent is mid-way through capture). `ctaLabel = "पीछे की फोटो लें"` / "Take back photo". Shows a small thumbnail of the front photo in the top-right corner above the overlay (100.dp circle with `AsyncImage(model = frontUri)`). On capture, sets `backUri = uri` → State 3.
- **State 3 — `frontUri != null && backUri != null`:** **Review view** — NOT a camera. Title changes to past tense **"आधार कार्ड की फोटो"** / "Aadhaar photo" (drops "लें"). Layout:
  1. `WizardTopBar(title = "आधार कार्ड की फोटो" / "Aadhaar photo", onClose = { showExitDialog = true })`
  2. `Column(padding = 16.dp, verticalScroll)`
  3. Title: `Text("आधार कार्ड की फोटो", 24.sp, Bold, textPrimary)`
  4. `Spacer(16.dp)`
  5. **Side-by-side thumbnails row** — `Row(fillMaxWidth, Arrangement.spacedBy(12.dp))`:
     - `Column(weight = 1f)` with `Box(fillMaxWidth, height = 120.dp, clip 12.dp) { AsyncImage(frontUri, Crop) }` + `Spacer(4.dp)` + `Row(SpaceBetween) { Text("आगे" / "Front", 12.sp, SemiBold, textSecondary); Text("फिर से लें" / "Retake", 12.sp, SemiBold, brandPrimary, clickable { frontUri = null }) }`
     - Same pattern for back: `Text("पीछे" / "Back", ...)` + retake clears `backUri`
  6. `WizardCtaBar` → `WiomButton(type = Primary, label = "आगे बढ़ें" / "Continue", onClick = { submitAadhaar(); })`

**Dynamic title rule.** The title string is computed at render time:
```kotlin
val title = if (frontUri != null && backUri != null) {
  WiomLabels.pick("आधार कार्ड की फोटो", "Aadhaar photo")  // past tense, review mode
} else {
  WiomLabels.pick("आधार कार्ड की फोटो लें", "Capture Aadhaar photo")  // capturing
}
```

**Aadhaar-card dashed cutout overlay** (State 1 + State 2). Implemented via `Canvas.drawWithContent + BlendMode.Clear + dashPathEffect`:
```kotlin
Canvas(fillMaxSize) {
  // scrim
  drawRect(color = Color.Black.copy(alpha = 0.55f))

  // cutout
  val cutoutWidth = size.width - 2 * 16.dp.toPx()
  val cutoutHeight = 199.dp.toPx()
  val cutoutLeft = 16.dp.toPx()
  val cutoutTop = (size.height - cutoutHeight) / 2

  drawRoundRect(
    color = Color.Transparent,
    topLeft = Offset(cutoutLeft, cutoutTop),
    size = Size(cutoutWidth, cutoutHeight),
    cornerRadius = CornerRadius(16.dp.toPx()),
    blendMode = BlendMode.Clear
  )

  // dashed border
  val stroke = Stroke(
    width = 2.dp.toPx(),
    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
  )
  drawRoundRect(
    color = Color(0xB3FAF9FC),
    topLeft = Offset(cutoutLeft, cutoutTop),
    size = Size(cutoutWidth, cutoutHeight),
    cornerRadius = CornerRadius(16.dp.toPx()),
    style = stroke
  )
}
```

**Labels (inline):**
- Title (capturing): `WiomLabels.pick("आधार कार्ड की फोटो लें", "Capture Aadhaar photo")`
- Title (review): `WiomLabels.pick("आधार कार्ड की फोटो", "Aadhaar photo")`
- CTA (State 1): `WiomLabels.pick("आगे की फोटो लें", "Take front photo")`
- CTA (State 2): `WiomLabels.pick("पीछे की फोटो लें", "Take back photo")`
- Thumbnail labels: `WiomLabels.pick("आगे", "Front")` / `WiomLabels.pick("पीछे", "Back")`
- Retake link: `WiomLabels.pick("फिर से लें", "Retake")`
- Continue: `WiomLabels.pick("आगे बढ़ें", "Continue")`

---

### 3.7 S08c — PayG System Info (audio)

**Purpose.** Second audio briefing (after S03 PayG Acknowledge). A 17-second clip explaining the PayG system mechanics to the agent after Aadhaar is captured but before any payment is collected. Unlike S03, this surface uses a **Primary `आगे बढ़ें`** CTA (not a checkbox and not a Tertiary link) — the agent has already committed via S03; this is a lighter "got it, continue" beat.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s8 `AadhaarReview` State 3 after `closeStep(AADHAR)` success | s12 `PaymentChecklist` via Primary CTA |

**Layout.**
1. `WizardTopBar(title = "PayG जानकारी" / "PayG Info", onClose = { showExitDialog = true })`
2. `Column(fillMaxSize, background = WiomColors.bgPrimary, padding horizontal = 16.dp, padding top = 120.dp)`
3. `horizontalAlignment = Alignment.Start`
4. **Illustration** — `Box(108.dp, CircleShape, background = WiomColors.infoBg)` with `Text("🔊", 48.sp)`
5. `Spacer(24.dp)`
6. **Title** — `Text(WiomLabels.pick("PayG सिस्टम जानकारी", "PayG System Info"), 24.sp, Bold, textPrimary, lineHeight = 32.sp)`
7. `Spacer(16.dp)`
8. **Subtitle** — `Text(WiomLabels.pick("कस्टमर सिर्फ ₹300 सिक्योरिटी फीस ही पे करता है", "Customer only pays a ₹300 security fee"), 16.sp, textSecondary, lineHeight = 24.sp)`
9. **Progress bar** (same as S03) — 4.dp track + fill, `AnimatedVisibility(visible = !showCta)`
10. **CTA** — `WizardCtaBar` with `AnimatedVisibility(visible = showCta) { WiomButton(type = Primary, label = WiomLabels.pick("आगे बढ़ें", "Continue"), onClick = { navController.navigate("s12") }) }`

CTA reveal timing: `audioDurationMs = 17000L + bufferMs = 1500L = 18500ms` from composition start. `R.raw.payg_precheck` audio file. MediaPlayer lifecycle same as S03.

**Labels (inline):**
- Title: `WiomLabels.pick("PayG सिस्टम जानकारी", "PayG System Info")`
- Subtitle: `WiomLabels.pick("कस्टमर सिर्फ ₹300 सिक्योरिटी फीस ही पे करता है", "Customer only pays a ₹300 security fee")`
- CTA: `WiomLabels.pick("आगे बढ़ें", "Continue")`

---

### 3.8 S12 — Payment Checklist

**Purpose.** A 5.4-second, 6-state animated checklist that visualises the customer's payment journey: WiFi Setup ✓ (always done) → Aadhaar Verification (pending → in-progress → done) → Payment (pending → in-progress → done). Auto-advances to `s13 PowerUpTimer` at t=5.4s. A flashing PayG info card appears at state 4.

In v2.1.1 the animation is still hardcoded (`LaunchedEffect + delay()`); real backend wiring to `PaymentRepository.observePaymentStatus(taskId)` is deferred.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s8c `PaygSystemInfo` via "आगे बढ़ें" | s13 `PowerUpTimer` at t=5400ms auto-advance |

**Layout.**
1. `WizardTopBar(title = "पेमेंट" / "Payment", onClose = { showExitDialog = true })`
2. `Column(fillMaxSize, padding = 16.dp, horizontalAlignment = CenterHorizontally)`
3. `Spacer(32.dp)`
4. **Title** — `Text("${customer.name} जी से व्योम ऐप द्वारा पेमेंट करने को कहें" / "Ask ${customer.name} to pay via the Wiom app", 20.sp, Bold, textPrimary, textAlign = Center, lineHeight = 28.sp)`
5. `Spacer(32.dp)`
6. **Checklist card** — `Column(fillMaxWidth, clip 16.dp, background = WiomColors.bgSecondary, padding = 20.dp)`:
   - `ChecklistItem("WiFi सेटअप", state = DONE)` — always DONE
   - `ChecklistConnector(done = checklistState >= 2)`
   - `ChecklistItem("आधार वेरिफिकेशन", state = if(>=2) DONE else if(>=1) IN_PROGRESS else PENDING)`
   - `ChecklistConnector(done = checklistState >= 5)`
   - `ChecklistItem(label = <tri-state>, state = if(>=5) DONE else if(>=3) IN_PROGRESS else PENDING)` — label is `"पेमेंट"` → `"पेमेंट करें"` → `"पेमेंट हो गयी"`
7. **PayG info card** (conditional) — `AnimatedVisibility(visible = checklistState == 4, enter = fadeIn + expandVertically, exit = fadeOut + shrinkVertically)`:
   - `Spacer(16.dp)` + info card `Row(padding = 12.dp, background = WiomColors.infoBg, border = 1.dp WiomColors.info, clip 8.dp)` with `Text("PayG: कस्टमर सिर्फ ₹300 सिक्योरिटी फीस पे करता है", 14.sp, SemiBold, WiomColors.info)`

**`ChecklistItem`** — `Row(verticalAlignment = Center, padding vertical = 4.dp)`:
- Status icon (28.dp circle):
  - DONE: `WiomColors.success` bg + white `✓` 14.sp Bold
  - IN_PROGRESS: `Color.Transparent` + 24.dp `CircularProgressIndicator(color = WiomColors.brandPrimary, strokeWidth = 3.dp)`
  - PENDING: `WiomColors.borderDefault` bg + empty
- `Spacer(12.dp)`
- Label: 16.sp, SemiBold. Color = `success` if DONE, `textHint` if PENDING, `textPrimary` if IN_PROGRESS.

**`ChecklistConnector`** — `Box(padding start = 13.dp, width = 2.dp, height = 24.dp, background = if (done) WiomColors.success else WiomColors.borderDefault)`.

**State timeline (hardcoded):**
| State | Time | WiFi | Aadhaar | Payment | Label | PayG card |
|---|---|---|---|---|---|---|
| 0 | 0–1000ms | DONE | PENDING | PENDING | "पेमेंट" | hidden |
| 1 | 1000–1600ms | DONE | IN_PROGRESS | PENDING | "पेमेंट" | hidden |
| 2 | 1600–2200ms | DONE | DONE | PENDING | "पेमेंट" | hidden |
| 3 | 2200–3000ms | DONE | DONE | IN_PROGRESS | "पेमेंट" | hidden |
| 4 | 3000–4200ms | DONE | DONE | IN_PROGRESS | "पेमेंट करें" | **visible** |
| 5 | 4200–5400ms | DONE | DONE | DONE | "पेमेंट हो गयी" | hidden (exit anim) |
| complete | 5400ms | — | — | — | — | `onComplete()` fires |

**Labels (inline):**
- Title: `WiomLabels.format("{name} जी से व्योम ऐप द्वारा पेमेंट करने को कहें", "Ask {name} to pay via the Wiom app", name = customer.name)`
- WiFi item: `WiomLabels.pick("WiFi सेटअप", "WiFi Setup")`
- Aadhaar item: `WiomLabels.pick("आधार वेरिफिकेशन", "Aadhaar Verification")`
- Payment (pending): `WiomLabels.pick("पेमेंट", "Payment")`
- Payment (active): `WiomLabels.pick("पेमेंट करें", "Make payment")`
- Payment (done): `WiomLabels.pick("पेमेंट हो गयी", "Payment completed")`
- PayG hint: `WiomLabels.pick("PayG: कस्टमर सिर्फ ₹300 सिक्योरिटी फीस पे करता है", "PayG: Customer only pays ₹300 security fee")`

---

### 3.9 S13 — Power-Up Timer

**Purpose.** 15-second countdown timer that auto-advances. Creates deliberate pacing while the NetBox boots. Shows a large `MM:SS` timer, a "preparing..." subtitle, and a spinner — no user input.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s12 `PaymentChecklist` auto-advance at 5.4s | s14 `SwitchOnConfirm` at 15s countdown |

**Layout.** **No `WizardTopBar` on this screen** — pure centered content. The outer `Column` must apply `.statusBarsPadding()` explicitly:

```kotlin
Column(
  modifier = Modifier
    .fillMaxSize()
    .statusBarsPadding()             // <-- REQUIRED
    .background(WiomColors.bgPrimary),
  horizontalAlignment = Alignment.CenterHorizontally,
  verticalArrangement = Arrangement.Center
) {
  Text(
    text = String.format("00:%02d", secondsRemaining),
    fontSize = 64.sp,
    fontWeight = FontWeight.Bold,
    color = WiomColors.textPrimary
  )
  Spacer(16.dp)
  Text(
    text = WiomLabels.pick("नेट बॉक्स तैयार हो रहा है...", "NetBox is preparing..."),
    fontSize = 16.sp,
    color = WiomColors.textSecondary
  )
  Spacer(24.dp)
  CircularProgressIndicator(
    modifier = Modifier.size(32.dp),
    color = WiomColors.brandPrimary,
    strokeWidth = 3.dp
  )
}
```

Timer logic:
```kotlin
var secondsRemaining by rememberSaveable { mutableIntStateOf(15) }
LaunchedEffect(Unit) {
  while (secondsRemaining > 0) {
    delay(1000)
    secondsRemaining--
  }
  onTimerDone()
}
```

**Labels (inline):**
- Subtitle: `WiomLabels.pick("नेट बॉक्स तैयार हो रहा है...", "NetBox is preparing...")`

---

### 3.10 S14 — Switch-On Confirm

**Purpose.** Confirmation that the NetBox is physically powered on. Shows a NetBox illustration and a checkbox. Ticking the checkbox auto-advances after a 600ms pacing delay.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s13 `PowerUpTimer` at 15s | s11 `CustomerDetails` 600ms after checkbox tick |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true }, showHelp = true)` — top bar present but title is empty (the screen has its own body title)
2. `Column(fillMaxSize, padding = 16.dp, horizontalAlignment = CenterHorizontally, verticalArrangement = Center)`
3. **Title** — `Text(WiomLabels.pick("व्योम नेट बॉक्स को स्विच ऑन करें", "Switch on the Wiom NetBox"), 24.sp, Bold, textPrimary, textAlign = Center, lineHeight = 32.sp)`
4. `Spacer(32.dp)`
5. **NetBox illustration** — `Box(fillMaxWidth, height = 200.dp, clip 16.dp, background = WiomColors.bgSecondary, contentAlignment = Center)` with `Image(painterResource(R.drawable.netbox_power), ...)`
6. `Spacer(32.dp)`
7. **Checkbox** — `Row(clickable { checked = true }) { Checkbox(checked = checked, onCheckedChange = { checked = true }); Text(WiomLabels.pick("नेट बॉक्स ऑन कर दिया है", "NetBox is switched on"), 14.sp, textPrimary) }`

Advance: `LaunchedEffect(checked) { if (checked) { delay(600); navController.navigate("s11") } }`.

**Labels (inline):**
- Title: `WiomLabels.pick("व्योम नेट बॉक्स को स्विच ऑन करें", "Switch on the Wiom NetBox")`
- Checkbox: `WiomLabels.pick("नेट बॉक्स ऑन कर दिया है", "NetBox is switched on")`

---

### 3.11 S11 — Customer Details

**Purpose.** Final gate in Phase 5: re-display the customer info (name, address, family number) and the two Aadhaar photos that were captured earlier. Primary CTA advances to the ISP audio briefing.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s14 `SwitchOnConfirm` after checkbox + 600ms | s15 `IspRechargeAudio` via "ISP अकाउंट बनायें" primary CTA |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, verticalScroll, padding = 16.dp)`
3. **Title** — `Text(WiomLabels.pick("कस्टमर डिटेल्स", "Customer Details"), 24.sp, Bold, textPrimary)`
4. `Spacer(16.dp)`
5. **Customer info card** — `Card(background = WiomColors.surfaceCard, padding = 16.dp)`:
   - Name row — 40.dp avatar + name 18.sp Bold textPrimary
   - `Spacer(12.dp)`
   - Address row — `📌` + address 13.sp textSecondary lineHeight 18
   - `Spacer(8.dp)`
   - Family number — `🎫` + "फैमिली नंबर: {number}" / "Family number: {number}" 13.sp SemiBold textPrimary
6. `Spacer(16.dp)`
7. **Aadhaar section header Row** — `Row(fillMaxWidth, verticalAlignment = CenterVertically, horizontalArrangement = SpaceBetween)`:
   - Left: `Text(WiomLabels.pick("आधार कार्ड", "Aadhaar card"), 16.sp, Bold, textPrimary)`
   - Right: **Aadhaar download icon button** — inline neutral-action icon:
```kotlin
Box(
  modifier = Modifier
    .size(48.dp)
    .clip(CircleShape)
    .background(WiomColors.bgSecondary)  // lavender — the LIGHTER shade
    .clickable { /* stub — real DigiLocker wiring deferred */ },
  contentAlignment = Alignment.Center
) {
  Text(
    text = "↓",
    fontSize = 24.sp,
    fontWeight = FontWeight.Bold,
    color = WiomColors.textPrimary      // the DARKER shade
  )
}
```
The spec is explicit: **48.dp circle, `bgSecondary` lavender background, `↓` glyph at 24.sp Bold in `textPrimary`**. The circle shade must be lighter than the glyph shade (neutral-action icon button pattern). No brand tint — this is not a primary affordance, it's a secondary action on the Aadhaar section.

The previous v2.1 DRAFT specced a full-width pink-tint "Save Aadhaar photos" card with an icon + title + subtitle + chevron below the thumbnails. v2.1.1 **deletes that full-width card** and replaces it with this inline circle button in the section header. Rationale: the download is an action on the Aadhaar section, not a body-sized extra step — promoting it to a CTA was spec drift.

8. `Spacer(8.dp)`
9. **Thumbnails row** — `Row(fillMaxWidth, Arrangement.spacedBy(12.dp))`:
   - Two `Box(weight = 1f, height = 120.dp, clip 12.dp, background = WiomColors.bgSecondary)` containing `AsyncImage(frontUri / backUri, Crop)`
   - Fallback (if Uri null) — centered `Text("आगे" / "पीछे", 14.sp, textHint)`
10. `WizardCtaBar` → `WiomButton(type = Primary, label = WiomLabels.pick("ISP अकाउंट बनायें", "Create ISP account"), onClick = { navController.navigate("s15") })`

**Note on hardcoded customer name.** The mock seed literal is `"Himanshu Singh"`. When real task data is wired through parent graph args, this comes from `TaskDetail.customerName`. See §Deferred items.

**Labels (inline):**
- Title: `WiomLabels.pick("कस्टमर डिटेल्स", "Customer Details")`
- Aadhaar section: `WiomLabels.pick("आधार कार्ड", "Aadhaar card")`
- Front fallback: `WiomLabels.pick("आगे", "Front")`
- Back fallback: `WiomLabels.pick("पीछे", "Back")`
- CTA: `WiomLabels.pick("ISP अकाउंट बनायें", "Create ISP account")`

---

### 3.12 S15 — ISP Recharge Audio

**Purpose.** Third audio briefing (after S03 PayG Acknowledge and S08c PayG System Info). Plays a 9.2-second clip explaining that the ISP recharge is a **system action, not a customer payment** — important to prevent agents from trying to collect the ISP plan cost from the customer.

**Uses a Tertiary "समझ गया" / "Got it" link CTA** (not Primary, not checkbox). This is the component fulfilment of the v2.1 DRAFT's "GhostButton" concept — `WiomButton(type = WiomButtonType.Tertiary)`: no border, no fill, brand-pink label, 48.dp minimum touch height, full-width inside `WizardCtaBar`.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s11 `CustomerDetails` | s16 `IspForm` via Tertiary CTA |

**Layout.** Same pattern as S03 PayG Acknowledge (left-aligned, speaker illustration + title + subtitle + progress bar + revealed CTA), with these differences:
- `WizardTopBar(title = "ISP जानकारी" / "ISP Info", onClose = { showExitDialog = true })` — has chrome (× visible)
- Audio: `R.raw.isp_recharge`, `audioDurationMs = 9200L`, `bufferMs = 1300L`
- Title: `WiomLabels.pick("ISP 100 Mbps 30-दिन का प्लान", "ISP 100 Mbps 30-day plan")`
- Subtitle: `WiomLabels.pick("यह एक सिस्टम एक्शन है, कस्टमर की पेमेंट नहीं है", "This is a system action, not a customer payment")`
- CTA: **Tertiary** `WiomButton(type = Tertiary, label = WiomLabels.pick("समझ गया", "Got it"), onClick = { navController.navigate("s16") })`

**Labels (inline):**
- Title: `WiomLabels.pick("ISP 100 Mbps 30-दिन का प्लान", "ISP 100 Mbps 30-day plan")`
- Subtitle: `WiomLabels.pick("यह एक सिस्टम एक्शन है, कस्टमर की पेमेंट नहीं है", "This is a system action, not a customer payment")`
- CTA: `WiomLabels.pick("समझ गया", "Got it")`

---

### 3.13 S16 — ISP Form

**Purpose.** The biggest non-photo form in the flow. Collects ISP credentials with a progressive reveal pattern — each field appears after the previous is validated. On form complete, a `WifiConnectDialog` modal prompts the agent to connect to the NetBox WiFi network.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s15 `IspRechargeAudio` via Tertiary CTA | s17 `PlacementCheck` via `WifiConnectDialog` → "कनेक्ट करें" |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, verticalScroll, padding = 16.dp)`
3. Title: `Text(WiomLabels.pick("ISP डिटेल्स भरें", "Fill ISP details"), 24.sp, Bold, textPrimary)`
4. `Spacer(20.dp)`
5. **ISP Type section** — label `Text("ISP Type", 14.sp, Bold, textPrimary)` + radio group:
   - `RadioOption("PPPoE")` — default selected
   - `RadioOption("Static IP")`
   - `RadioOption("DHCP")`
6. `Spacer(20.dp)`
7. **Username field** — `SetupInputField(label = "Username", placeholder = "ISP username डालें" / "Enter ISP username", value, onValueChange)` with trailing-icon 3 states:
   - **Ready to validate** (text present, not validating, not validated): 28.dp `brandPrimary` circle with white `"→"` 14.sp Bold, clickable → sets `usernameValidating = true`
   - **Validating**: 20.dp `CircularProgressIndicator(brandPrimary, stroke 2.dp)` — simulated 1500ms delay
   - **Validated**: 20.dp `success` circle with white `"✓"` 12.sp Bold, field becomes read-only
8. **Password field** (revealed when `pppoeUsernameValidated`) — `AnimatedVisibility(visible = showPassword, enter = expandVertically + fadeIn)`:
   - `Spacer(16.dp)` + `SetupInputField(label = "Password", isPassword = true, placeholder = "Password डालें" / "Enter password")`
9. **VLAN dropdown** (revealed with password) — `SetupDropdown(label = "VLAN", options = ["TAG", "TRANSPARENT", "UNTAG"], value = vlanMode, onSelect)`
10. **VLAN ID field** (conditional on `vlanMode == "TAG"`) — `SetupInputField(label = "VLAN ID", keyboardType = Number, placeholder = "128-1492", isError = !isValidVlanId(...), errorText = "VLAN ID 128 से 1492 के बीच होना चाहिए")`
11. **Net Box ID field** (revealed when `vlanMode.isNotEmpty()`) — same trailing-icon 3-state pattern as Username
12. **Primary CTA** (wrapped in `AnimatedVisibility(visible = formComplete, enter = slideInVertically(from-bottom) + fadeIn)`) — `WizardCtaBar` with `WiomButton(type = Primary, label = "नेट बॉक्स तैयार करें" / "Prepare NetBox", onClick = { showWifiDialog = true })`

**`WifiConnectDialog`** — rendered conditionally when `showWifiDialog == true`:
- Outer `Box(fillMaxSize, background = Color.Black @ 50% alpha, contentAlignment = Center)`
- Dialog `Column(padding = 24.dp, clip RoundedCornerShape(28.dp), background = WiomColors.surfaceCard, padding = 24.dp, horizontalAlignment = Center)`
- WiFi icon — `Box(56.dp, CircleShape, WiomColors.successBg)` with `Text("📶", 28.sp)`
- `Spacer(16.dp)`
- Title — `Text(WiomLabels.pick("WiFi से कनेक्ट करें", "Connect to WiFi"), 20.sp, Bold, textPrimary)`
- `Spacer(8.dp)`
- Body — `Text(WiomLabels.pick("नेट बॉक्स के WiFi नेटवर्क से कनेक्ट करें ताकि सेटअप पूरा हो सके", "Connect to the NetBox WiFi network to complete setup"), 14.sp, textSecondary, lineHeight = 20.sp, textAlign = Center)`
- `Spacer(16.dp)`
- **SSID pill** — `Box(clip 20.dp, background = WiomColors.bgSecondary, padding horizontal = 16.dp, vertical = 8.dp)` containing `Row { Text("🔒", 14.sp); Spacer(6.dp); Text("Wiom_${task.netboxId}", 14.sp, SemiBold, textPrimary) }`
- `Spacer(24.dp)`
- **Button row** — `Row(Arrangement.spacedBy(12.dp))`:
  - Cancel: `Box(weight = 1f, height = 44.dp, clip 12.dp, background = WiomColors.bgSecondary, clickable { showWifiDialog = false })` with `Text("रद्द करें" / "Cancel", 14.sp, SemiBold, textSecondary)`
  - Connect: `Box(weight = 1f, height = 44.dp, clip 12.dp, background = WiomColors.success, clickable { showWifiDialog = false; navController.navigate("s17") })` with `Text("कनेक्ट करें" / "Connect", 14.sp, SemiBold, Color.White)`

**Labels (inline):**
- Title: `WiomLabels.pick("ISP डिटेल्स भरें", "Fill ISP details")`
- Field labels (Username / Password / VLAN / Net Box ID): kept English (technical ISP terms — same way "WiFi" is not translated)
- Username placeholder: `WiomLabels.pick("ISP username डालें", "Enter ISP username")`
- Password placeholder: `WiomLabels.pick("Password डालें", "Enter password")`
- VLAN ID error: `WiomLabels.pick("VLAN ID 128 से 1492 के बीच होना चाहिए", "VLAN ID must be between 128 and 1492")`
- Net Box ID placeholder: `WiomLabels.pick("Net Box ID डालें", "Enter Net Box ID")`
- CTA: `WiomLabels.pick("नेट बॉक्स तैयार करें", "Prepare NetBox")`
- Dialog title: `WiomLabels.pick("WiFi से कनेक्ट करें", "Connect to WiFi")`
- Dialog body: `WiomLabels.pick("नेट बॉक्स के WiFi नेटवर्क से कनेक्ट करें ताकि सेटअप पूरा हो सके", "Connect to the NetBox WiFi network to complete setup")`
- Cancel: `WiomLabels.pick("रद्द करें", "Cancel")`
- Connect: `WiomLabels.pick("कनेक्ट करें", "Connect")`

---

### 3.14 S17 — Placement Check (side-by-side cards)

**Purpose.** Audio briefing + acknowledgement gate before the NetBox photo. Agent plays the `netbox_placement` audio (10s), sees **side-by-side सही / गलत placement examples**, and ticks a checkbox confirming correct placement.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s16 `IspForm` via `WifiConnectDialog` → "कनेक्ट करें" | s18 `NetboxCamera` via checkbox tick |

**Implementation.** Uses the shared `TimerAudioCheckScreen` scaffold (see §2.3):

```kotlin
TimerAudioCheckScreen(
  title = WiomLabels.pick("नेट बॉक्स सही जगह लगाया है?", "Is the NetBox placed correctly?"),
  audioResId = R.raw.netbox_placement,    // 10.176s actual duration
  correctImage = R.drawable.placement_correct,
  incorrectImage = R.drawable.placement_incorrect,
  checkboxLabel = WiomLabels.pick("नेट बॉक्स सही जगह पर लगाया गया है", "NetBox has been placed correctly"),
  onChecked = { navController.navigate("s18") },
  onBack = { navController.popBackStack() }
)
```

The scaffold renders:
1. `WizardTopBar(title, onClose = { showExitDialog = true })`
2. Title text (24.sp Bold)
3. **Side-by-side comparison cards Row** (§2.7):
   - Left card (सही, success green border) — `placement_correct` illustration
   - Right card (गलत, error red border) — `placement_incorrect` illustration
4. Progress bar (audio playing)
5. Checkbox revealed after `10000 + 2000 = 12000ms`
6. `WizardCtaBar` with Primary "आगे बढ़ें"

**Labels (inline):**
- Title: `WiomLabels.pick("नेट बॉक्स सही जगह लगाया है?", "Is the NetBox placed correctly?")`
- Checkbox: `WiomLabels.pick("नेट बॉक्स सही जगह पर लगाया गया है", "NetBox has been placed correctly")`
- Correct card label: `WiomLabels.pick("सही", "Correct")`
- Incorrect card label: `WiomLabels.pick("गलत", "Incorrect")`

---

### 3.15 S18 — NetBox Camera

**Purpose.** Full-bleed capture of the physical NetBox in its installed position. Uses the shared `PhotoCaptureScreen` with no overlay.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s17 `PlacementCheck` via checkbox | s19 `NetboxPhotoReview` on capture success |

**Implementation:**
```kotlin
PhotoCaptureScreen(
  title = WiomLabels.pick("नेट बॉक्स की फोटो लें", "Take a photo of the NetBox"),
  ctaLabel = WiomLabels.pick("फोटो लें", "Take photo"),
  overlay = CameraOverlay.None,
  onCaptured = { uri -> state.netboxPhotoUri = uri; navController.navigate("s19") },
  onBack = { navController.popBackStack() }
)
```

`.statusBarsPadding()` is applied internally by the `PhotoCaptureScreen` ✕ wrapper.

---

### 3.16 S19 — NetBox Photo Review

**Purpose.** Review the captured NetBox photo. Retake returns to S18; Continue advances to S20.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s18 `NetboxCamera` | s20 `ThreepinCheck` on Continue; s18 on Retake |

**Layout.**
1. `WizardTopBar(title = "नेट बॉक्स फोटो" / "NetBox photo", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, padding = 16.dp)`
3. **Photo preview** — `Box(fillMaxWidth, height = 400.dp, clip 12.dp)`:
   - `AsyncImage(model = state.netboxPhotoUri, contentScale = ContentScale.Crop, fillMaxSize)`
   - Inline retake × — `Box(align = TopEnd, padding = 12.dp, size = 36.dp, clip CircleShape, background = Color.Black @ 50%, clickable { onRetake() })` with white `Text("✕", 16.sp)`
4. `Spacer(12.dp)`
5. Retake text link: `Text(WiomLabels.pick("फिर से लें", "Retake"), 14.sp, SemiBold, WiomColors.brandPrimary, clickable { onRetake() })`
6. `WizardCtaBar` → `WiomButton(type = Primary, label = WiomLabels.pick("आगे बढ़ें", "Continue"), onClick = { navController.navigate("s20") })`

Retake logic: `state.netboxPhotoUri = null; navController.popBackStack()` → returns to S18 which then shows a fresh camera since `netboxPhotoUri == null`.

**Labels (inline):**
- Title: `WiomLabels.pick("नेट बॉक्स फोटो", "NetBox photo")`
- Retake: `WiomLabels.pick("फिर से लें", "Retake")`
- Continue: `WiomLabels.pick("आगे बढ़ें", "Continue")`

---

### 3.17 S20 — 3-Pin Check (side-by-side cards)

**Purpose.** Audio briefing + acknowledgement before the 3-pin plug photo. Shows **side-by-side सही / गलत 3-pin plug examples**.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s19 `NetboxPhotoReview` | s21 `ThreepinCamera` via checkbox tick |

**Implementation:** `TimerAudioCheckScreen` with:
- `title = WiomLabels.pick("3-पिन प्लग लगाया है?", "Is the 3-pin plug installed?")`
- `audioResId = R.raw.threepin_instructions` (2.928s actual — the 2500ms buffer still reveals checkbox at ~4.5s)
- `correctImage = R.drawable.threepin_correct`
- `incorrectImage = R.drawable.threepin_incorrect`
- `checkboxLabel = WiomLabels.pick("3-पिन प्लग सही से लगा दिया है", "3-pin plug has been installed correctly")`
- `onChecked = { navController.navigate("s21") }`

**Labels (inline):**
- Title: `WiomLabels.pick("3-पिन प्लग लगाया है?", "Is the 3-pin plug installed?")`
- Checkbox: `WiomLabels.pick("3-पिन प्लग सही से लगा दिया है", "3-pin plug has been installed correctly")`

---

### 3.18 S21 — 3-Pin Camera

**Purpose.** Full-bleed capture of the 3-pin plug. Shared `PhotoCaptureScreen` with no overlay.

**Implementation:**
```kotlin
PhotoCaptureScreen(
  title = WiomLabels.pick("3-पिन प्लग की फोटो लें", "Take a photo of the 3-pin plug"),
  ctaLabel = WiomLabels.pick("फोटो लें", "Take photo"),
  overlay = CameraOverlay.None,
  onCaptured = { uri -> state.threepinPhotoUri = uri; navController.navigate("s22") }
)
```

---

### 3.19 S22 — 3-Pin Photo Review

Same layout as S19 NetBox Photo Review, but against `state.threepinPhotoUri`. Retake → `state.threepinPhotoUri = null; popBackStack()`. Continue → `navController.navigate("s23")`.

Title: `WiomLabels.pick("3-पिन प्लग फोटो", "3-pin plug photo")`.

---

### 3.20 S23 — Wiring Check (side-by-side cards)

**Purpose.** Audio briefing + acknowledgement before the wiring photo. Shows **side-by-side सही / गलत wiring examples**.

**Implementation:** `TimerAudioCheckScreen` with:
- `title = WiomLabels.pick("वायरिंग सही तरीके से की है?", "Is the wiring done correctly?")`
- `audioResId = R.raw.wiring_instructions` (12.288s — longest audio in flow)
- `correctImage = R.drawable.wiring_correct`
- `incorrectImage = R.drawable.wiring_incorrect`
- `checkboxLabel = WiomLabels.pick("वायरिंग सही तरीके से की गयी है", "Wiring has been done correctly")`
- `onChecked = { navController.navigate("s24") }`

**Labels (inline):**
- Title: `WiomLabels.pick("वायरिंग सही तरीके से की है?", "Is the wiring done correctly?")`
- Checkbox: `WiomLabels.pick("वायरिंग सही तरीके से की गयी है", "Wiring has been done correctly")`

---

### 3.21 S24 — Wiring Camera

**Purpose.** Full-bleed capture of the wiring **and** NetBox in one shot. `PhotoCaptureScreen`:
```kotlin
PhotoCaptureScreen(
  title = WiomLabels.pick("वायरिंग की फोटो लें", "Take a photo of the wiring"),
  ctaLabel = WiomLabels.pick("वायरिंग + नेट बॉक्स की फोटो लें", "Take a photo of wiring + NetBox"),
  overlay = CameraOverlay.None,
  onCaptured = { uri -> state.wiringPhotoUri = uri; navController.navigate("s25") }
)
```

The CTA label explicitly asks for both subjects in one wide shot — this is deliberate (one composite photo proves wiring integrity AND plug location in a single frame).

---

### 3.22 S25 — Wiring Photo Review

Same layout as S19 / S22 review screens, against `state.wiringPhotoUri`. Retake → clear URI + `popBackStack()`. Continue → `navController.navigate("s26")`.

Title: `WiomLabels.pick("वायरिंग फोटो", "Wiring photo")`.

---

### 3.23 S26 — Provisioning Loading

**Purpose.** Cosmetic "please wait" screen while the NetBox is being provisioned. Shows a large green spinner inside a `successBg` circle with the message "नेट बॉक्स तैयार किया जा रहा है...". **Auto-advances after exactly 3000ms.**

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s25 `WiringPhotoReview` | s27 `ProvisioningSuccess` at t=3000ms auto-advance |

**Layout.** **No `WizardTopBar`** — centered content only. Outer Column MUST apply `.statusBarsPadding()`:

```kotlin
Column(
  modifier = Modifier
    .fillMaxSize()
    .statusBarsPadding()             // <-- REQUIRED
    .background(WiomColors.bgPrimary),
  horizontalAlignment = Alignment.CenterHorizontally,
  verticalArrangement = Arrangement.Center
) {
  Box(
    modifier = Modifier.size(96.dp).clip(CircleShape).background(WiomColors.successBg),
    contentAlignment = Alignment.Center
  ) {
    CircularProgressIndicator(
      modifier = Modifier.size(48.dp),
      color = WiomColors.success,
      strokeWidth = 4.dp
    )
  }
  Spacer(Modifier.height(24.dp))
  Text(
    WiomLabels.pick("नेट बॉक्स तैयार किया जा रहा है...", "NetBox is being prepared..."),
    fontSize = 18.sp,
    fontWeight = FontWeight.SemiBold,
    color = WiomColors.textPrimary
  )
}

LaunchedEffect(Unit) {
  delay(3000)
  navController.navigate("s27")
}
```

**Labels (inline):**
- Message: `WiomLabels.pick("नेट बॉक्स तैयार किया जा रहा है...", "NetBox is being prepared...")`

---

### 3.24 S27 — Provisioning Success

**Purpose.** Brief celebratory checkpoint between the loading screen and the optical-power check. Large green checkmark + success message + primary CTA to advance.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s26 `ProvisioningLoading` auto-advance | s28 `OpticalPower` via Primary CTA |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, horizontalAlignment = Center, verticalArrangement = Center)`
3. **Success circle** — `Box(96.dp, CircleShape, background = WiomColors.successBg)` with `Text("✓", 48.sp, Bold, WiomColors.success)`
4. `Spacer(24.dp)`
5. **Title** — `Text(WiomLabels.pick("नेट बॉक्स चालू हो गया है", "NetBox is now online"), 24.sp, Bold, WiomColors.textPrimary, textAlign = Center)`
6. `WizardCtaBar` → `WiomButton(type = Primary, label = WiomLabels.pick("ऑप्टिकल पॉवर चेक करें", "Check optical power"), onClick = { navController.navigate("s28") })`

**Labels (inline):**
- Title: `WiomLabels.pick("नेट बॉक्स चालू हो गया है", "NetBox is now online")`
- CTA: `WiomLabels.pick("ऑप्टिकल पॉवर चेक करें", "Check optical power")`

---

### 3.25 S28 — Optical Power

**Purpose.** Automated optical-power measurement with 3 distinct phases: CHECKING → IN_RANGE or OUT_OF_RANGE. The v2.1.1 implementation is still a scripted animation (hardcoded target values with a 3rd-check recovery for the failure sim); real polling via router SSH/backend API is deferred to a later PR.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s27 `ProvisioningSuccess` via Primary CTA | s29 `SpeedTest` only from IN_RANGE phase |
| — | self-loop on OUT_OF_RANGE retry |

**Phase 1 — CHECKING:**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, horizontalAlignment = Center, verticalArrangement = Center)`
3. **Power circle** — `Box(120.dp, CircleShape, background = WiomColors.bgSecondary)` with `Text("${currentPower} dB", 32.sp, Bold, textPrimary)`
4. `Spacer(16.dp)`
5. Subtitle: `Text(WiomLabels.pick("ऑप्टिकल पॉवर चेक की जा रही है", "Checking optical power"), 16.sp, SemiBold, textSecondary, textAlign = Center)`
6. `Spacer(24.dp)`
7. `CircularProgressIndicator(24.dp, WiomColors.brandPrimary)`

Counter animation:
```kotlin
LaunchedEffect(checkKey) {
  phase = "CHECKING"
  val target = abs(effectiveTarget)
  repeat(target) {
    delay(150)
    currentPower = -(it + 1)
  }
  phase = if (effectiveTarget in -25..-8) "IN_RANGE" else "OUT_OF_RANGE"
  if (phase == "OUT_OF_RANGE") checkCount++
}
```

**Phase 2 — IN_RANGE:**
- **Power circle** — `Box(120.dp, CircleShape, background = WiomColors.successBg)` with `Text("${currentPower} dB", 32.sp, Bold, WiomColors.success)`
- Subtitle: `Text(WiomLabels.pick("ऑप्टिकल पॉवर सही है", "Optical power is correct"), 16.sp, SemiBold, WiomColors.success, textAlign = Center)`
- `WizardCtaBar` → `WiomButton(type = Primary, label = WiomLabels.pick("अब नेट स्पीड चेक करें", "Now check net speed"), onClick = { navController.navigate("s29") })`

**Phase 3 — OUT_OF_RANGE:**
1. Error headline — `Text(errorHeadline, 24.sp, Bold, textPrimary, lineHeight = 32.sp)`:
   - 1st failure: `"अरे नहीं ! ऑप्टिकल पॉवर सही नहीं आ रही है!"` / `"Oh no! Optical power is not correct!"`
   - 2nd+: adds `"अभी भी"` → `"अरे नहीं ! ऑप्टिकल पॉवर अभी भी सही नहीं आ रही है!"` / `"Oh no! Optical power is still not correct!"`
2. `Spacer(20.dp)`
3. **Error power circle** — `Box(96.dp, CircleShape, background = WiomColors.errorBg)` with `Text("${currentPower} dBm", 24.sp, Bold, WiomColors.error)`
4. `Spacer(12.dp)`
5. Range hint: `Text(WiomLabels.pick("ऑप्टिकल पॉवर -8 dBm से -25 dBm के बीच होनी चाहिए", "Optical power must be between -8 dBm and -25 dBm"), 16.sp, textSecondary, textAlign = Center)`
6. `Spacer(24.dp)`
7. Checklist header: `Text(WiomLabels.pick("नीचे बताई गई चीजें चेक करें:", "Check the following:"), 20.sp, Bold, textPrimary)`
8. **Checklist card** — `Column(clip 12.dp, background = WiomColors.bgSecondary, padding = 16.dp, Arrangement.spacedBy(12.dp))`:
   - `Text(WiomLabels.pick("• कनेक्शन primary splitter से कनेक्टेड नहीं होना चाहिए", "• Connection must not be connected to primary splitter"), 16.sp, lineHeight = 22.sp, textPrimary)`
   - `Text(WiomLabels.pick("• कनेक्शन 1/2 या 1/4 के splitter से कनेक्टेड नहीं होना चाहिए", "• Connection must not be connected to 1/2 or 1/4 splitter"), 16.sp, lineHeight = 22.sp, textPrimary)`
9. `Spacer(16.dp)`
10. Blocking message: `Text(WiomLabels.pick("अब आप ऑप्टिकल पॉवर के बाहर इंस्टालेशन नहीं कर सकते", "You cannot install outside optical power range"), 16.sp, Bold, WiomColors.error, textAlign = Center)`
11. **Escalation CTA** (conditional, `checkCount >= 2`) — `WiomButton(type = Secondary, label = WiomLabels.pick("ऑफिस कॉल करके मदद लें", "Call office for help"), onClick = { /* stub — real escalation deferred */ })`
12. **Retry CTA** (always on OOR) — `WiomButton(type = Primary, label = WiomLabels.pick("ऑप्टिकल पॉवर दोबारा चेक करें", "Check optical power again"), onClick = { checkKey++ })`

**Labels (inline):** all the phase-specific strings above.

---

### 3.26 S29 — Speed Test

**Purpose.** Animated speed measurement using a Lottie speedometer (`speedmeter.json`). The numeric speed is derived from the Lottie progress (`progress * 89`), ending at a fixed 89 Mbps. After animation completes, the screen auto-advances to `s30 RechargeInfoAudio`.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s28 `OpticalPower` IN_RANGE | s30 `RechargeInfoAudio` auto-advance after animation completes |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, horizontalAlignment = Center, verticalArrangement = Center)`
3. **Lottie** — `LottieAnimation(composition, progress, modifier = Modifier.size(240.dp))`. Fallback: `Box(240.dp, CircleShape, background = WiomColors.bgSecondary)` with `Text("⚡", 80.sp)`
4. `Spacer(24.dp)`
5. **Speed text** — `Text(speedText, 48.sp, Bold, speedColor, textAlign = Center)`
   - `speedText = "${(progress * 89).toInt()} Mbps"` during animation, then `"89 Mbps"` after
   - `speedColor = if (speed >= 80) WiomColors.success else WiomColors.textPrimary`
6. No CTA — auto-advances 1 second after animation completes via `LaunchedEffect(animationDone) { if (animationDone) { delay(1000); navController.navigate("s30") } }`

See §Deferred items for the `SpeedConfirmBottomSheet` "Looks good / Re-run" sheet that was part of the reference repo but is **not built in v2.1.1** — S29 just auto-advances on completion.

**Labels (inline):**
- Unit: `WiomLabels.pick("Mbps", "Mbps")` (no translation needed but kept for consistency)

---

### 3.27 S30 — Recharge Info Audio

**Purpose.** Fourth and final audio briefing. Informs the agent that the customer has 2 days of free net before they need to recharge, and that recharge is the customer's choice.

**Uses a Tertiary "समझ गया" / "Got it" link CTA** — same pattern as S15.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s29 `SpeedTest` auto-advance | s31 `HappyCodePrompt` via Tertiary CTA |

**Layout.** Same left-aligned audio-briefing pattern as S15:
- `WizardTopBar(title = "रिचार्ज जानकारी" / "Recharge Info", onClose = { showExitDialog = true })`
- Audio: `R.raw.recharge_info`, `audioDurationMs = 10300L`, `bufferMs = 700L`
- Title: `WiomLabels.pick("अब कस्टमर अगले 2 दिन तक नेट का इस्तमाल कर सकते हैं", "Customer can use net for the next 2 days")`
- Subtitle: `WiomLabels.pick("इसके बाद रिचार्ज कस्टमर अपनी मर्ज़ी से करता है", "After that, recharge is customer's choice")`
- CTA: **Tertiary** `WiomButton(type = Tertiary, label = WiomLabels.pick("समझ गया", "Got it"), onClick = { navController.navigate("s31") })`

**Labels (inline):**
- Title: `WiomLabels.pick("अब कस्टमर अगले 2 दिन तक नेट का इस्तमाल कर सकते हैं", "Customer can use net for the next 2 days")`
- Subtitle: `WiomLabels.pick("इसके बाद रिचार्ज कस्टमर अपनी मर्ज़ी से करता है", "After that, recharge is customer's choice")`
- CTA: `WiomLabels.pick("समझ गया", "Got it")`

---

### 3.28 S31 — Happy Code Prompt

**Purpose.** Hand-off pause. Shows a celebratory illustration and a clear instruction asking the agent to get a 4-digit Happy Code from the customer's Wiom app.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s30 `RechargeInfoAudio` via Tertiary CTA | s32 `HappyCodeOtp` via Primary CTA |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, horizontalAlignment = Center, verticalArrangement = Center)`
3. **Illustration** — `Box(size = 240.dp, clip RoundedCornerShape(24.dp), background = WiomColors.brandPrimaryLight, contentAlignment = Center)` with `Image(painterResource(R.drawable.happy_code_illust), ...)`
4. `Spacer(24.dp)`
5. Title: `Text(WiomLabels.pick("कस्टमर से हैप्पी कोड लें", "Get happy code from customer"), 24.sp, Bold, textPrimary, textAlign = Center)`
6. `Spacer(8.dp)`
7. Subtitle: `Text(WiomLabels.pick("कस्टमर के व्योम ऐप में 4 अंकों का कोड है", "Customer has a 4-digit code in their Wiom app"), 16.sp, textSecondary, textAlign = Center)`
8. `WizardCtaBar` → `WiomButton(type = Primary, label = WiomLabels.pick("हैप्पी कोड डालें", "Enter happy code"), onClick = { navController.navigate("s32") })`

**Labels (inline):**
- Title: `WiomLabels.pick("कस्टमर से हैप्पी कोड लें", "Get happy code from customer")`
- Subtitle: `WiomLabels.pick("कस्टमर के व्योम ऐप में 4 अंकों का कोड है", "Customer has a 4-digit code in their Wiom app")`
- CTA: `WiomLabels.pick("हैप्पी कोड डालें", "Enter happy code")`

---

### 3.29 S32 — Happy Code OTP (last visible screen)

**Purpose.** Customer enters a 4-digit OTP via a custom on-screen numeric keypad. Auto-advances 500ms after the 4th digit is entered. This is the **last visible screen** in the wizard — there is no Lottery celebration; on completion, the host invokes `HomeViewModel.onInstallSubmitted(taskId)` and pops the graph.

**Enters from / exits to.**
| Enters from | Exits to |
|---|---|
| s31 `HappyCodePrompt` via Primary CTA | **Home** (via host `onInstallationComplete(taskId)`) 500ms after 4th digit |

**Layout.**
1. `WizardTopBar(title = "" / "", onClose = { showExitDialog = true })`
2. `Column(weight = 1f, padding = 16.dp, horizontalAlignment = Center)`
3. `Spacer(40.dp)`
4. Title: `Text(WiomLabels.pick("हैप्पी कोड डालें", "Enter happy code"), 24.sp, Bold, textPrimary)`
5. `Spacer(32.dp)`
6. **4 OTP boxes** — `Row(Arrangement.spacedBy(16.dp))`: `repeat(4) { index -> Box(size = 56.dp, clip RoundedCornerShape(12.dp), border = 2.dp (filled: brandPrimary; empty: borderDefault), background = bgPrimary) { if (filled) Text(digit, 28.sp, Bold, textPrimary) } }`
7. `Spacer(8.dp)`
8. **Hint pill** — `Box(clip RoundedCornerShape(8.dp), background = WizardColors.HappyCodeHintBg (#F9DFEE), padding horizontal = 16.dp, vertical = 8.dp)` with `Text(WiomLabels.pick("कस्टमर के ऐप में कोड मिलेगा", "You'll find the code in customer's app"), 12.sp, SemiBold, WiomColors.brandPrimary)`
9. **Keypad container** — `Column(fillMaxWidth, background = WiomColors.brandSecondary, padding = 16.dp, Arrangement.spacedBy(8.dp))`:
   - Row 1: `NumpadKey("1") NumpadKey("2") NumpadKey("3")` (each `weight = 1f`, 52.dp tall, 12.dp corners, `Color.White @ 15% alpha` bg, 24.sp Bold white digit)
   - Row 2: `NumpadKey("4") NumpadKey("5") NumpadKey("6")`
   - Row 3: `NumpadKey("7") NumpadKey("8") NumpadKey("9")`
   - Row 4:
     - Backspace: `Box(weight = 1f, height = 52.dp, clip 12.dp, background = WizardColors.KeypadBackspaceBg (#FFD3CC), clickable { if (happyCode.isNotEmpty()) onCodeChange(happyCode.dropLast(1)) })` with `Text("⌫", 24.sp, color = WizardColors.KeypadBackspaceIcon (#E01E00))`
     - `NumpadKey("0")`
     - `Spacer(weight = 1f)` — empty bottom-right cell

**Auto-complete on 4th digit:**
```kotlin
LaunchedEffect(happyCode) {
  if (happyCode.length == 4) {
    delay(500)
    val taskId = backStackEntry.arguments?.getString("taskId") ?: return@LaunchedEffect
    onInstallationComplete(taskId)
  }
}
```

`onInstallationComplete(taskId)` is the graph host callback (wired in `AppNavGraph.installationRedesignNavGraph`). The host invokes `HomeViewModel.onInstallSubmitted(taskId)` which:
1. Morphs the install card state: `SCHEDULED → INSTALL_SUBMITTED`
2. Sets `reasonTimerDisplay = "व्योम जाँच रहा है"` (hi) / `"Wiom is verifying"` (en) via `pick()`
3. Emits the toast `toast.install_submitted`: `"सेटअप सबमिट हो गया — व्योम जाँच रहा है"` / `"Setup submitted — Wiom is verifying"`
4. Pops the install graph via `navController.popBackStack("installation_redesign_graph/...", inclusive = true)`

Re-tapping the same task on Home now opens the `INSTALL_SUBMITTED` drilldown banner (already specced in the Home install drilldown v1.5.1) instead of re-entering the wizard.

**Labels (inline):**
- Title: `WiomLabels.pick("हैप्पी कोड डालें", "Enter happy code")`
- Hint: `WiomLabels.pick("कस्टमर के ऐप में कोड मिलेगा", "You'll find the code in customer's app")`

**Label key** (keyed, not inline — the only new JSON key for this release):
- `toast.install_submitted` in `home_labels_hi_en.json`:
  ```json
  "toast.install_submitted": {
    "hi": "सेटअप सबमिट हो गया — व्योम जाँच रहा है",
    "en": "Setup submitted — Wiom is verifying"
  }
  ```

---

### 3.30 Overlays

Three overlay composables are rendered over the current screen, not as screens themselves. They don't consume route slots in the flow.

#### Overlay A — `ExitDialog`

Specced in full at §2.5. Triggered by `showExitDialog = true` on any screen whose `WizardTopBar.onClose` is tapped, and by S03 `BackHandler { onClose() }`. Hosted locally on each screen that needs it (not globally).

#### Overlay B — `WifiConnectDialog`

Specced in §3.13 S16 ISP Form. Rendered when `showWifiDialog == true` inside `S16IspFormScreen`. Not a reusable dialog — it's local to S16.

#### Overlay C — `CustomerDetailsSheet`

A bottom sheet (`ModalBottomSheet`) surfacing the full customer record (name, mobile, address, plan details, family number, notes). Used on screens that need a quick reference to customer info without navigating away — primarily S04 Transfer Info and S11 Customer Details. Sheet layout:
- Drag handle row
- Customer name (18.sp Bold)
- Address paragraph (14.sp textSecondary lineHeight 20)
- Mobile row with call button
- Plan details row
- "Close" button at bottom (Secondary)

Triggered by a tappable "i" info affordance on the customer card in S04 / S11. Not part of the 31-route flow graph.

---

## 4. Navigation contract

**Entry:**
```kotlin
navController.navigate(
  installationRedesignGraphRoute(taskId, customerMobile, bookingPaid)
)
```
Called from the SCHEDULED task drilldown CTA in `feature/home/ui/drilldowns/install/`.

**Graph route:**
```
installation_redesign_graph/{taskId}/{customerMobile}/{bookingPaid}
```

**Start destination:** `RedesignScreen.Entry` (the 1-frame resume router, see §1.2).

**Exit callback:** `onInstallationComplete(taskId: String)` — invoked from S32 after the 4-digit Happy Code completes. Host wires this to `HomeViewModel.onInstallSubmitted(taskId)` in `AppNavGraph.installationRedesignNavGraph`.

**Back callback:** `onBack()` — invoked from `ExitDialog` when the agent confirms exit. Host pops the install graph back to Home.

**Per-screen composable signature:**
```kotlin
composable("s<N>") { backStackEntry ->
  val vm = rememberWizardVm(backStackEntry)   // scoped to parent graph entry
  LaunchedEffect("s<N>") { vm.onNavigate("s<N>") }   // persists resume state
  S<N>Screen(
    state = vm.state.collectAsState().value,
    onNext = { navController.navigate(nextAfter("s<N>")) },
    onBack = { navController.popBackStack() },
    onExit = { /* sets showExitDialog = true locally */ }
  )
}
```

---

## 5. Component registry

New shared wizard components added to `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/components/`:

| Component | Purpose | File |
|---|---|---|
| `WizardTopBar` | Shared top bar: title + close × + help link. No step counter. | `components/WizardTopBar.kt` |
| `WizardCtaBar` | Bottom CTA wrapper with `navigationBarsPadding()` + 16.dp horizontal padding + 12.dp vertical spacing between children | `components/WizardCtaBar.kt` |
| `TimerAudioCheckScreen` | Shared scaffold for S17 / S20 / S23 — audio briefing + side-by-side comparison cards + checkbox reveal | `components/TimerAudioCheckScreen.kt` |
| `ComparisonCard` | Single side-by-side comparison card (सही or गलत) — illustration + badge + colored border | `components/ComparisonCard.kt` |
| `PhotoCaptureScreen` | Shared full-bleed CameraX capture surface with optional `AadhaarCard` dashed overlay | `camera/PhotoCaptureScreen.kt` |
| `ExitDialog` | Global exit confirmation with reversed CTA polarity (primary = stay, secondary = exit) | `dialogs/ExitDialog.kt` |
| `FlowViewModel` | Graph-scoped ViewModel for per-task resume state (SharedPreferences-backed) | `viewmodel/FlowViewModel.kt` |
| `rememberWizardVm` | Helper that returns the parent-graph-scoped `FlowViewModel` instance and fires `onNavigate` in a `LaunchedEffect` | `navigation/RedesignNavGraph.kt` (helper) |

Deleted/collapsed during the port:
- The reference repo's `WiomCta.kt` wrapper → replaced by `core/common/ui/WiomButton.kt` (single component, three types)
- The reference repo's `WiomHeader.kt` → replaced by `WizardTopBar.kt`
- Separate `AadhaarCameraStep.kt` + `AadhaarReviewStep.kt` → collapsed to `S08AadhaarScreen.kt` with the 3-state FSM (§3.6)

---

## 6. Label keys added

Only **one** new JSON label key in this release — everything else is inline `WiomLabels.pick(hi, en)` at the call site. Added to `app/src/main/assets/home_labels_hi_en.json`:

```json
"toast.install_submitted": {
  "hi": "सेटअप सबमिट हो गया — व्योम जाँच रहा है",
  "en": "Setup submitted — Wiom is verifying"
}
```

Used by `HomeViewModel.onInstallSubmitted()` after S32 completes (see §3.29).

**Why inline pick() instead of keyed JSON:** the wizard strings are screen-local, never reused outside the wizard, and not at risk of cross-bundle label collisions (see `feedback_cross_module_label_collision.md` for the collision pattern). Going inline means a reviewer can see the Hindi + English copy side-by-side in the composable source, which is more auditable than chasing keys into a flat JSON.

**Preflight exemption:** `app/build.gradle.kts` preflight task exempts `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/` from the hardcoded-Hindi regex check (the regex can't distinguish literal strings inside `pick()` args from untranslated strings). Code review catches any bare `Text("हिंदी")` calls.

---

## 7. Dependencies

`feature/installation/build.gradle.kts` additions for v2.1.1:

```kotlin
// Guava (Android variant) — CameraX's ProcessCameraProvider.getInstance()
// returns a ListenableFuture<T> whose .addListener() is unavailable without
// the real guava symbols (the listenablefuture stub shim is metadata-only).
implementation("com.google.guava:guava:31.1-android")
```

CameraX 1.4.1, Lottie Compose 6.3.0, ExifInterface 1.3.7 were already referenced in `gradle/libs.versions.toml` from the earlier scaffold pass — no version bumps in v2.1.1.

---

## 8. Debug affordances (dev-only)

Two debug affordances ship in mock-flavor builds only (wire-gated on `BuildConfig.DEBUG`). They do not affect production builds.

1. **🐛 Debug bypass on LoginScreen.** A bug-icon clickable in the bottom-left corner. Calls `AuthViewModel.debugMockLogin()` which sets a mock session token via `SessionManager` and flips the auth state to Verified. Jumps straight to Home without OTP.
2. **NetBox Wizard Control Panel.** Accessible via `HomeDebugScreen`. Lists all 31 screens with direct-jump shortcuts (tapping `s16` navigates straight to the ISP form with the debug taskId). Includes the "🗑 Reset wizard state" button that calls `prefs.edit().clear()` on `SharedPreferences("wiom_netbox_flow")`, wiping all `resume_screen_<taskId>` and `payg_accepted_<taskId>` entries across all task buckets.

The debug panel uses `taskId = "debug"` as its bucket — debug navigation never leaks into real task resume state.

---

## 9. Preflight check exemptions

`app/build.gradle.kts` preflight task exempts the redesign folder from:

1. **Hardcoded-Hindi regex** — the wizard uses inline `WiomLabels.pick("hi", "en")` instead of keyed JSON lookups. Preflight regex (`Text(".*[अ-ह]`) doesn't distinguish literal Hindi strings inside `pick()` args from untranslated strings, so we exempt the folder and rely on code review.
2. **Raw hex colors** — residual tier-3 palette (keypad bg, backspace icon, hint pill) lives in `theme/WizardColors.kt`. Preflight only scans `*Screen.kt` / `*Content.kt` / `*Drilldown.kt`; `WizardColors.kt` is intentionally outside that scope.

Both exemptions are scoped by absolute path prefix: `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/`. They do not exempt any other feature module.

---

## 10. Deferred items

Items intentionally NOT built in v2.1.1 — captured here so reviewers don't file issues for them:

1. **Speed Confirm Sheet** — The reference repo's S29 post-test confirmation bottom sheet ("Looks good / Re-run") is **not built**. S29 auto-advances on animation completion. Revisit when the real network-quality API replaces the mock `(progress * 89).toInt()` speed.
2. **Edge Case Dialog + Toast** — Infrastructure-only in the upstream reference; no consumers wired in v2.1.1. The failure paths across the wizard (optical OOR escalation, happy-code invalid, provisioning failure, WiFi auto-connect failure) still fall back to inline retry CTAs or navigation pops. Wiring the 14-case `EdgeCaseOverlay` system to real trigger sites is deferred to a later PR.
3. **S29 `SpeedConfirmBottomSheet`** — Same as #1; the Lottie gauge renders but the "Looks good / Re-run" sheet is skipped.
4. **Aadhaar download icon button `onClick` (S11)** — Stub. Real DigiLocker pull / local save via `MediaStore.Images.insertImage()` requires backend scope and is not part of this PR.
5. **S11 Customer Details hardcoded customer name** — "Himanshu Singh" is a mock seed literal. When real task data is wired through parent graph args, this comes from `TaskDetail.customerName` via the `FlowViewModel`. Deferred until the task-data wiring PR.
6. **Aadhaar thumbnail aspect ratio** — Still `height = 120.dp` with no `aspectRatio` modifier. In the full-width Review state (S08 State 3) this crops ~30% of the card. Cosmetic, deferred.
7. **Real CameraX quality check** — No on-device blur/unreadable check for Aadhaar, NetBox, or wiring photos. Agent must eyeball. Would need ML Kit or backend OCR round-trip — out of scope.
8. **Real optical-power measurement** — S28 still runs the scripted 3-phase animation with hardcoded target values. Real polling via SSH or backend API is deferred.
9. **Real speed test** — S29 speed value is hardcoded `progress * 89` → `89 Mbps`. No actual network measurement.
10. **Real ISP credential validation** — S16 Username and Net Box ID validation is a 1500ms simulated delay. Real `NetBoxInventoryRepository.validate*()` API is deferred.
11. **S16 Static IP / DHCP branches** — Only PPPoE fields are rendered. Static IP (IP/subnet/gateway/DNS fields) and DHCP (just Net Box ID) branches are not implemented. Any non-PPPoE customer is currently blocked.
12. **S16 device verification** — The release-01 `RouterConfigScreen` had a full device-verification step (verify router serial against inventory before collecting credentials). This is **absent from v2.1.1 S16** — regression vs release-01 that needs restoring before production cutover.
13. **Restore-flow same-class morph bug** — Unrelated to install flow, still open from an earlier PR.
14. **WizardTopBar "मदद" help link click handler** — Currently a visual affordance only; no modal/WhatsApp/FAQ wiring. Deferred until help-content source is decided.

---

## 11. Migration notes

v2.1.1 supersedes the v2.1 DRAFT as the sole authoritative spec. The DRAFT remains in the repo at `docs/features/install-flow/Install_Flow_Visual_Spec_v2.1_DRAFT.md` for historical context (PC audit trail, reference repo extraction notes) but is not part of the review surface for PRs touching the wizard.

Reviewers reading v2.1.1 for the first time should read it top-to-bottom — the document is self-contained and every surface, component, token, label, navigation rule, and design decision needed to understand the wizard is captured inline.

Reviewers of a PR touching a specific wizard screen should:
1. Find the `§3.X` section for that screen in this document
2. Check the per-surface spec (Layout / States / Labels / Interactions)
3. Check the relevant cross-cutting rules in `§0` (status bar padding, Hindi/English pick(), exit dialog contract)
4. Skim `feature/installation/src/main/java/com/wiom/csp/feature/installation/redesign/screens/` for the mapped `S<N>*.kt` file

The 89+ image/audio/Lottie assets under `feature/installation/src/main/assets/img/` and `feature/installation/src/main/res/raw/` are committed from earlier scaffold passes — they are not new in the v2.1.1 PR.

---

*End of Install_Flow_Visual_Spec_v2.1.1.md.*


