# STORY-020: Consolidate Settings-Family Getter Tools

Tracks a GitHub issue filed from the `/review-tool` audit on 2026-05-29.

## Goal

Replace 12 specialty getter tools that map 1:1 to R1 sub-endpoints with 3 parametrized parent tools that fan out internally. Net change: −9 tools. Improves the agent's pick-a-tool decision from "which of 12 specialty getters do I need" to "what scope am I querying."

This is a **discretionary** consolidation — the audit recommends pursuing it only if these tools see real downstream use. The story preserves the analysis so a future agent can decide.

> **Status: implemented.** The 11 specialty getters (excluding the WLAN-scoped
> `get_venue_wifi_network_settings`, kept standalone) are folded into 3 parametrized tools.
> **Tool count 82 → 74 (−8).** Live-verified by TC-INT-004 (`get_venue_settings`) and TC-INT-005
> (`get_ap_group_settings`), incl. the `categories` discriminator. Two deviations from the original
> spec below: the per-category service fns are **retained as internal fan-out targets** (delegated
> to, not deleted — lower risk, DRY), and a small private `mergeSettingsCategories` helper is used
> across the 3 (the warned-against "meta-helper" was about a generic endpoint dispatcher; this just
> runs ready thunks via `Promise.all`).

## Tools in scope

### Venue-settings family (5 tools today)

| Tool | R1 endpoint | Tests calling it |
|---|---|---|
| `get_venue_external_antenna_settings` | `/venues/{id}/apModelExternalAntennaSettings` | 0 |
| `get_venue_antenna_type_settings` | `/venues/{id}/apModelAntennaTypeSettings` | 0 |
| `get_venue_ap_model_band_mode_settings` | `/venues/{id}/apModelBandModeSettings` | 1 (TC-INT-005) |
| `get_venue_radio_settings` | `/venues/{id}/apRadioSettings` | 1 (TC-INT-004) |
| `get_venue_wifi_network_settings` | `/venues/{id}/wifiNetworks/{wid}/settings` | 2 (TC-INT-324, 325) |

### AP-group-settings family (5 tools today)

| Tool | R1 endpoint | Tests |
|---|---|---|
| `get_ap_group_external_antenna_settings` | `/venues/{id}/apGroups/{aid}/apModelExternalAntennaSettings` | 0 |
| `get_ap_group_antenna_type_settings` | `/venues/{id}/apGroups/{aid}/apModelAntennaTypeSettings` | 0 |
| `get_ap_group_ap_model_band_mode_settings` | `/venues/{id}/apGroups/{aid}/apModelBandModeSettings` | 0 |
| `get_ap_group_radio_settings` | `/venues/{id}/apGroups/{aid}/radioSettings` | 0 |
| `get_ap_group_client_admission_control_settings` | `/venues/{id}/apGroups/{aid}/apClientAdmissionControlSettings` | 0 |

### AP-settings family (2 tools today)

| Tool | R1 endpoint | Tests |
|---|---|---|
| `get_ap_radio_settings` | `/venues/{id}/aps/{serial}/radioSettings` | 0 |
| `get_ap_client_admission_control_settings` | `/venues/{id}/aps/{serial}/clientAdmissionControlSettings` | 0 |

## Why this is worth doing

- **11 of 12 tools are dead in the test suite** (only TC-INT-004, -005, -324, -325 reference any of them, and just 4 individual tools across those tests). The schema cost is paid every time the agent reads its tool list, but the value is mostly unrealized.
- **All tools in a family share structural shape** — same required inputs (venue ID, optionally AP-group/AP ID), same operation type (read-only), single R1 endpoint each. The cluster is exactly what name-prefix consolidation targets.
- **The MCP tool surface is a contract with the agent, not a wire mirror.** R1 having 12 separate sub-endpoints does not require 12 separate MCP tools. A single tool can fan out to multiple endpoints internally — `createWifiNetworkWithRetry` already does this for 6 endpoints.
- **Discovery improves.** An agent looking for "venue settings" today must pick from 5 specialty getters and figure out which slice it needs. A parametrized `get_venue_settings(venueId, categories: string[])` makes the choice obvious: pick categories, get the data.

## Why this is *discretionary*, not Strong

- Some tools have test callers (4 tests across 4 tools). Folding requires test rewrites.
- The response shape changes — callers that today receive a slice will receive a merged object. Downstream parsers in tests and any external automation must adapt.
- The fold-cost is bigger than a simple field add: each new parent tool needs a `categories` discriminator, parallel-fanout service code, and a merged-response shape.
- The 11 dead tools may not be evidence of redundancy — they could be evidence of an unused but planned feature. Confirm intent before removing.

The audit recommends **deferring this consolidation and re-evaluating after the next quarter of actual tool usage.** If the dead tools stay dead, the case for consolidation strengthens. If they get picked up by new tests or workflows, the individual surface may be the right shape.

## Proposed tool surface

Three parametrized parent tools replace the 12 specialty getters:

