# Audit Report — 2026-04-22

First run of the `audit-tests` skill against the full corpus.

Scanned **53 YAMLs** under `cicd/tests/testcases/integration/`.

## Summary

- **27 findings** total — **6 High**, **5 Medium**, **16 Low**
- **2 Systemic Observations** — one with broad reach (14 tests), one narrow
- **Tests clean (no findings):** 17 / 53

By category:
- Category 1 (envelope-only): 15
- Category 2 (field-name-only for value-sensitive criteria): 1
- Category 3 (asymmetric lifecycle assertions): 5
- Category 4 (missing round-trip): 1
- Category 5 (negative without positive error signal): 5

The skill meets its own success signal (≥ 10 real findings, < 20% expected noise).

---

## High-severity findings

| # | Test | Step | Category | Finding | Suggested Pattern |
|---|------|------|----------|---------|-------------------|
| 1 | TC-INT-002 | 1 | 5 | Negative test (bogus requestId). `expectPatterns: [content]` + `rejectPatterns: []`. No error signal — test passes if ANY response comes back, including an unrelated crash. | Add `expectPatterns: [isError]` or assert a specific error-code / message substring. |
| 2 | TC-INT-301 | 1 | 5 | Negative test (invalid UUID activity ID). `expectPatterns: [content]` + `rejectPatterns: []`. Same envelope-only pattern — can't distinguish expected failure from unrelated. | Add `expectPatterns: [isError]` plus the specific expected error token. |
| 3 | TC-INT-303 | 1 | 5 | Negative test (non-existent venue delete). Asserts `content`, rejects `completed`. Won't catch a confused non-error "content exists without completed" response. | Add `expectPatterns: [isError]` + venue-not-found error substring. |
| 4 | TC-INT-307 | 1 | 5 | Negative test (invalid AP serial). Same weakness as #3. | Same fix. |
| 5 | TC-INT-318 | 1 | 5 | Negative test (invalid networkId for guest pass). Same weakness as #3. | Same fix. |
| 6 | TC-INT-323 | 8 | 4 | **Known from closed #66 item 1.** `companionId` is captured via `data[name=mcp-test-dsae-ci-dpsk3-wpa2].id` but the DSAE companion doesn't appear as a sibling row in `query_wifi_networks`. Capture fails → `{{companionId}}` substitutes to literal string `{{companionId}}` in the verify-gone reject pattern → regex never matches → step passes silently. | Investigate where the DSAE companion actually surfaces in the R1 API. Either find the real ID source or drop the companion-verify step and add a comment explaining why. |

## Medium-severity findings

| # | Test | Step | Category | Finding | Suggested Pattern |
|---|------|------|----------|---------|-------------------|
| 7 | TC-INT-205 | Create | 3 | Create step asserts only `requestId`, weaker than the canonical pattern used in TC-INT-201 (`completed` + `requestId`). | Add `completed` to `expectPatterns`. |
| 8 | TC-INT-206 | Create | 3 | Create step asserts only `content` (envelope). TC-INT-201 asserts both tokens. | Add `requestId` and `completed`. |
| 9 | TC-INT-207 | Create | 3 | Create step asserts only `content`. Same asymmetry. | Same fix. |
| 10 | TC-INT-208 | Create | 3 | Create step asserts `content` + `text` (envelope only). | Add `requestId` and `completed`. |
| 11 | TC-INT-209 | Create | 3 | Create step asserts only `requestId`; no `completed`. | Add `completed`. |

## Low-severity findings

Category 1 — envelope-only `expectPatterns` (`content` / `text`) on read-only queries. All have `rejectPatterns: [isError]` so errors are caught. The criticism is advisory: no body-shape verification.

| # | Test | Step | Category | Finding | Suggested Pattern |
|---|------|------|----------|---------|-------------------|
| 12 | TC-INT-011 | 1 | 1 | user_groups query, envelope-only | Add a body field such as `data` or `id` to prove list structure. |
| 13 | TC-INT-012 | 1 | 1 | roles query, envelope-only | Same — assert `data` or a role-specific key. |
| 14 | TC-INT-013 | 1 | 1 | role_features query, envelope-only | Same. |
| 15 | TC-INT-014 | 1 | 1 | wifi_networks query (default), envelope-only | Add `data` or `totalCount`. |
| 16 | TC-INT-015 | 1 | 1 | wifi_networks query (search), envelope-only | Same. |
| 17 | TC-INT-016 | 1 | 1 | guest_passes query, envelope-only | Same. |
| 18 | TC-INT-017 | 1 | 1 | clients query, envelope-only | Same. |
| 19 | TC-INT-106 | 1 | 1 | directory_server_profiles with pagination, envelope-only | Assert `totalCount` / `pageSize`. |
| 20 | TC-INT-107 | 1 | 1 | radius_server_profiles with pagination, envelope-only | Same. |
| 21 | TC-INT-109 | 1 | 1 | role_features with category filter, envelope-only | Assert `wifi` (the filter value) appears in `data`. |
| 22 | TC-INT-110 | 1 | 1 | wifi_networks with pagination, envelope-only | Same as 19. |
| 23 | TC-INT-111 | 1 | 1 | guest_passes with pagination, envelope-only | Same. |
| 24 | TC-INT-112 | 1 | 1 | clients with pagination, envelope-only | Same. |
| 25 | TC-INT-205 | Verify gone | 1 | `Verify profile is gone` — asserts `totalCount`, rejects `{{profileId}}`. Weakly envelope-shaped but acceptable. | Could tighten by also rejecting the profile name. |
| 26 | TC-INT-208 | Verify gone | 1 | `Verify role is gone` — asserts `content`, rejects `{{roleId}}`. Envelope-leaning. | Could tighten to assert `data` + the role name. |
| 27 | TC-INT-326 | GET | 2 | Asserts `temporaryConnectionEnabled` key (boolean), criteria implies `true`. Bandwidth values `5000`/`512` give partial discrimination via `maxDownloadRate`/`maxUploadRate` but the boolean itself isn't pinned. | Add a reject on `\btrue\b` / `\bfalse\b` depending on state, or match the specific `temporaryConnectionEnabled`-adjacent value. |

