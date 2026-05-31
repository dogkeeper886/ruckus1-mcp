# STORY-023: Generalize Uniform CRUD Across Resources

Follow-up to STORY-022. STORY-022 made `update_wifi_network` config-driven (retrieve-then-merge + sub-resource orchestration). This story generalizes that pattern so **every mutable resource exposes uniform, predictable CRUD**, instead of the five different update styles in the current surface.

## Progress

**Fully converged to config-object CRUD (create full + update partial, shared helpers):**
- **WiFi network** — `update_wifi_network` (STORY-022, reference).
- **RADIUS server profile** — update #113, create #117.
- **Directory server profile** — update #114, create #118.
- **Portal service profile** — update #115, create #119.
- **Venue** — update + `get_ruckus_venue` #120, create #121.
- **AP group** — update + create + `get_ruckus_ap_group` #122.

Shared infrastructure: `updateResourceWithMerge` (retrieve-then-merge), `createResourceWithPoll` (config POST), `pollActivities` (consolidated polling, action-parameterized), and an `omitKeys` reshape hook for resources whose PUT rejects read-only GET fields.

**Key lessons:**
- The GET→PUT round-trip is **not** uniform — verify each resource's wire shape; don't assume. RADIUS/Directory tolerate their GET-only fields; portal's PUT rejects `id`/`networkIds` (`GUEST-400000`); AP group's GET turned out to return PUT-ready data (apSerialNumbers as `string[]`), letting us delete the old AP-query + objects→strings conversion + `preserveExistingAps` flag.
- New id-scoped reads added where missing: `get_ruckus_venue`, `get_ruckus_ap_group`.

**Deliberate divergences (principle #7 — documented, not forced):**
- **Access point (`update_ruckus_ap`)** stays a specialized retrieve-then-update, **not** config-object retrieve-then-merge. Its "GET" (`getApDetailsBySerial` via the AP query) returns status/telemetry (clientCount, radioStatuses, firmwareVersion, uptime, …) that does **not** round-trip on PUT, and it has genuine move-vs-property-update semantics (venue/AP-group changes hit a different endpoint). Forcing the generic pattern would be worse. APs have no create (physical/claimed), so AP is query/get/update only.
- **Custom role (`create_custom_role` / `update_custom_role`)** stays as-is — a full-config PUT update plus permission-enrichment on create — **not** retrieve-then-merge. Confirmed by a live GUI trace (DEV tenant, 2026-05-31):
  - Update is `PUT /roleAuthentications/customRoles/{id}` with the **full** body `{name, description, features[], preDefinedRole}` — the product sends the entire config, not a delta. Our `update_custom_role` already matches this.
  - There is **no id-scoped GET**; the GUI loads current state from the **list** (`GET /roleAuthentications/customRoles`) and finds the role client-side — so there is nothing to cleanly retrieve-then-merge against.
  - Permission-enrichment is a **real product rule**: the GUI baselines read-only across *all* categories (`wifi-r, switch-r, edge-r, ai-r, admin-r, templates-r`) plus the selected perms (e.g. `wifi-c`). Our `create_custom_role` mirrors this (lighter: it adds the parent read for selected advanced perms; both produce valid roles). Converging roles to retrieve-then-merge would diverge from the product for a tiny config — worse, not better.
  - Privilege group (`update_privilege_group`) is a separate assignment op, likewise left as-is.

**Create+delete-only resources (verify + document, no update to converge):**
- **Identity group, DPSK service, guest pass** have no update tool today (R1 update support unverified). Per the acceptance criteria these should be confirmed against R1 and explicitly documented as create+delete-only if R1 has no update endpoint. Their *creates* could still be converged to config-object if/when touched.

**Convergence status:** every resource where the config-object pattern fits is done (6 resources). The remaining tools are deliberate, evidence-backed divergences (AP, custom role, privilege group) or create+delete-only resources (identity group, DPSK, guest pass) — no further update-convergence candidates remain.

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

## Create-side alignment — principles (guidelines, not a spec)

The Goal calls for `create_<resource>(config)` symmetric with `update_<resource>(id, config)`. The following are **guiding principles** for getting there — direction and intent, to apply with judgment per resource, **not rigid rules to hardcode**. Where a resource's reality conflicts with a principle, follow the reality and note why.

1. **One interface: the config object.** Lean toward a single full-config argument for create, named to match that resource's update partial (the same `…Config` object). The intent is that an agent learns *one* shape per resource and picks `create` (full) vs `update` (partial) without relearning fields. Avoid reintroducing per-attribute or per-sub-resource create variants — that's the proliferation this story exists to prevent.

2. **Thin resources over bespoke code.** Prefer a shared create helper (the create analogue of `updateResourceWithMerge`: POST config → consolidated `pollActivities` → orchestrate any sub-resource chain) so each `create_<resource>` is a thin delegation. The goal is maintainability/extensibility, not a mandated signature — if a resource genuinely needs more, that's allowed; justify it in the wrapper rather than bending the shared helper for everyone.

3. **Compact, CRUD-only surface.** Aim for exactly `query / get / create / update / delete` per resource. When folding capability in, prefer **removing** now-redundant tools to adding new ones; record the net tool-count change. Fewer, more powerful tools beat many narrow ones.

4. **Verify the wire per resource — don't assume uniformity.** The update side already proved this (portal's `omitKeys`). Create bodies may differ from GET/update shapes, and key rules are schema-absent (e.g. the DSAE band-balancing default that caused #105, the `WIFI-20049` proxy-before-FQDN ordering). Confirm each resource's create shape + business rules against the live API/GUI before converging it. Per-resource reshapes/orchestration live in that resource's thin wrapper, not forced onto all.

5. **Discoverability is the accepted tradeoff — compensate in the description.** A free-form config object cannot express per-field `required`/types in the MCP input schema. This is a deliberate choice (per-attribute schemas don't scale to ~1,500 R1 operations), already made for `update_wifi_network`'s `networkConfig`. Compensate with a thorough tool description per `.claude/rules/tool-descriptions.md`: enumerate the important fields, the required-by-type fields, sub-resource association keys, and the producer tool for each ID. **The description is the contract** — treat it as a first-class deliverable, not an afterthought.

6. **Incremental, test-gated, one resource per PR.** Same cadence as the update side: trace/verify the wire → implement onto the shared helper → round-trip test (create asserts the resource exists with the sent config; pairs naturally with the existing update round-trip test) → one PR. No big-bang rewrite.

7. **Symmetry is the aim, not dogma.** The point is a predictable mental model, not byte-identical signatures. If create and update legitimately diverge for a resource (e.g. a field only settable at create), keep them as close as the API allows and document the divergence rather than forcing false uniformity.

## Acceptance criteria

- A shared retrieve-then-merge update helper exists and is unit-tested, reused by ≥2 resources.
- Each refactored `update_<resource>` accepts a partial config; a partial update preserves unspecified fields (verified by an integration test per resource, or a representative subset).
- Missing update tools added where R1 supports update; resources without R1 update support are explicitly documented as create+delete-only (not silently missing).
- `npm run build` + unit tests green; integration tests cover at least the partial-update round-trip for each newly-refactored resource.
- No agent-facing behavior regressions for create/read/delete.
- **(Create side, as goals not gates)** A converged `create_<resource>` accepts the resource's config object; a shared create helper is reused by ≥2 resources; create and update use the symmetric `…Config` argument name; a create round-trip is covered by a test; the resource keeps a CRUD-only surface (net tool count flat or lower). Where a resource can't meet one of these cleanly, the divergence is documented rather than forced.

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