```typescript
// Replaces 5 venue-settings tools (excluding wifi-network-settings — see below)
get_venue_settings({
  venueId: string,
  categories?: ('radio' | 'apModelBandMode' | 'externalAntenna' | 'antennaType')[]
}) → {
  radio?: {...},
  apModelBandMode?: {...},
  externalAntenna?: {...},
  antennaType?: {...}
}

// Replaces 5 ap-group-settings tools
get_ap_group_settings({
  venueId: string,
  apGroupId: string,
  categories?: ('radio' | 'apModelBandMode' | 'externalAntenna' | 'antennaType' | 'clientAdmissionControl')[]
}) → { ... }

// Replaces 2 ap-settings tools
get_ap_settings({
  venueId: string,
  apSerial: string,
  categories?: ('radio' | 'clientAdmissionControl')[]
}) → { ... }
```

Default `categories = all` returns the merged shape. Service functions fan out to the relevant R1 endpoints in parallel (using `Promise.all`) and merge the results.

## Special case: `get_venue_wifi_network_settings`

This tool takes both `venueId` AND `wifiNetworkId` — it's scoped to a WLAN at a venue, not the venue itself. Two options:

1. **Keep standalone.** Its scope is different from the other venue-settings tools. The fold pattern doesn't match cleanly.
2. **Extend `get_venue_settings`** with an optional `wifiNetworkId` parameter that, when set, includes a `wifiNetwork` category in the response.

Option 1 is cleaner and matches the agent's mental model (venue config vs WLAN-at-venue config are different scopes). Default to it unless the audit re-run shows different usage patterns.

## Agent contract impact

| | Before | After (excluding `get_venue_wifi_network_settings`) |
|---|---|---|
| Tool count | 74 | 65 (−9) |
| Venue-scope tools the agent considers for "venue settings" | 5 | 1 |
| AP-group-scope tools for "AP-group settings" | 5 | 1 |
| AP-scope tools for "AP settings" | 2 | 1 |
| Response shape | Slice per tool | Merged object with category keys |
| Description chars total (rough) | ~5 × 12 = 60 tool entries | ~3 × 1 = 3 richer tool entries |

Net positive — assuming the agent's typical workflow is "I need venue config" rather than "I need this specific setting."

## Acceptance criteria

- [x] Three new parent tools (`get_venue_settings`, `get_ap_group_settings`, `get_ap_settings`) registered in `src/mcpServer.ts`, each accepting a `categories` array (default = all).
- [x] Service functions implement the parallel fan-out: selected categories run concurrently
  (`Promise.all`) and merge into one object keyed by category, via the private
  `mergeSettingsCategories` helper.
- [x] The 11 specialty getters are removed from `src/mcpServer.ts` (tool defs + handlers + imports).
  **Deviation:** their per-category *service functions* are **retained** as the internal fan-out
  targets the 3 folded fns delegate to — reuses tested wire logic instead of inlining 11 URLs.
- [x] Tests updated: TC-INT-004 → `get_venue_settings`, TC-INT-005 → `get_ap_group_settings` (these
  were the only two referencing removed getters; TC-INT-324/325 use the retained
  `get_venue_wifi_network_settings`, unchanged). `get_ap_settings` shares the identical helper and is
  not separately covered (needs a claimed physical AP fixture).
- [x] `get_venue_wifi_network_settings` kept standalone (recommended option).
- [x] `npm run build` passes; TC-INT-004 + TC-INT-005 pass live.
- [x] The 3 tool descriptions follow `.claude/rules/tool-descriptions.md` (action verb, `categories`
  documented, producer-tool references).
- Failure mode (per "Risks"): a failed category **rejects the whole call** (all-or-nothing) — chosen
  for a single predictable result; documented in the service comment.

## Risks and what to watch

- **Response-shape change is a breaking change for any external caller.** If anything outside this repo (downstream agents, tests in other repos, scripts) consumes the slice-shaped responses, they will need updates. Confirm scope before proceeding.
- **The 11 dead tools may have intent we don't know about.** Look at git history for the original story or PR that added them; if they were added to support a planned feature, removing them prematurely is wrong. Read `git log --follow` on each tool's registration line to find the introducing commit.
- **Parallel fanout multiplies failure surface.** If one R1 endpoint returns 500, does the whole tool fail or does it return partial data? Either is defensible; pick one and document the choice.

## What's intentionally out of scope

- Equivalent `update_*_settings` tools — this story is read-only consolidation. The write-side equivalents may have different fold-cost calculations and should be a separate story if pursued.
- A meta-helper for "fan out to N R1 endpoints and merge" — interesting refactor but premature. Implement the three tools inline; extract the helper if a fourth case appears.

## How a future AI agent should approach this

1. Re-run `/review-tool --rebuild` and check whether caller counts for any of these 12 tools have changed since 2026-05-29. The deferral decision depends on whether the tools stayed dead.
2. If most are still dead, the case for consolidation has strengthened. Proceed with the fold.
3. If several now have callers, re-read the calling tests to understand the workflow. The "always paired with X" signal from `/review-tool` may reveal that the specialty tools really are the right shape.
4. Before any code changes, check `git log --follow` on each tool's registration to find the introducing commit and any associated story document. Original intent matters.
5. Open a PR that's larger than STORY-019's — 12 deletions, 3 additions, 4 test rewrites. Spec the change carefully in the PR body.

## References

- Source audit: `.claude/audit/tool-redundancy-report-2026-05-29.md`
- Source inventory: `.claude/audit/tool-inventory.yml`
- Skill that produced these: `.claude/skills/review-tool/SKILL.md`
- Sibling story: STORY-019 (the Strong fold candidates from the same audit)
