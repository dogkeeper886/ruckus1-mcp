# STORY-028: Adopt the dual-judge test framework (Anthropic SDK) from agent-workflows-runner

Port the latest **`agent-workflows-runner`** template (local `test-framework-template`) into this
repo: replace the current deterministic-only test runner with its **dual-judge** runner — a fast
simple judge plus an opt-in **LLM judge reached through the Anthropic SDK** — and bring the test
tooling (commands, skills, rules) that goes with it.

## User Story

As a **maintainer testing this MCP server**,
I want **the test suite to judge whether a result is *actually right*, not just whether the command
exited cleanly**,
So that **a test fails when the output is wrong even though the process succeeded — the failures that
exit codes miss.**

## The Need

The current runner (`cicd/tests/`) checks exit codes and expected patterns only. A tool can return
`202`/`0` and still produce a semantically wrong result, and the suite passes anyway. The
`agent-workflows-runner` template has since evolved a **dual judge**: the deterministic judge still
runs fast and free, and an **LLM judge** (via the Anthropic SDK) grades output against
human-readable criteria as a second opinion. This repo is running the older, pre-judge version of
that same framework, so it can't express "is this answer correct?" tests at all — and it drifts
further from the template with each release.

## Success Looks Like

- This repo's test suite runs the dual-judge framework: the **simple judge** is the fast default;
  the **LLM judge** is available as an opt-in second opinion, reaching its model through the
  Anthropic SDK (so any Anthropic-compatible endpoint is configuration, not code).
- A test can pass/fail on **semantic correctness** graded against written criteria, not only exit
  code or pattern match.
- The test tooling this repo **actually needs** is present and usable — the test commands, skills,
  and format/pattern rules the dual-judge runner depends on — without disturbing the dev-workflow and
  review tooling already settled in #148, and without dragging in template files this repo has no use
  for.
- Human-readable test docs stay **bound to the executable cases** that implement them, and the suite
  can tell when a doc and its case have **drifted apart** — so the test docs remain a trustworthy
  description of what actually runs.
- The suite stands up green on a re-baselined set of cases (existing cases may be re-derived against
  the new format rather than guaranteed-migrated).

## Open Questions

- **Which template `.claude/` files this repo actually needs.** Don't port wholesale — audit each
  net-new and content-differing file against whether the dual-judge runner / test workflow here
  depends on it. This audit is its own task (carry it into `dw-tasks`), not a wholesale copy.
- For the `.claude/` files that exist in both but differ (the template's newer `dev-workflow.md`,
  `dw-review-implement.md`, `qw-*`), which version wins, and whether to keep this repo's
  `rules/qa-workflow.md` that the template dropped.
- How the template's **test-doc ↔ test-case binding and drift detection** (the `qw-bind` / `qw-drift`
  side of the qa-workflow) maps onto this repo, which today has executable YAML cases but no separate
  human-readable test docs to bind them to.
- Whether the LLM judge defaults off (opt-in) and how its credentials/endpoint are configured.
- How the 61 existing integration cases are re-baselined, and over what timeframe.
- Whether the port lands as one change or is split (runner vs `.claude/` tooling) to avoid the
  long-lived-bundle drift that bit STORY-027.

## Status

- Created: 2026-06-12
- Completed: 2026-06-12
- Plan: #149 (closed)
- Issues: #150, #151, #152, #153, #154, #155 (all closed)
- Verification (#155): full suite ran in simple mode — simple judge is the default,
  hardening intact, audit-bind/drift clean, pilot green. No port regression. The 5
  non-green cases were all non-regressions (env/external/pre-existing), tracked as
  follow-ups #168 (TC-INT-325 flaky), #169 (TC-INT-203 geocoding), #170 (SAML + AP
  test-env config).
