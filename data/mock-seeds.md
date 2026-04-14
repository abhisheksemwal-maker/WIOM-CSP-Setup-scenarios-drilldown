# Mock Seeds Reference

The Wiom CSP app runs off a `MockTaskRepository` in `core/data/src/main/java/com/wiom/csp/core/data/repository/MockTaskRepository.kt` for all design-flavor builds. This file documents the seed set used for the redesign polish.

---

## Top-level shape

```kotlin
@Singleton
class MockTaskRepository @Inject constructor(...) {
    private val tasks = listOf(
        // 13 install task seeds
        INS-1041 AWAITING_SLOT_PROPOSAL,
        INS-1042 AWAITING_CUSTOMER_SELECTION,
        INS-1043 SLOT_CONFIRMED,
        INS-1044 IN_PROGRESS (self, Annu),
        INS-1045 DELEGATED_OVERDUE (Rajesh),
        INS-1046 RESOLVED,
        INS-1047 SCHEDULED (isSlotDay = true),
        INS-1048 NEEDS_RESCHEDULING,
        INS-1049 SCHEDULING_FAILED,
        INS-1050 INSTALL_SUBMITTED,
        INS-1051 DELEGATED_NOT_STARTED (Rajesh),
        INS-1052 DELEGATED_IN_PROGRESS (Sunil),
        INS-1053 VERIFICATION_PENDING,

        // 1 restore seed
        RST-2087,

        // 1 netbox seed
        NBX-301,
    )
}
```

The list is **immutable** — `private val` — so any in-session edits to a task are held in a separate `morphCard`-style map that overlays on top of the seed list at read time. On process restart the mock state resets to these seeds.

---

## Feed filters

`buildTaskFeed()` applies filters before returning tasks to the home screen:

```kotlin
private fun buildTaskFeed(): List<TaskDetail> =
    tasks
        .filter { it.currentState != "SCHEDULING_FAILED" }  // hide from CSP
        // plus HomeDebugConfig filters for taskFeedComposition, taskCount, etc.
```

The `SCHEDULING_FAILED` filter is the feature-level decision to hide INS-1049 from the CSP — the state exists in the mock data and renders correctly if deep-linked, but it never shows up in the feed.

---

## Debug panel knobs (HomeDebugConfig)

Found in `core/data/src/main/java/com/wiom/csp/core/data/repository/DebugConfigs.kt`.

| Knob | Default | Use |
|---|---|---|
| `taskFeedComposition` | `ALL_TYPES` | `ALL_TYPES` / `INSTALL_ONLY` / `RESTORE_ONLY` / `NETBOX_ONLY` / `EMPTY` |
| `taskCount` | **14** | 0 / 1 / 3 / 5 / 10 / **14** — 14 is the default to surface all 12 visible install states + 1 restore + 1 netbox (1049 is hidden by the feed filter) |
| `bannerSeverity` | `WARNING` | `NONE` / `WARNING` / `CRITICAL` / `INFO` |
| `incidentBlock` | `OPEN` | `NONE` / `OPEN` / `RESOLVED` / `MULTIPLE` |

The `taskCount` default was raised from 3 to 10 (then to 14) this session so a fresh debug build surfaces all state variants without having to open the debug panel.

---

## Seed-level fields that matter

For each install task seed:

| Field | What it drives |
|---|---|
| `id` | Card identity, route arg |
| `taskType` | "INSTALL" / "RESTORE" / "NETBOX" — determines which drilldown renders |
| `currentState` | The install enum value — drives `InstallStateBanner.bannerVariantFor()` |
| `deadlineDisplay` | The pill text on the card and in the drilldown header |
| `isSlotDay` | Boolean — flips SCHEDULED banner to the "today" variant |
| `executor` / `executorName` | Present for delegated states; drives the banner's name interpolation |
| `slots` | List of `SlotInfo(status, date, time)` — drives the slot section filter |
| `timelineEvents` | `List<TimelineEventInfo>` — shown in drilldown timeline |
| `location` | Address string for the location section |

---

## How to add a new seed (e.g., for a new state)

1. Add a `TaskDetail(...)` entry to the `tasks` list in `MockTaskRepository.kt`
2. Give it an id in the INS-105x range (next available)
3. Set `currentState` to the exact InstallState enum name
4. If the new state needs a new `InstallStateBanner` variant, add the `when` branch in `bannerVariantFor()`
5. Add a doc file in `/drilldowns/` in this repo
6. Update the table in `/drilldowns/README.md`
7. Rebuild + reinstall + uiautomator dump to verify

---

## Known about mock-seed edits

- Using `replace_all` is safe for transliteration fixes (e.g., `सेटअप submit हुआ` → `सेटअप सबमिट हुआ`) because the strings are unique enough
- The list rebuild happens on process restart only — always `force-stop` before relaunch
- Don't add fields to `TaskDetail` in mock-only branches — the model is shared with the real repo
