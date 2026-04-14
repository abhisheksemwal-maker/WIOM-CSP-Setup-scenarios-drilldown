# WiomLabels System

All user-facing strings in the Wiom CSP app (with a small number of hard-coded exceptions) live in JSON label bundles under `app/src/main/assets/*_hi_en.json`. This file describes the loader, the merge strategy, the anti-patterns, and how to avoid the cross-bundle collision landmine.

---

## Loader

`WiomLabels` is a singleton initialised at app startup (in `WiomCspApplication.onCreate()` or similar). It:

1. Enumerates `assets/*_hi_en.json` in alphabetical filename order
2. Parses each JSON file into a flat `Map<String, LabelPair>`
3. Merges them all into a single flat map using **last-writer-wins** on key collision

```kotlin
// Pseudocode
val merged = mutableMapOf<String, LabelPair>()
for (filename in assets.list("").sorted()) {
    if (filename.endsWith("_hi_en.json")) {
        val bundle = parseJson(filename)
        merged.putAll(bundle)  // ← silent override
    }
}
```

## JSON bundle shape

Each bundle is a flat map of keys → `{ "hi": "...", "en": "..." }`:

```json
{
  "cta.start_installation": { "hi": "सेटअप शुरू करें", "en": "Start setup" },
  "cta.call_customer":       { "hi": "कनेक्शन को कॉल करें", "en": "Call connection" },
  "drilldown.location_section": { "hi": "जगह", "en": "Location" }
}
```

---

## Bundle inventory (approximate)

| File | Ownership | Keys (approx) |
|---|---|---|
| `install_labels_v1.4_hi_en.json` | Install module | ~300 |
| `restore_labels_v1.0_hi_en.json` | Restore module | ~200 |
| `netbox_labels_v1.0_hi_en.json` | NetBox module | ~150 |
| `wallet_labels_v1.0_hi_en.json` | Wallet module | ~180 |
| `home_labels_v1.0_hi_en.json` | Home feed, strip, common | ~250 |
| `common_labels_v1.0_hi_en.json` | Shared CTAs, navigation | ~100 |

Exact filenames may drift — always grep the `assets/` directory for current state.

---

## The cross-bundle collision anti-pattern

**Problem:** Two bundles can silently define the same key with different values. Because merging is alphabetical and `putAll` overwrites, the later filename wins at runtime, but source code reading either bundle looks correct in isolation.

**Real incidents from this session:**

| Key | Install bundle value | Restore bundle value | Winner at runtime | Impact |
|---|---|---|---|---|
| `drilldown.location_section` | `जगह` | `स्थान` | `restore` (alphabetical) | Install drilldown showed `स्थान` despite install bundle specifying `जगह` |
| `drilldown.executor_section` | (different wording) | (different wording) | `restore` | Same pattern |
| `executor.title` | verb: "pick technician" | noun: "technician" | `restore` | Action header became noun |
| `cta.call_customer` | `कनेक्शन को कॉल करें` | `ग्राहक को कॉल करें` | `restore` | Vocab swap lost silently |
| `reason.verifying` | `ग्राहक की पुष्टि बाकी` (install customer verify) | `जाँच हो रही है` (restore system verify) | **opposite semantics** | Still unresolved |

---

## Mitigations

### 1. Module-prefix new keys
When adding a key that could conceivably exist in another module, prefix it:
- `install.executor.title` not `executor.title`
- `restore.reason.verifying` not `reason.verifying`
- `netbox.drilldown.location_section` if needed

### 2. Grep all bundles before edit
Before editing any label key:
```bash
grep -r '"key_name"' app/src/main/assets/
```
If it appears in more than one file, **both must be updated in sync** or one renamed.

### 3. Collision audit
Periodically run:
```bash
# Pseudocode — dedup check
jq -r 'keys[]' app/src/main/assets/*_hi_en.json | sort | uniq -c | awk '$1 > 1'
```
Any key with a count > 1 is a collision risk.

### 4. Consider a typed loader
Longer-term: replace the flat-merge with a namespaced loader that fails fast on collisions (or requires an explicit override declaration). Out of scope for the Pratibimb session but documented here as a refactor target.

---

## Known unresolved collisions

See [`collision-map.md`](collision-map.md) for the current map.

---

## Why not just use Android string resources?

Historical: the Wiom CSP app predates a clean i18n strategy and uses JSON bundles because they were faster to iterate on for copy review. A migration to `strings.xml` with proper `resources/values-hi/` variants would solve collisions at build time but would break the copy-review dashboard workflow. Trade-off accepted for now.
