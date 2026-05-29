---
name: review-tool
description: |
  Audit the registered MCP tool list for redundancy. Flag tools whose
  capability is already reachable through another tool. Tool count is a
  budget — every tool costs agent attention and maintenance. Builds a machine-
  readable inventory of tools, endpoints, and callers so consolidation
  candidates are surfaced from evidence rather than pattern-matching against
  templates. Advisory only; the user decides what to remove.
disable-model-invocation: true
---

# Review Tool — Redundancy Auditor

Build a structured inventory of every registered MCP tool, then use that
inventory to surface tools that should be folded into another. The skill
asks one question per tool: *"What workflow calls this tool alone, separate
from any potential parent? Is that workflow real?"* It answers from
evidence — endpoint sharing, caller counts, input shape — not from
matching tool names against canned patterns.

Arguments: {{input}}
  - (empty)               Audit every registered tool
  - `<tool_name>`         Reason about one tool against the existing inventory
  - `--rebuild`           Force regeneration of the inventory before reasoning
  - `--diff`              Restrict the report to tools added by the current branch's diff vs main

## Principles

**1. Tool count is a budget.** Every tool consumes schema bytes the agent must
read, decision-load when picking among options, and maintenance when R1
changes. The bar to add is high; the bar to keep is the same bar.

**2. The MCP tool surface is a contract with the agent, not a wire mirror.**
"R1 has a unique endpoint for this" is *not* a valid reason to keep a tool.
Existing service functions like `createWifiNetworkWithRetry` already chain
6+ R1 endpoints inside one tool — the same shape can absorb the standalone
update siblings. What matters is whether the agent's contract improves when
the capability moves into a parent tool, not whether the wire path is
distinct.

**3. Capability is not the same as a tool.** If existing tools plus a simple
read-modify-write loop or a documented chain pattern already let an agent
achieve the outcome, a dedicated tool is redundant — even if it would be more
ergonomic. Ergonomics that cost a tool slot rarely earn it back.

**4. Evidence before verdict.** Every flagged tool must cite three things:
the parent it would fold into, the existing tool that already calls the same
endpoint (the parent precedent), and the caller count. Without all three,
the recommendation is speculation.

**5. Advisory only.** Surface candidates with reasoning. Never edit
`src/mcpServer.ts`, never remove handlers, never decide whether a tool stays.
The user runs that decision and the follow-up PR.

## Phase 1 — Build the inventory

Source of truth is `.claude/audit/tool-inventory.yml`. Each tool gets a
structured entry with the fields needed for downstream reasoning. The schema
is documented at the top of the inventory file itself; the key fields are:

- **registration** — file + line in `src/mcpServer.ts`
- **service function** — name + file + line in `src/services/ruckusApiService.ts`
- **operation type** — read-only / async / pure-builder
- **r1_endpoints** — every endpoint the service function hits, with method,
  path (templated), and always/condition annotation
- **callers.tests** — every YAML test under `cicd/tests/testcases/` that
  invokes the tool by name
- **callers.code** — every other service function that wraps this one
  (excluding `mcpServer.ts`, which always has the handler)
- **inputs** — `required`, `optional_count`, `total_params`, plus complexity
  indicators (nested objects, free-form-object params, large enums, nesting
  depth)

Don't include description text — keep the inventory compact, structural only.
Sort entries alphabetically by name so diffs are stable.

This phase is mechanical and read-heavy across the whole tree. Delegate it
to a research agent (Explore or general-purpose) and have the agent write
the YAML directly. Subsequent runs can skip rebuild unless `--rebuild` is
passed or the diff under `src/mcpServer.ts` shows new tool registrations.

## Phase 2 — Find candidates from evidence

The signals that actually produced useful findings in the first run, in
descending order of value:

### Inverse endpoint → tools index

Build a dict from `<METHOD> <path>` to the list of tools that surface it.
When an endpoint appears in more than one tool's `r1_endpoints`, and at
least one of those tools is the endpoint's *sole* purpose (only one endpoint,
no chaining), that's the strongest fold signal the audit can produce. The
standalone tool is a duplicate of one of the other tool's internal steps.

### Caller count

A tool with **zero callers in tests AND zero callers in code** is a candidate
on its own — it's not pinned by any usage. Combined with the inverse-endpoint
signal, "zero callers" elevates a candidate from "could fold" to "should
fold." Without callers, removal carries no migration cost.

### Parent precedent

For each candidate, identify whether another tool already chains the same
endpoint as part of a multi-step operation. If yes, the fold isn't a new
pattern — it reuses an existing one. `createWifiNetworkWithRetry` chaining 6
endpoints is the canonical precedent in this codebase. Cite the precedent
explicitly in the report so the fold proposal is concrete.

### Input subset (paired with caller count)

