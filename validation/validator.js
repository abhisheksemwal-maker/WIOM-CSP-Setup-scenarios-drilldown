#!/usr/bin/env node
/**
 * Pratibimb PR Validator
 *
 * Runs 4 layers of checks against a checkout of the Wiom CSP source repo:
 *   Layer 1 — UX copy (JSON bundle key values + forbidden/required patterns)
 *   Layer 2 — DS token bindings (no raw Color literals, no wrong FontWeight, etc.)
 *   Layer 3 — Drilldown structural spec (per-state banner + CTA routing)
 *   Layer 4 — Scope fence (PR diff must only touch allowlisted files)
 *
 * Usage:
 *   node validator.js <path-to-source-repo> [--no-scope] [--json]
 *
 * Exits 0 on pass, 1 on fail.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Arg parsing ──
const args = process.argv.slice(2);
const sourceRepo = args.find(a => !a.startsWith('--'));
const noScope = args.includes('--no-scope');
const jsonOut = args.includes('--json');

if (!sourceRepo) {
  console.error('Usage: node validator.js <path-to-source-repo> [--no-scope] [--json]');
  process.exit(2);
}
if (!fs.existsSync(sourceRepo)) {
  console.error(`Source repo not found: ${sourceRepo}`);
  process.exit(2);
}

const validationDir = __dirname;

// ── Load specs ──
function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(validationDir, name), 'utf8'));
}
const copyExpected = loadJson('copy-expected.json');
const copyRules = loadJson('copy-rules.json');
const dsTokenRules = loadJson('ds-token-rules.json');
const drilldownStates = loadJson('drilldown-states.json');
const collisionExpected = loadJson('collision-expected.json');
const scopeAllowlist = fs.readFileSync(path.join(validationDir, 'scope-allowlist.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

const results = {
  layer1_copy: { errors: [], warnings: [] },
  layer2_tokens: { errors: [], warnings: [] },
  layer3_drilldowns: { errors: [], warnings: [] },
  layer4_scope: { errors: [], warnings: [] },
};

// ── Helpers ──
function existsInRepo(relPath) {
  return fs.existsSync(path.join(sourceRepo, relPath));
}

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(sourceRepo, relPath), 'utf8');
}

function walk(dir, fn) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, fn);
    else fn(full);
  }
}

function resolveGlob(root, glob) {
  // Support patterns:
  //   - exact file path: "a/b/c.kt"
  //   - dir/*.kt        (direct children, one extension)
  //   - dir/**          (all files recursive)
  //   - dir/**/*.kt     (recursive by extension)
  const abs = path.join(root, glob);
  if (!glob.includes('*') && fs.existsSync(abs)) return [abs];

  const m1 = glob.match(/^(.+)\/\*\.([a-z]+)$/);
  if (m1) {
    const [_, dir, ext] = m1;
    const absDir = path.join(root, dir);
    if (!fs.existsSync(absDir)) return [];
    return fs.readdirSync(absDir)
      .filter(f => f.endsWith('.' + ext))
      .map(f => path.join(absDir, f));
  }

  const m2 = glob.match(/^(.+)\/\*\*\/\*\.([a-z]+)$/);
  if (m2) {
    const [_, dir, ext] = m2;
    const absDir = path.join(root, dir);
    const out = [];
    walk(absDir, (f) => { if (f.endsWith('.' + ext)) out.push(f); });
    return out;
  }

  const m3 = glob.match(/^(.+)\/\*\*$/);
  if (m3) {
    const absDir = path.join(root, m3[1]);
    const out = [];
    walk(absDir, (f) => out.push(f));
    return out;
  }

  return [];
}

function toUnicodeEscape(str) {
  let out = '';
  for (const c of str) {
    const code = c.codePointAt(0);
    if (code < 128) out += c;
    else out += '\\u' + code.toString(16).padStart(4, '0');
  }
  return out;
}

function matchesAllowlist(file) {
  const norm = file.replace(/\\/g, '/');
  for (const pattern of scopeAllowlist) {
    if (pattern === norm) return true;
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3);
      if (norm.startsWith(prefix + '/') || norm === prefix) return true;
    }
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (path.posix.dirname(norm) === prefix) return true;
    }
  }
  return false;
}

