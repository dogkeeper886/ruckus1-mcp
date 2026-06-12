---
paths:
  - ".claude/commands/qa-workflow/**/*.md"
---

# qa-workflow

A sibling to `dev-workflow`. Where dev-workflow turns a need into shipped code, qa-workflow
turns a story into **trustworthy test docs** — readable markdown in `docs/tests/`, authored
from a reviewed test plan, then **bound** to the executable cases that run them. This repo
owns both halves now: authoring (markdown + GitHub) and the binding + drift layer (via the
`cicd/tests` engine — `audit-bind` / `drift` / `port-yaml`).

## The flow

```
   docs/stories/STORY-XXX.md   ──or──  "write a test for X"   (on request)
            │
            ▼
   qw-plan ───────► qw-review-plan      what to test — scenarios persisted as the
            │                            [STORY-XXX] Test Plan issue
            ▼
   qw-cases ──────► qw-review-cases     write docs/tests/TS-*.md (the format contract)
            │
            ▼
   qw-bind ───────► qw-review-bind      link each case's `Script:` to its cicd YAML
            │                            (audit-bind checks step counts match)
            ▼
   qw-drift                             watch for docs ↔ script / story divergence
            │
            ▼
   → qw-run (`npm test` — the cicd runner)
```

## The test-plan issue

`qw-plan`'s scenarios persist as a **GitHub issue**, titled `[STORY-XXX] Test Plan`, labelled
`test-plan` (distinct from dev's `[STORY-XXX] Plan`). `qw-review-plan` reviews it; `qw-cases`
reads it and records the issue number in each `TS-*.md` `plan:` field.

## Producer → review pairing

| Producer | Review | Covers |
|----------|--------|--------|
| `qw-plan`  | `qw-review-plan`  | does the plan cover the story? |
| `qw-cases` | `qw-review-cases` | each doc: one job, observable, traces back |
| `qw-bind`  | `qw-review-bind`  | each case's `Script:` resolves and step counts match |

No producer ships without a review covering its output. `qw-drift` is a standing watch (not a
producer): it flags `stale` (story changed) or `unbound` (doc ↔ script diverged).

## What this owns

- **Authoring:** the flow above + the `docs/tests/` test-doc format (the contract) — markdown + GitHub.
- **Binding + drift:** linking each case to its executable and watching for divergence, via the
  `cicd/tests` engine (`npm --prefix cicd/tests run audit-bind | drift | port-yaml`).

The format a test doc must follow is `docs/tests/README.md`.