When tool A's required inputs are a strict subset of tool B's required
inputs AND A's endpoints are a subset of B's endpoints, A *might* be a
degenerate case of B. This signal is noisy on its own — `get_X` is naturally
a subset of `update_X`'s reads but is still a legitimate independent tool.
Use this signal **only in combination with low caller count**.

### Name-prefix clustering

When 3+ tools share a common name prefix (`get_venue_*_settings`,
`get_ap_group_*_settings`, etc.) and structural shape (same required inputs,
same operation type, single-endpoint each), that's a family-consolidation
signal. Even if individual tools are justified, the cluster may be
compressible into one parametrized tool with a discriminator field (e.g.
`get_venue_settings(venueId, categories: string[])`).

### Dead-in-tests, by itself

A tool with zero test callers is at least worth a question — either it
covers a use case nobody exercises, or it duplicates something tests reach
through another path. Flag for review even if other signals don't fire.

## Phase 3 — Reason per candidate

For each candidate, produce a per-tool block with these elements (no
checkboxes, no severity bins — reasoning carries the weight):

- **Where it lives** — file:line for registration and service function.
- **What it does** — one sentence: which endpoint(s), what user-visible
  capability.
- **Caller count** — tests + code, with sources.
- **Parent precedent** — which existing tool already chains this endpoint;
  cite the service function and line.
- **Proposed fold** — what change to the parent's schema/handler; what new
  fields the parent gains.
- **Fold cost** — concretely, what the agent's contract changes. Use the
  inputs.complexity data: are we adding 1 optional scalar or 5 nested
  objects? "+1 optional field" is cheap; "+nested object with 8 sub-fields"
  is not.
- **Agent contract impact** — what the agent sees differently. Losing a tool
  slot is a gain; bloating a parent's description is a cost. Net out
  honestly.
- **Risk** — any reason the fold would break tests, force downstream
  changes, or surface unforeseen complexity. If a tool has dozens of test
  callers, removing it is expensive even if the capability survives.

Findings group naturally into tiers based on caller count and fold cost,
not on hardcoded severity:

- **Strong fold candidates** — zero callers, parent precedent exists, fold
  cost is one or two optional scalar fields. These are zero-risk wins.
- **Moderate fold candidates** — partial caller usage, or fold cost is
  bigger (parametrized parent, multiple new optional fields, response-shape
  change). Worth doing only if usage patterns justify the surgery.
- **Healthy / no findings** — every other tool. Don't manufacture findings
  to fill the report; "this tool earns its slot" is a valid verdict.

## Phase 4 — Write the report

Output: `.claude/audit/tool-redundancy-report-YYYY-MM-DD.md`. One report
per audit run; older reports accumulate so the history is visible.

The report should:

- State the date and the totals (tools reviewed, endpoints, callers).
- Group findings by tier (Strong / Moderate / Healthy / Anomaly).
- Per candidate, include all the reasoning elements from Phase 3.
- End with a concrete recommendation — usually "open a PR for the Strong
  candidates; defer or close the Moderate ones." Recommendation is
  advisory; the user decides.

## Signals that turned out to be noise

Recording these so future runs don't re-discover them as new tricks:

- **Subset detection alone** — `get_wifi_network` is a strict subset of
  `activate_wifi_network_at_venues` but is a legitimate read tool. Subset
  signals must be paired with caller-count evidence.
- **Always-paired-in-tests** — natural CRUD test patterns
  (`create_X` always alongside `delete_X`) generate too many false hits.
  Useful only when filtered to narrow-use tools (≤2 tests) with a tool-name
  shape that suggests a sub-operation.
- **Regex on tool names** — `update_X_Y_Z` parsing for an inferred parent
  `update_X` is brittle. Use the structural fields in the inventory
  (shared endpoints, shared required inputs) instead of name parsing.

## What this skill does NOT do

- Decide whether to remove a tool. That's the user's call.
- Edit `src/mcpServer.ts` or any source file.
- Audit implementation quality of individual tools (description rigor,
  polling correctness, parameter conventions). That's the concern of a
  separate skill — not this one.
- Compare against other MCP servers or external repos.
- Re-architect the tool surface. Surfaces candidates; leaves design to
  the user.

## Outputs

This skill writes to `.claude/audit/`:

- `tool-inventory.yml` — the machine-readable inventory. Overwritten on
  each `--rebuild` run.
- `tool-redundancy-report-YYYY-MM-DD.md` — one report per run.
  Accumulates over time so the history of audit findings is visible.

Both files should be committed when produced. The inventory's history
becomes a record of tool-surface evolution; the reports become the audit
trail.

## Related skills

- `/add-tool` — implements new tools. Run `/review-tool <intended_name>`
  *before* `/add-tool` to confirm the capability isn't already reachable.
- `/audit-tests` — sibling advisory skill for YAML test weaknesses.
- `/dev-review-pr` — broader PR review. This skill is narrower: one
  question ("should this tool exist?"), applied to many tools.