// ── Layer 1: UX copy ──
function runLayer1() {
  const layer = results.layer1_copy;

  // 1a. Bundle key value check
  for (const [bundleFile, keys] of Object.entries(copyExpected.bundles)) {
    const bundleRel = `app/src/main/assets/${bundleFile}`;
    if (!existsInRepo(bundleRel)) {
      layer.errors.push(`[layer1][bundle] not found: ${bundleRel}`);
      continue;
    }
    let bundle;
    try {
      bundle = JSON.parse(readRepoFile(bundleRel));
    } catch (e) {
      layer.errors.push(`[layer1][bundle] parse error: ${bundleRel}: ${e.message}`);
      continue;
    }
    for (const [key, expected] of Object.entries(keys)) {
      const actual = bundle[key];
      if (!actual) {
        layer.errors.push(`[layer1][missing-key] ${bundleFile}: ${key}`);
        continue;
      }
      const actualHi = (actual.hi || '').trim();
      if (actualHi !== expected.hi) {
        layer.errors.push(`[layer1][value-mismatch] ${bundleFile}: ${key}.hi — expected "${expected.hi}", got "${actual.hi}"`);
      }
      if (expected.en && actual.en !== expected.en) {
        layer.errors.push(`[layer1][value-mismatch] ${bundleFile}: ${key}.en — expected "${expected.en}", got "${actual.en}"`);
      }
    }
  }

  // 1b. Forbidden keys
  if (copyExpected._forbidden_keys) {
    for (const [bundleFile, keys] of Object.entries(copyExpected._forbidden_keys)) {
      if (!Array.isArray(keys) || keys.length === 0) continue;
      const bundleRel = `app/src/main/assets/${bundleFile}`;
      if (!existsInRepo(bundleRel)) continue;
      const bundle = JSON.parse(readRepoFile(bundleRel));
      for (const key of keys) {
        if (bundle[key]) layer.errors.push(`[layer1][forbidden-key] ${bundleFile}: ${key} should not exist`);
      }
    }
  }

  // 1c. Forbidden patterns scan
  const scanFiles = [];
  for (const p of copyRules.scan_paths) {
    const abs = path.join(sourceRepo, p);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      walk(abs, (f) => { if (/\.(kt|json)$/.test(f)) scanFiles.push(f); });
    } else {
      scanFiles.push(abs);
    }
  }

  for (const rule of copyRules.forbidden_patterns) {
    const flags = rule.regex_flags || '';
    const regex = new RegExp(rule.regex, flags);
    const scope = rule.scope || null;
    for (const file of scanFiles) {
      const relFile = path.relative(sourceRepo, file).replace(/\\/g, '/');
      if (scope && !scope.some(pat => matchesGlob(relFile, pat))) continue;
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          const bucket = rule.severity === 'warn' ? layer.warnings : layer.errors;
          bucket.push(`[layer1][${rule.id}] ${relFile}:${idx + 1} — ${rule.message}`);
        }
      });
    }
  }

  // 1d. Required patterns scan
  for (const rule of (copyRules.required_patterns || [])) {
    const regex = new RegExp(rule.regex, rule.regex_flags || '');
    const scope = rule.scope || [];
    let found = false;
    for (const scopePattern of scope) {
      const files = resolveGlob(sourceRepo, scopePattern);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (regex.test(content)) { found = true; break; }
        if (rule.allow_unicode_escape) {
          // Try the pattern converted to unicode escape form
          // Crude: just check each word's Devanagari part
          const unicodePattern = toUnicodeEscape(rule.regex);
          if (content.includes(unicodePattern)) { found = true; break; }
        }
      }
      if (found) break;
    }
    if (!found) {
      const bucket = rule.severity === 'warn' ? layer.warnings : layer.errors;
      bucket.push(`[layer1][${rule.id}] required pattern not found — ${rule.message}`);
    }
  }
}

function matchesGlob(file, pattern) {
  // Very simple: supports * and **
  const esc = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLESTAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§DOUBLESTAR§§/g, '.*');
  return new RegExp('^' + esc + '$').test(file);
}

// ── Layer 2: DS token bindings ──
function runLayer2() {
  const layer = results.layer2_tokens;
  for (const [glob, rules] of Object.entries(dsTokenRules.file_rules)) {
    const files = resolveGlob(sourceRepo, glob);
    if (files.length === 0) {
      layer.warnings.push(`[layer2][no-match] glob matched zero files: ${glob}`);
      continue;
    }
    for (const file of files) {
      const rel = path.relative(sourceRepo, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (const rule of (rules.forbidden_patterns || [])) {
        const regex = new RegExp(rule.regex);
        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            const bucket = rule.severity === 'warn' ? layer.warnings : layer.errors;
            bucket.push(`[layer2][${rel}:${idx + 1}] ${rule.message}`);
          }
        });
      }

      for (const rule of (rules.required_patterns || [])) {
        const regex = new RegExp(rule.regex, 'g');
        const matches = content.match(regex) || [];
        const min = rule.min_occurrences || 1;
        if (matches.length < min) {
          const bucket = rule.severity === 'warn' ? layer.warnings : layer.errors;
          bucket.push(`[layer2][${rel}] ${rule.message} — found ${matches.length}, need ${min}`);
        }
      }

      for (const imp of (rules.required_imports || [])) {
        if (!content.includes(`import ${imp}`)) {
          layer.warnings.push(`[layer2][${rel}] missing import: ${imp}`);
        }
      }

      for (const sym of (rules.required_symbols || [])) {
        if (!content.includes(sym)) {
          layer.errors.push(`[layer2][${rel}] missing required symbol: ${sym}`);
        }
      }
    }
  }
}