---

## Systemic Observations

### SO-1 — Dead quoted-form reject patterns `"\"status\": \"failed\""` [14 YAMLs]

**Reach:** TC-INT-201, 203, 209, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330.

**Why it's dead:** `executor.ts:180` applies `new RegExp(pattern, 'i').test(combined)` where `combined` contains double-encoded JSON — the inner `"status": "failed"` appears as `\"status\": \"failed\"` in stdout bytes (with literal backslashes from the outer `JSON.stringify`). The pattern `"status": "failed"` (unescaped quotes) cannot match the escaped form.

**Impact:** the reject is inert — if the backend actually returned `"status": "failed"` inside the tool response, the test would NOT fail on that reject. It passes only because `isError` is usually also in the reject list and catches real failures there.

**Fix options:**
1. Use YAML single-quoted regex with escaped backslashes: `'\\"status\\": \\"failed\\"'` (works with new RegExp's `\\` → 1 backslash).
2. Harden the framework: teach `executor.ts` to normalize double-encoded JSON before running pattern regex (bigger change, benefits all tests).
3. Drop the pattern — it's already dead; removing it reduces confusion without losing coverage since `isError` and `status.*fail` variants carry the real signal.

Recommend option 3 + a CLAUDE.md note so no one re-adds the pattern in new tests.

### SO-2 — Framework silent false-pass when `{{var}}` capture fails (from closed #66 item 3)

**Reach:** 1 confirmed instance (TC-INT-323 `companionId`). Audit hasn't surfaced others because most tests use captures that actually succeed.

**Why it's dangerous:** `executor.ts:30` returns the literal string `{{varName}}` when a variable isn't found. If that literal lands inside `expectPatterns` or `rejectPatterns`, the regex scans output for the string `{{varName}}` — which is never present → pattern never matches.

For `rejectPatterns` (the DSAE case), this means the assertion silently passes.
For `expectPatterns`, it means the assertion silently fails (which is at least noisy).

**Fix:** harden `substituteVariables` to throw when a referenced variable resolves to undefined in an assertion context. Non-trivial: needs to know which substitutions happen inside assertion fields vs `command` / `capture` fields.

---

## What to do with these findings

**High (6):** worth focused fix PRs. Suggestion — one PR for all 5 negative tests (#1–5 share the same fix pattern) + one PR for TC-INT-323 companion investigation.

**Medium (5):** harmonize CRUD create-step assertions in one sweeping PR. Small per-line change, 5 YAMLs.

**Low (16):** bulk-close as acceptable-with-awareness OR do one cleanup PR that adds body-field expects to the 15 envelope-only query/verify-gone tests (plus the one Category 2 finding). User's call.

**Systemic:**
- SO-1: one-commit cleanup PR that strips dead quoted-form rejects from all 14 YAMLs + a CLAUDE.md note.
- SO-2: separate framework-hardening PR (smaller surface if we scope to throwing only in assertion contexts).

## Verification against live CI logs

The `audit-tests` skill as designed reads YAML source only. Most findings are mechanical YAML-shape facts (Categories 1, 2, 3, 5) and don't need runtime evidence to stand. Two claims were runtime-behaviour hypotheses; both now verified against CI run [24760192044](https://github.com/dogkeeper886/ruckus1-mcp/actions/runs/24760192044) (2026-04-22):

- **SO-1 (dead quoted-form reject)** — verified with actual stdout bytes from a delete step's JSON result file. Regex `"status": "completed"` (YAML form used by 14 tests) does not match the output bytes `\"status\": \"completed\"`. Adding the backslashes (`\\"status\\": \\"completed\\"`) makes the regex match. Dead assertion confirmed.
- **TC-INT-323 companion capture** — CI log contains the exact line:
  `[WARN] Capture field 'data[name=mcp-test-dsae-ci-dpsk3-wpa2].id' not found in response`
  Reconfirmed #66 item 1 is still occurring every run.

Log-reading is valuable but only for Category 4 capture failures and Systemic runtime claims — roughly 15 % of the findings here. A follow-up issue will track adding an optional `--with-logs` mode to the skill.

## Skill verdict

First-run produced 27 findings (6 High, 5 Medium, 16 Low). All High and Medium items are actionable with obvious fixes; most Low items are defensible suggestions rather than hard bugs. Noise well under 20 %. The skill earns its keep. Enhancement (log cross-reference, tracked in #80) is follow-up; not blocking.
