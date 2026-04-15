# Pratibimb PR Validation Harness

A 4-layer validation harness that fences the Wiom CSP install drilldown redesign PR to exactly the scope of this design session. The harness is **advisory** — run it locally against a checkout of the source repo before opening a PR to confirm nothing has drifted and no out-of-scope changes have crept in.

---

## What it checks

| Layer | Purpose | Spec file |
|---|---|---|
| **1 — UX Copy** | JSON bundle key values match design + forbidden patterns (Latin mid-Devanagari, long ी in verify, singular verb for executors, ग्राहक in install domain) | `copy-expected.json`, `copy-rules.json` |
| **2 — DS Tokens** | No raw `Color(0x...)`, no wrong `FontWeight`, no emoji in buttons, required imports + symbols present | `ds-token-rules.json` |
| **3 — Drilldown Spec** | Every install state has a banner `when`-branch; title + subtitle strings match per-state spec; gap states declared | `drilldown-states.json` |
| **4 — Scope Fence** | PR diff only touches files in the allowlist; nothing else | `scope-allowlist.txt` |

See [`../specs/ai-spec.md`](../specs/ai-spec.md) for the design principles behind these checks.

---

## How to run

### Prereqs
- Node.js (any version with `fs`, `path`, `child_process` — so >=12)
- A local checkout of the source repo at a known path
- Optional: `wiom-tech` as a git remote pointing to `wiom-tech/wiom-csp-app-apr09` (for Layer 4 to diff against `release-01`)

### Basic run
```bash
cd /path/to/WIOM-CSP-Setup-scenarios-drilldown/validation
node validator.js /path/to/wiom-csp-app-apr09
```

### Skip Layer 4 (if you're running before pushing to a feature branch)
```bash
node validator.js /path/to/wiom-csp-app-apr09 --no-scope
```

### JSON output (for CI / scripting)
```bash
node validator.js /path/to/wiom-csp-app-apr09 --json > report.json
```

### Exit codes
- `0` — all layers pass
- `1` — one or more layers have errors
- `2` — usage / invalid arg

---

## How to interpret the output

Text output has a summary line per layer, then error + warning detail:

```
=== Pratibimb PR Validation Report ===

Layer 1 — UX Copy         PASS
Layer 2 — DS Tokens       PASS (2w)
Layer 3 — Drilldown Spec  FAIL (1e 0w)
Layer 4 — Scope Fence     PASS

--- Layer 2 — DS Tokens ---
  WARN  [layer2][feature/.../InstallStateBanner.kt] missing import: com.wiom.csp.core.common.theme.WiomRadius
  WARN  [layer2][feature/.../InstallStateBanner.kt] missing import: com.wiom.csp.core.common.theme.WiomSpacing

--- Layer 3 — Drilldown Spec ---
  ERROR [layer3][INS-1053] banner subtitle not found — expected "व्योम जाँच रहा है"

Total: 1 errors, 2 warnings
RESULT: FAIL
```

Warnings don't fail the run but are worth reviewing. Errors fail the run.

---

## When a check fails

1. **Layer 1 value-mismatch** — the copy value in the source differs from what the scenarios-drilldown repo documents. Fix the source or update `copy-expected.json` if intent has changed.
2. **Layer 1 forbidden pattern** — a copy lint rule was violated. Fix the source string. Don't relax the rule unless the user signs off.
3. **Layer 2 raw Color literal** — replace with a `WiomColors.*` token or add the value to `WiomTokens.kt` first.
4. **Layer 3 missing banner branch** — add the `when`-branch in `InstallStateBanner.bannerVariantFor()`.
5. **Layer 4 out-of-scope file** — either remove the change or, if it's legitimately required, add the file to `scope-allowlist.txt` with a comment explaining why.

---

## Extending the harness

To add a new check:

1. **New forbidden copy pattern** — add to `copy-rules.json` under `forbidden_patterns`
2. **New token binding rule for a file** — add to `ds-token-rules.json` under `file_rules`
3. **New drilldown state** — add to `drilldown-states.json` with a unique `INS-*` key
4. **New collision** — add to `collision-expected.json` under `resolved` or `unresolved`
5. **New allowlisted file** — add to `scope-allowlist.txt`

No changes to `validator.js` should be needed for any of the above — it's data-driven.

If you need new check logic, write a new `runLayerN()` function in `validator.js` and call it from the run block at the bottom.

---

## Known limitations

1. **Glob support is basic** — handles `dir/*.kt`, `dir/**`, `dir/**/*.kt`, exact paths. No brace expansion, no `?` wildcard.
2. **Regex scanning is line-by-line** — multi-line Devanagari strings that span a line break would evade some `forbidden_patterns` rules. Keep source strings on single lines.
3. **Unicode-escape detection is a simple fallback** — the banner strings in `InstallStateBanner.kt` are inlined as `\u....` escapes; Layer 3 handles this via `allow_unicode_escape` but the matching is approximate. For a stricter check, migrate the 13 banner strings to JSON bundles (see [`../ux-copy/changelog.md`](../ux-copy/changelog.md) §loose-ends).
4. **Layer 4 requires the source repo to be a git checkout** with either `wiom-tech/release-01` as a remote branch or a clean HEAD to diff against. If neither is available, the layer falls back to a working-tree diff and emits a warning.
5. **No accessibility or a11y checks** yet — colorContrast, touch target size, contentDescription presence are TODO.

---

## Running against the current working tree

For a sanity-check before the feature branch exists:

```bash
cd /path/to/WIOM-CSP-Setup-scenarios-drilldown/validation
node validator.js "/c/Users/Abhishek Semwal/wiom-csp-app-release01-Design" --no-scope
```

The `--no-scope` flag skips Layer 4 (which needs a git diff against an upstream branch). You'll get a full Layer 1/2/3 report that tells you whether the design session state is internally consistent.
