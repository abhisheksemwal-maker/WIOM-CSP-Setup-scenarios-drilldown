# Label Collision Map

Current-as-of 2026-04-14 snapshot of known cross-bundle label key collisions in the Wiom CSP app. Read [`label-bundles.md`](label-bundles.md) for the anti-pattern explanation first.

---

## Resolved collisions

| Key | Problem | Resolution |
|---|---|---|
| `drilldown.location_section` | install: `जगह`, restore: `स्थान` — restore won silently | Both bundles aligned to `जगह` |
| `drilldown.executor_section` | Different wording in each | Both aligned (see current bundles) |
| `executor.title` | Install needs action verb, restore needs noun — incompatible | Install side renamed to `executor.install.title`. Restore kept `executor.title`. |
| `cta.call_customer` | install: `कनेक्शन को कॉल करें`, restore: `ग्राहक को कॉल करें` | Both aligned to `कनेक्शन` — vocab swap applied globally |

## Unresolved collisions

| Key | Install semantic | Restore semantic | Risk | Proposed fix |
|---|---|---|---|---|
| `reason.verifying` | Customer-side check — `ग्राहक की पुष्टि बाकी` (CSP is waiting on customer to confirm) | System-side check — `जाँच हो रही है` (Vyom is checking) | **High** — semantically opposite; whoever wins breaks the other flow | Split into `install.reason.verifying` and `restore.reason.verifying`, update all readers |

## At-risk but not yet collisional

Keys that exist in one bundle but look "generic enough" that another module might add the same key later:

- `cta.confirm`
- `cta.submit`
- `cta.cancel`
- `status.pending`
- `error.retry`
- `common.ok`
- `common.back`

**Recommendation:** migrate all generic shared keys to a `common_labels_*.json` bundle explicitly, and forbid the same key in per-module bundles.

---

## Detection recipe

To find all collisions right now:

```bash
cd app/src/main/assets
# Extract all keys from every bundle
for f in *_hi_en.json; do
    node -e "const d = require('./$f'); Object.keys(d).forEach(k => console.log('$f ' + k));" 2>/dev/null
done | awk '{print $2}' | sort | uniq -c | awk '$1 > 1 { print $2 }'
```

This lists every key that appears in more than one bundle.

---

## Debug aid: WiomLabels dump

If the loader provides a dump method (check `WiomLabels.kt`), use it in a debug build to see which bundle won each key:

```kotlin
WiomLabels.dumpProvenance()  // if exists; otherwise add it
```

Prints `key → (value, source_filename)` for every merged key. Helpful when you see a surprise value on screen.