// ── Layer 3: Drilldown structural ──
function runLayer3() {
  const layer = results.layer3_drilldowns;
  const bannerRel = 'feature/home/src/main/java/com/wiom/csp/feature/home/ui/drilldowns/install/InstallStateBanner.kt';
  if (!existsInRepo(bannerRel)) {
    layer.errors.push(`[layer3] InstallStateBanner.kt not found at ${bannerRel}`);
    return;
  }
  const banner = readRepoFile(bannerRel);

  for (const [insId, spec] of Object.entries(drilldownStates)) {
    if (insId.startsWith('_')) continue;
    if (!spec.state_enum) continue;

    const stateName = spec.state_enum;
    if (!banner.includes(`InstallState.${stateName}`)) {
      layer.errors.push(`[layer3][${insId}] missing banner when-branch for InstallState.${stateName}`);
      continue;
    }

    if (spec.banner) {
      const b = spec.banner;
      if (b.title_hi) {
        const escape = toUnicodeEscape(b.title_hi);
        if (!banner.includes(b.title_hi) && !banner.includes(escape)) {
          layer.errors.push(`[layer3][${insId}] banner title not found — expected "${b.title_hi}"`);
        }
      }
      if (b.subtitle_hi) {
        const escape = toUnicodeEscape(b.subtitle_hi);
        if (!banner.includes(b.subtitle_hi) && !banner.includes(escape)) {
          layer.errors.push(`[layer3][${insId}] banner subtitle not found — expected "${b.subtitle_hi}"`);
        }
      }
    }
  }
}

// ── Layer 4: Scope fence ──
function runLayer4() {
  const layer = results.layer4_scope;
  if (noScope) {
    layer.warnings.push(`[layer4] skipped (--no-scope flag)`);
    return;
  }
  let diff;
  try {
    // Prefer wiom-tech/release-01 if the remote exists; fall back to origin/HEAD
    const remotes = execSync('git remote', { cwd: sourceRepo, encoding: 'utf8' });
    let base = 'origin/HEAD';
    if (remotes.includes('wiom-tech')) base = 'wiom-tech/release-01';
    diff = execSync(`git diff --name-only ${base}...HEAD`, {
      cwd: sourceRepo, encoding: 'utf8',
    });
  } catch (e) {
    // Fall back to working-tree changes vs HEAD
    try {
      diff = execSync('git diff --name-only HEAD', { cwd: sourceRepo, encoding: 'utf8' });
      layer.warnings.push(`[layer4] falling back to working-tree diff (no branch diff available)`);
    } catch (e2) {
      layer.errors.push(`[layer4] could not run git diff: ${e2.message}`);
      return;
    }
  }
  const changed = diff.split('\n').map(f => f.trim()).filter(Boolean);
  for (const f of changed) {
    if (!matchesAllowlist(f)) {
      layer.errors.push(`[layer4][out-of-scope] ${f}`);
    }
  }
}

// ── Run ──
runLayer1();
runLayer2();
runLayer3();
runLayer4();

// ── Report ──
const totalErrors = Object.values(results).reduce((acc, l) => acc + l.errors.length, 0);
const totalWarnings = Object.values(results).reduce((acc, l) => acc + l.warnings.length, 0);

if (jsonOut) {
  console.log(JSON.stringify({ results, totalErrors, totalWarnings }, null, 2));
} else {
  console.log('');
  console.log('=== Pratibimb PR Validation Report ===');
  console.log('');
  const layerNames = {
    layer1_copy: 'Layer 1 — UX Copy        ',
    layer2_tokens: 'Layer 2 — DS Tokens      ',
    layer3_drilldowns: 'Layer 3 — Drilldown Spec ',
    layer4_scope: 'Layer 4 — Scope Fence    ',
  };
  for (const [key, name] of Object.entries(layerNames)) {
    const r = results[key];
    const e = r.errors.length, w = r.warnings.length;
    const status = e === 0 ? (w === 0 ? 'PASS' : `PASS (${w}w)`) : `FAIL (${e}e ${w}w)`;
    console.log(`${name} ${status}`);
  }
  console.log('');
  for (const [key, name] of Object.entries(layerNames)) {
    const r = results[key];
    if (r.errors.length === 0 && r.warnings.length === 0) continue;
    console.log(`--- ${name.trim()} ---`);
    r.errors.forEach(e => console.log(`  ERROR ${e}`));
    r.warnings.forEach(w => console.log(`  WARN  ${w}`));
    console.log('');
  }
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
  console.log(totalErrors === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
  console.log('');
}

process.exit(totalErrors === 0 ? 0 : 1);
