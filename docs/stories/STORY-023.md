# STORY-023: Generalize Uniform CRUD Across Resources

Follow-up to STORY-022. STORY-022 made `update_wifi_network` config-driven (retrieve-then-merge + sub-resource orchestration). This story generalizes that pattern so **every mutable resource exposes uniform, predictable CRUD**, instead of the five different update styles in the current surface.

## Goal

For each resource family, converge on a consistent CRUD contract:

- **Create** — `create_<resource>` (config object in, orchestrates any sub-resource chain).
- **Read** — `query_<resource>` (list/filter) and/or `get_<resource>` (by id).
- **Update** — `update_<resource>` accepting a **partial** config, applied via **retrieve-then-merge** (JSON Merge Patch, RFC 7386), with sub-resource association keys routed to their own endpoints — exactly the `update_wifi_network` shape.
- **Delete** — `delete_<resource>`.

The agent then learns **one** mental model for the whole surface: "to change anything, send the slice you want to change to `update_<resource>`."

## Why this is worth doing

The current surface has (see the inventory below) **five distinct update styles**, **four resources with no update tool**, and **uneven reads**. That means:
- The agent can't generalize — each resource behaves differently.
- Maintenance is per-resource bespoke code (giant param lists, ad-hoc PUT bodies).
- STORY-022 already proved the config-driven retrieve-then-merge pattern works and is agent-friendly; the helper (`applyMergePatch`) exists and is unit-tested.

## Evidence — current CRUD inventory (72 tools, post-STORY-022)

| Resource | Update style today | Gap |
|---|---|---|
| WiFi network | **config-driven retrieve-then-merge** ✅ | — (reference impl) |
| Venue | param-built PUT | not partial/merge |
| AP group | retrieve-then-update (preserve APs) | not generic partial |
| Access point | retrieve-then-update (specific fields) | not generic partial |
| RADIUS / Portal / Directory profiles | param/full-config PUT | not partial/merge |
| Roles / privilege group | param-based PUT | not partial/merge |
| Venue/AP/AP-group settings | verbatim settings PUT (1 updater, 12 getters) | inconsistent read/update |
| DPSK service, Guest pass, Identity group, SMS provider | **no update tool** | missing (verify R1 support) |

## Proposed change

1. **Extract a shared update helper** (service layer), e.g. `updateResourceWithMerge({ getFn, putUrlFor, token, id, partial, region, associations })`:
   - GET current config via the resource's `getFn`.
   - `applyMergePatch(current, configBody)` (reuse the existing util).
   - PUT the merged body; route extracted association keys to their endpoints; consolidated polling.
   - This is the generalization of `updateWifiNetworkWithRetry`'s body.
2. **Per resource, refactor `update_<resource>`** to accept a partial config and use the helper.
3. **Add missing `update_<resource>` tools** for DPSK service / guest pass / identity group / SMS provider — **only where R1 actually supports update** (verify per resource; some may legitimately be create+delete only).
4. **Standardize reads** — ensure each resource has `query_<resource>` and, where an id-scoped fetch exists, `get_<resource>`.
5. Land the complementary **boilerplate helpers** from `docs/architecture.md` ("Internal Consolidation": `regionalUrl`, `formatToolError`, `pollActivities`) so each refactored resource is thin.

## Acceptance criteria

- A shared retrieve-then-merge update helper exists and is unit-tested, reused by ≥2 resources.
- Each refactored `update_<resource>` accepts a partial config; a partial update preserves unspecified fields (verified by an integration test per resource, or a representative subset).
- Missing update tools added where R1 supports update; resources without R1 update support are explicitly documented as create+delete-only (not silently missing).
- `npm run build` + unit tests green; integration tests cover at least the partial-update round-trip for each newly-refactored resource.
- No agent-facing behavior regressions for create/read/delete.

## Risks and what to watch

- **GET vs PUT shape differs per resource.** STORY-022 found R1 tolerated the GET-shaped body on PUT for WiFi networks — **do not assume this holds elsewhere.** Trace each resource's GUI create/update (Playwright) to confirm the PUT body before refactoring; some resources may need a reshape.
- **Merge vs replace semantics change.** Moving an update from "param-built full PUT" to "retrieve-then-merge partial" changes behavior (omitted fields are now preserved, not cleared). Document per resource; use `null` to delete.
- **Not every resource supports update.** Confirm via R1 before adding an update tool; don't force one where the API only allows create/delete.
- **Large surface, high effort.** Do it incrementally, one resource per PR, trace-confirmed and test-gated — not a big-bang refactor.

## What's intentionally out of scope

- Resources where R1 genuinely has no update endpoint (keep create+delete only; document it).
- A generic per-endpoint dispatcher (rejected in STORY-022 — payload depth + multi-call flows make it unusable for an agent).
- The settings-getter consolidation (separate, deferred — STORY-020).

## How a future AI agent should approach this

1. Read STORY-022 (the reference impl) + `docs/architecture.md` (Multi-Step Orchestration, Internal Consolidation) + `.claude/rules/mcp-tool-patterns.md`.
2. Pick **one** resource. Trace its GUI create + update (Playwright) to capture the exact GET→PUT body shape and any sub-resource chain.
3. Extract/reuse the shared `updateResourceWithMerge` helper; refactor that resource's `update_<resource>` to partial + retrieve-then-merge.
4. Add an integration test for the partial-update round-trip (mirror TC-INT-326).
5. One resource per PR. Repeat. Prioritize by actual usage.

## References

- STORY-022 (`update_wifi_network` config-driven retrieve-then-merge) — the reference implementation.
- `src/utils/mergePatch.ts` (`applyMergePatch`, RFC 7386) — reuse.
- `docs/architecture.md` v1.1 — Multi-Step Orchestration + Internal Consolidation (planned helpers).
- `.claude/rules/mcp-tool-patterns.md` — operation-type templates and advanced async patterns.
- The CRUD inventory in this story (derived from the 72 registered tools).
