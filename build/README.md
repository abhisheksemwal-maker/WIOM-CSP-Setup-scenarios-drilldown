# Build Instructions — Kotlin Native APK

This document is the complete recipe to produce an installable `.apk` from the Wiom CSP source. It assumes a fresh machine and walks through prereqs, checkout, build, install, and the verification loop used during the design-redesign sessions.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | 17 (Temurin / Zulu) | `java -version` must print `17.x` |
| Android SDK | Platform 34, build-tools 34.0.0 | Install via Android Studio or `sdkmanager` |
| Android Gradle Plugin | 8.2+ | Pinned in `gradle/libs.versions.toml` |
| Kotlin | 1.9.x | Pinned in `gradle/libs.versions.toml` |
| Gradle wrapper | Bundled in repo (`./gradlew`) | Do not install gradle globally |
| Git | Any modern version | Windows: Git for Windows (Git Bash) |
| adb | Platform-tools | Typically at `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe` |

### Environment variables (Windows)

```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x
ANDROID_HOME=C:\Users\<you>\AppData\Local\Android\Sdk
PATH += %JAVA_HOME%\bin
PATH += %ANDROID_HOME%\platform-tools
```

### Device

A physical Android phone with USB debugging enabled, or an emulator image running API 30+.

---

## 2. Checkout

```bash
git clone https://github.com/wiom-tech/wiom-csp-app-apr09.git
cd wiom-csp-app-apr09
git checkout release-01
```

`release-01` is the base branch PRs merge into. There is no `main` on the remote. For the Pratibimb redesign work, cut a new branch from `release-01`:

```bash
git checkout -b redesign/pratibimb-install-drilldown release-01
```

Push the redesign work to this branch and open a PR against `release-01` for approval.

---

## 3. Product flavors

The `app` module has three product flavors defined in `app/build.gradle.kts`, all sharing one environment dimension:

| Flavor | applicationId | Purpose |
|---|---|---|
| `staging` | `com.wiom.csp.staging` | QA gateway, real backend, `Wiom CSP 04-14` app name |
| `prod` | `com.wiom.csp` | Production gateway |
| `mock` | `com.wiom.csp.staging` | Same package as staging, mock data via `BuildConfig.ENVIRONMENT == "mock"` |

The install drilldown redesign that landed in v1.5.1 is **the single baseline** for all flavors — there is no runtime token fork, no separate redesign flavor, no parallel APK.

---

## 4. Build the staging APK

```bash
./gradlew :app:assembleStagingDebug
```

Output path:
```
app/build/outputs/apk/staging/debug/app-staging-debug.apk
```

---

## 5. Install

```bash
adb install -r app/build/outputs/apk/staging/debug/app-staging-debug.apk
```

The `-r` flag replaces an existing install of the same flavor without uninstalling first.

### Launch the app

```bash
adb shell am force-stop com.wiom.csp.staging
adb shell monkey -p com.wiom.csp.staging -c android.intent.category.LAUNCHER 1
```

---

## 6. Verify a drilldown (no-screenshots protocol)

Source code may not match the APK if you forgot to rebuild. Always verify against the device, but **use `uiautomator dump` instead of screenshots** — screenshots burn image tokens in AI coding sessions and should only be used as a last resort for visual-only questions.

### The verify recipe

```bash
# 1. Navigate to the desired drilldown (manually on device)
# 2. Dump the current view tree
adb exec-out uiautomator dump /dev/tty > /tmp/ui.xml

# 3. Grep for the copy you expect to see
grep -o 'text="[^"]*"' /tmp/ui.xml | grep -E 'सबमिट|वेरिफाई|वेरिफिकेशन'
```

If the text matches your source edits, the APK is correct. If not, you likely forgot to rebuild + reinstall.

---

## 7. Label bundle system (WiomLabels)

Strings live in JSON bundles under `app/src/main/assets/*_hi_en.json`. At app startup `WiomLabels.init()` flat-merges every bundle in alphabetical filename order into one map — **last writer wins on key collision.**

Known collisions that are fixed in this release:
- `drilldown.location_section` (install vs restore)
- `drilldown.executor_section` (install vs restore)
- `executor.title` — resolved by renaming install side to `executor.install.title`
- `cta.call_customer` (install vs restore)

See [`/data/collision-map.md`](../data/collision-map.md) for the full list and the anti-pattern write-up.

When adding a new label: grep **all** `*_hi_en.json` files for the key first, or add a module prefix (`install.*`, `restore.*`, `netbox.*`).

---

## 8. Known gotchas

| Gotcha | Fix |
|---|---|
| Device shows old copy after rebuild | `adb shell am force-stop` before relaunching |
| `[cta.xxx]` appears literally | Key missing from JSON — add it to the appropriate bundle |
| State won't advance in mock | Check `MockTaskRepository.buildTaskFeed()` filters |
| Two states look identical | Check `InstallStateBanner.bannerVariantFor()` — may have missing branch |
| Emoji in functional button | Disallowed — use Material Icons (see Mr UX gate) |

---

## 9. Mr UX gate (pre-build hook)

Before **every** APK build, the Mr UX gate runs a screen-by-screen UX evaluation: goal, expectation, delivery, friction, copy. If any fails, don't build. Documented in `feedback_mr_ux_gate.md` in the user's memory.

The short version:
- Every CTA has a goal → test it against the state
- Every copy line passes the Hindi anchors rules (see [`/ux-copy/hindi-anchors.md`](../ux-copy/hindi-anchors.md))
- Every Destructive CTA survives the reversibility test (see [`/specs/ai-spec.md`](../specs/ai-spec.md))
- No emojis in buttons

---

## 10. Clean build

If you see stale resources or weird crashes:

```bash
./gradlew clean
rm -rf ~/.gradle/caches/transforms-*
./gradlew :app:assembleStagingDebug
```
