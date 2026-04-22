---
name: audit-tests
description: |
  Scan YAML test cases for weak or misleading assertions. Use pre-PR to find
  tests that pass for the wrong reason. Advisory only — does not judge CI runs
  and does not modify files unless the user asks for a fix.
disable-model-invocation: true
---

# Audit Tests — YAML Weakness Scanner

Scan YAML test cases and report assertion weaknesses that would let real
failures pass as green.

Arguments: {{input}}
  - (empty)                  Scan every YAML under `cicd/tests/testcases/`
  - TC-INT-014 TC-INT-303    Scan specific test IDs
  - --tag wifi-networks      Scan all tests whose `tags:` list contains the tag

Examples:

    /audit-tests
    /audit-tests TC-INT-326
    /audit-tests TC-INT-327 TC-INT-328
    /audit-tests --tag self-sign-in

## Important Rules

1. **Advisory only.** Never judge a run, never gate CI, never emit pass/fail on a test's past execution. This skill reads YAML source files, not test output.
2. **Evidence-based.** Every finding must cite a specific file path, step name, and the exact pattern line that triggered it.
3. **No auto-fixes.** Present findings, let the user direct any changes.
4. **Respect intent.** If a pattern is defensibly intentional (e.g., a pure smoke-level auth test that only needs "tool responded"), say so in the finding and keep severity Low.
5. **Never fabricate.** If a test has no weakness under any category, don't manufacture one. "Nothing found" is a valid verdict.

## Scope

- Primary target: `cicd/tests/testcases/integration/*.yml`.
- Also scan `cicd/tests/testcases/e2e/*.yml` and `build/*.yml` if they exist.
- Ignore files that don't parse as valid YAML — log once in the report, move on.

## Step 1: Resolve Targets

Parse the argument:

- **Empty** → Glob all YAMLs under `cicd/tests/testcases/`.
- **Test IDs** (e.g., `TC-INT-014`) → Load YAMLs whose `id:` field matches.
- **`--tag <name>`** → Load YAMLs whose `tags:` array contains `<name>`.

Read each YAML (use the `Read` tool). Extract: `id`, `name`, `tags`, each step's `name`, `command`, `expectPatterns`, `rejectPatterns`, `capture`, plus the file-level `criteria` block.

## Step 2: Apply Five Weakness Checks

Evaluate each step against these categories. A single step may hit multiple categories; emit a separate finding per category it triggers.

### Category 1 — Envelope-only assertions

**Flag when:** `expectPatterns` match **only** MCP envelope fields that appear in every response (success *and* failure), with no body-shape or error-signal assertion alongside.

Envelope fields: `content`, `text`, `type`, `"type": "text"`.

**Intentional cases (skip):** if the step also rejects `isError` or matches a body-specific field, the envelope pattern is harmless — don't flag.

**Suggested fix:** add a body-shape expect (a tool-specific field) or `rejectPatterns: [isError]`.

### Category 2 — Field-name-only assertions for value-sensitive criteria

**Flag when:** the test's `criteria` block or step name implies a specific *value* matters, but the patterns match only the key name, not the value.

Signal phrases in criteria: "verify X is true", "confirm Y is cleared", "with X enabled", "after deactivation", "only X channel".

Examples of weak patterns:
- `enableSmsLogin` (matches whether value is true or false)
- `temporaryConnectionEnabled` (boolean — key matches both states)

**Intentional cases (skip):** if the step asserts an adjacent value that discriminates the state (e.g., expects `HOUR` when SMS is on, rejects `DAY`), the key-only pattern is fine.

**Suggested fix:** add a word-boundary regex on a unique value-substring (e.g., `\bHOUR\b`, `\bMINUTE\b`), or match a caller-supplied literal whose presence proves round-trip.

### Category 3 — Asymmetric patterns across similar tests

**Flag when:** two or more tests share a tag and lifecycle shape (create → capture ID → delete, or query → assert ≥ N rows), but one has tighter assertions than the other.

Canonical lifecycle shapes to compare:
- Async mutating lifecycle: create → capture ID → (optional update) → delete → verify-gone
- Read-only query: query → assert schema fields

**Suggested fix:** harmonize — adopt the tighter pattern in the weaker test. If the difference is intentional (e.g., one is a priority-3 smoke, the other priority-1 lifecycle), note it as Low severity.

### Category 4 — Missing round-trip verification after mutations

