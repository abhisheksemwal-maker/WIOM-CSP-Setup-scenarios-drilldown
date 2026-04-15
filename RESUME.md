# Resume Prompt — Continue Session

Copy-paste the block below into a new Claude Code session (Opus 4.6, 1M context recommended) to resume exactly where the last Pratibimb session ended. The prompt self-contains everything a new session needs to load the right context.

---

## The prompt

```
pratibimb

Resume the Wiom CSP install-drilldown redesign from where we left off at end of 2026-04-14.

Context load order:
1. Read C:/Users/Abhishek Semwal/CLAUDE.md (Wiom project context)
2. Read C:/Users/Abhishek Semwal/.claude/projects/C--Users-Abhishek-Semwal/memory/MEMORY.md
3. Clone or pull: https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown
4. Read that repo's /specs/ai-spec.md — this is the operating protocol
5. Read /drilldowns/README.md for the current state-table status
6. Read /ux-copy/changelog.md for the session-wide rules

Current state:
- All 13 install lifecycle states polished to v1.0 in the `redesign` product flavor
- APK builds via: ./gradlew :app:assembleRedesignDebug
- Source repo: wiom-tech/wiom-csp-app-apr09, base branch release-01 (cut feature branches from here; PRs target release-01 for approval)
- Build output: app/build/outputs/apk/redesign/debug/app-redesign-debug.apk
- Parallel install: com.wiom.csp.redesign (side-by-side with com.wiom.csp.staging)

Outstanding loose ends (pick one):
1. Device screenshot verification for INS-1050 / INS-1053 differentiation (highest priority)
2. INS-1051 "rajesh has a space" — unreproduced; needs user clarification on which screen position
3. Migrate 13 inline Unicode-escape banner strings in InstallStateBanner.kt to JSON bundles
4. Restore flow drilldown polish (flagged as highest-impact next surface, especially `reason.customer_denied`)
5. Assurance strip redesign (flagged as next after install)
6. Wallet redesign (deferred)

Rules to apply throughout:
- No screenshots for inspection — use `adb exec-out uiautomator dump /dev/tty` + grep
- No improvisation — if adding new UI, it must trace to spec/product/research, not "the skill lists this pattern"
- Reversibility test before marking any CTA as Destructive
- Mr UX gate before every APK build
- Audit from device first (source may not match APK)
- Grep all *_hi_en.json bundles before editing any label key (cross-bundle collision landmine)

When in doubt, read /specs/ai-spec.md in the scenarios-drilldown repo. It has the full protocol.

First step: confirm you can read CLAUDE.md and the scenarios-drilldown repo. Then ask me what to pick up.
```

---

## Shorter variant (if you want to move fast)

```
pratibimb

Resume Wiom CSP install-drilldown redesign. Read https://github.com/abhisheksemwal-maker/WIOM-CSP-Setup-scenarios-drilldown — specifically /specs/ai-spec.md and /drilldowns/README.md. Then ask me which loose end to pick up.
```

---

## Why this prompt format

- Starts with `pratibimb` to trigger design-mode activation (per CLAUDE.md)
- Explicit read-order so the session loads in the right context
- Anchors to the docs repo which has the current state (not a stale memory)
- Gives the agent 6 outstanding tasks to choose from without dictating order
- Repeats the 6 hard rules in case the ai-spec.md read gets skipped
- Ends with a verification step so you know the agent actually loaded the right context

---

## If you want to start fresh (not resume)

Skip this prompt. Instead, just open a new session and say:

```
pratibimb
```

The session will load Wiom context from CLAUDE.md + MEMORY.md and you can direct it fresh.