**Flag when:** a step calls an async mutating tool (`create_*`, `update_*`, `activate_*`, `deactivate_*`, `delete_*`, `remove_*`, `move_*`) and asserts only the tool's own return (`completed`, `SUCCESS`, `requestId`), with **no** follow-up step querying the server and verifying the mutation's observable effect.

**Intentional cases (skip):**
- Test criteria is explicitly scoped to "tool returns successfully" (smoke-level).
- Test is a negative test (see Category 5).
- The mutation's effect is covered by a cleanup verify-gone step later in the same YAML.

**Suggested fix:** add a follow-up `get_*`, `query_*`, or `verify-gone` step with patterns that prove the mutation.

### Category 5 — Negative tests without a positive error signal

**Flag when:** a step expects failure (bad input, missing required field, unauthorized operation) but only rejects success tokens (`rejectPatterns: [completed, requestId]`) without positively asserting the error shape.

Positive error signals:
- `expectPatterns: [isError]` (the MCP isError flag)
- Specific error-code string (e.g., `WIFI-10200`, `HTTP Status: 422`)
- Expected error-message substring (e.g., `ssid is required`, `At least one Self Sign-In channel`)

**Suggested fix:** add both `isError` and a specific error-message substring that uniquely identifies the failure mode.

## Step 3: Produce Report

Present findings as a Markdown table. Severity key:

- **High** — weakness would let a known failure mode pass silently (e.g., missing round-trip on a destructive op; negative test that can't distinguish expected failure from unrelated failure).
- **Medium** — weakness partially blinds the test; some failure modes still caught by other patterns.
- **Low** — stylistic or defensible; flag for awareness only.

### Report template

    ## Audit Report — [DATE]

    Scanned N YAMLs (M steps total).

    ### Findings

    | # | Test       | Step | Category | Severity | Finding                                               | Suggested Pattern                                   |
    |---|------------|------|----------|----------|-------------------------------------------------------|-----------------------------------------------------|
    | 1 | TC-INT-326 | 5    | 2        | Medium   | Asserts `temporaryConnectionEnabled` key only; criteria depends on true. | Add `\btrue\b` near `temporaryConnectionEnabled`, or reject `false`. |
    | 2 | ...        | ...  | ...      | ...      | ...                                                   | ...                                                 |

    ### Summary

    - Findings: total=X (High=A, Medium=B, Low=C)
    - By category: 1=..., 2=..., 3=..., 4=..., 5=...
    - Tests clean (no findings): Y of N

    ### Systemic Observations (optional)

    If a weakness pattern repeats across many YAMLs and suggests a
    framework-level improvement, surface it here — not as per-test findings.
    Examples of systemic issues worth watching for:

    - **Dead quoted-form reject patterns.** `'"status": "failed"'` is a
      common reject pattern, but `executor.ts` applies `new RegExp(pattern, 'i')`
      against double-encoded output where literal `"` appears as `\"`. So the
      pattern `"status": "failed"` never matches the escaped output
      `\"status\": \"failed\"`. It's a dead assertion. If ≥ 3 YAMLs carry it,
      note as systemic.
    - **Case-insensitive substring collisions.** The matcher is
      case-insensitive regex — bare words like `DAY`, `MG`, `HX` can collide
      with camelCase keys (e.g., `endOfDayReauthDelay`). If findings repeatedly
      require word-boundary regex (`\bDAY\b`) to disambiguate, note as systemic.

## Step 4: Offer Next Actions

After presenting the report, ask the user:

- **"fix 1, 3, 7"** — the agent opens fix PRs (or patches in place if no PR convention applies) for those findings, one at a time, with the user's confirmation per fix.
- **"details 4"** — expand finding #4 with the YAML snippet and before/after suggestion.
- **"ignore 2"** — acknowledge the user's stance; note in-chat but do not persist.
- **"save"** — save the full report to `docs/audit/[YYYY-MM-DD]_audit_report.md` (create directory if needed).
- **"done"** — exit without saving.

## Out of Scope

- Running tests.
- Judging CI run output.
- Modifying `cicd/tests/src/` (framework code) — if a systemic issue is found, surface it in "Systemic Observations" and open a separate issue rather than patching mid-audit.
- Rewriting YAMLs automatically. Every change the user requests happens in a named PR, not silently.

## Success Signal for This Skill

When run against all ~51 YAMLs, this skill should produce ≥ 10 findings that the user agrees are real (not noise) on first read. If repeated invocations produce high noise (>20% of findings marked "ignore"), revisit the category definitions — the skill itself is failing its audit.
