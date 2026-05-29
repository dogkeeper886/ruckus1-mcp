# Tool Redundancy Audit — 2026-05-29

Reviewed **74 tools** registered in `src/mcpServer.ts`.

**Operation-type mix:** 36 async · 36 read-only · 2 pure-builder.
**R1 endpoints (counting conditional branches separately):** 96.
**Test-caller links:** 150 across 53 distinct YAML test files.

Source data: `.claude/audit/tool-inventory.yml` (1890 lines, machine-generated).

---

## Strong fold candidates

These two tools have **zero callers anywhere** (no tests, no other service functions) and surface single endpoints that **another tool already calls internally as part of a chain**. The agent's contract loses nothing by folding them in; the tool count drops by 2.

### 1. `update_wifi_network_portal_service_profile`

| | |
|---|---|
| Registered | `src/mcpServer.ts:2127` |
| Service fn | `updateWifiNetworkPortalServiceProfileWithRetry` at `ruckusApiService.ts:5561` |
| R1 endpoint | `PUT /wifiNetworks/{networkId}/portalServiceProfiles/{profileId}` |
| Required inputs | `networkId`, `profileId` |
| Other inputs | none (just framework `maxRetries`/`pollIntervalMs`) |
| Callers in tests | **0** |
| Callers in code | **0** |
| Parent precedent | `create_wifi_network` already calls this exact endpoint as step 2 of its 6-endpoint chain (see `createWifiNetworkWithRetry`) |
| `activate_wifi_network_at_venues` also calls it conditionally |

**Proposed fold.** Add `portalServiceProfileId?: string` to `update_wifi_network`'s schema. When provided, `updateWifiNetworkWithRetry` does the same retrieve-then-PUT pattern for the portal-association endpoint that `createWifiNetworkWithRetry` already does. Identical service-layer code reuse; no new patterns.

**Agent contract impact.**
- Lose: one standalone tool (~150 description chars freed).
- Gain: one optional field on `update_wifi_network`'s description, with a `FOR PORTAL ATTACH:` clause.
- Net: **positive** — agent has one less tool to consider when picking, and the discovery path for portal association moves from "find the right standalone tool" to "set a field on the obvious tool."

**Risk:** none. No tests pin the standalone tool; no service code wraps it.

### 2. `update_wifi_network_radius_server_profile_settings`

| | |
|---|---|
| Registered | `src/mcpServer.ts:2153` |
| Service fn | `updateWifiNetworkRadiusServerProfileSettingsWithRetry` at `ruckusApiService.ts:5676` |
| R1 endpoint | `PUT /wifiNetworks/{networkId}/radiusServerProfileSettings` |
| Required inputs | `networkId` |
| Other inputs | `enableAuthProxy?`, `enableAccountingProxy?` |
| Callers in tests | **0** |
| Callers in code | **0** |
| Parent precedent | This endpoint is called by **4 other tools** (`create_wifi_network`, `activate_wifi_network_at_venues`, `deactivate_wifi_network_at_venues`, and this standalone). The standalone is the only one where it's the *sole* purpose. |

**Proposed fold.** Add `enableAuthProxy?: boolean` and `enableAccountingProxy?: boolean` to `update_wifi_network`. Service function adds the same RADIUS-settings PUT that `createWifiNetworkWithRetry` already does.

**Agent contract impact.** Same shape as candidate 1 — net positive.

**Risk:** none. Zero callers.

---

## Moderate fold candidates (settings-family consolidation)

The codebase has **twelve** specialty getter tools mapping 1:1 to R1 sub-endpoints. Together they're a structural pattern, not individually wrong, but they consume 12 slots in the tool surface that could compress to 3.

### Venue-settings family (5 tools)

| Tool | R1 endpoint | Tests |
|---|---|---|
| `get_venue_external_antenna_settings` | `/venues/{id}/apModelExternalAntennaSettings` | 0 |
| `get_venue_antenna_type_settings` | `/venues/{id}/apModelAntennaTypeSettings` | 0 |
| `get_venue_ap_model_band_mode_settings` | `/venues/{id}/apModelBandModeSettings` | 1 (TC-INT-005) |
| `get_venue_radio_settings` | `/venues/{id}/apRadioSettings` | 1 (TC-INT-004) |
| `get_venue_wifi_network_settings` | `/venues/{id}/wifiNetworks/{wid}/settings` | 2 (TC-INT-324, 325) |

3 of 5 are dead in tests. All share `venueId` as the only required input. They map 1:1 to separate R1 endpoints, but the **MCP tool surface is a contract with the agent**, not a wire mirror — multiple R1 calls in one tool is already common pattern (`createWifiNetworkWithRetry` does 6).

**Proposed fold.** One `get_venue_settings(venueId, categories: string[])` tool. Default `categories = ['radio', 'apModelBandMode', 'externalAntenna', 'antennaType']` returns everything. Optional category filter lets the agent fetch only what it needs. Service function fans out to the relevant R1 endpoints in parallel and merges the response.

**Agent contract impact.**
- Lose: 5 tools (~200 description chars × 5).
- Gain: one tool with a discriminated `categories` enum + a richer response shape.
- Net: **positive** if and only if the agent's typical workflow is "I need venue config" rather than "I need this specific setting." Worth confirming with whoever uses these tools.

**Risk:** 3 test files (TC-INT-004, -005, -324, -325) currently call individual tools — those tests would need updating. Low cost.

**Special case:** `get_venue_wifi_network_settings` takes both `venueId` AND `wifiNetworkId` — it's WLAN-at-venue scoped, not venue-scoped. Either keep it standalone, or extend the merged tool with an optional `wifiNetworkId` to scope settings to a specific WLAN.

### AP-group-settings family (5 tools)

| Tool | R1 endpoint | Tests |
|---|---|---|
| `get_ap_group_external_antenna_settings` | `/venues/{id}/apGroups/{aid}/apModelExternalAntennaSettings` | 0 |
| `get_ap_group_antenna_type_settings` | `/venues/{id}/apGroups/{aid}/apModelAntennaTypeSettings` | 0 |
| `get_ap_group_ap_model_band_mode_settings` | `/venues/{id}/apGroups/{aid}/apModelBandModeSettings` | 0 |
| `get_ap_group_radio_settings` | `/venues/{id}/apGroups/{aid}/radioSettings` | 0 |
| `get_ap_group_client_admission_control_settings` | `/venues/{id}/apGroups/{aid}/apClientAdmissionControlSettings` | 0 |

**All 5 are dead in tests.** Same proposed fold as venue family: `get_ap_group_settings(venueId, apGroupId, categories)`. Lower risk than venue family — zero existing test callers.

### AP-settings family (2 tools)

| Tool | R1 endpoint | Tests |
|---|---|---|
| `get_ap_radio_settings` | `/venues/{id}/aps/{serial}/radioSettings` | 0 |
| `get_ap_client_admission_control_settings` | `/venues/{id}/aps/{serial}/clientAdmissionControlSettings` | 0 |

**Both dead in tests.** Same fold pattern: `get_ap_settings(venueId, apSerial, categories)`.

### If all three families fold

Tool count goes from **74 → 65** (-9 tools). Tool surface reads more uniformly (one "get settings" tool per resource scope, with a `categories` discriminator). Agent's pick-a-tool decision narrows from "which of 12 specialty getters do I need" to "what scope am I querying."

This is a bigger refactor than the two Strong candidates above. Worth doing only if the venue/AP/AP-group settings feature gets meaningful use; if nobody touches these tools in practice, the optimization isn't worth the test rewrites.

---

## Healthy tools — no findings

The remaining **62 tools** earn their slots. Notable observations:

- **Pure builders** (`build_wifi_scheduler_config`, `build_terms_condition_config`) — justified per the discriminated-union pattern. Each used in 1 test alongside its consuming tool. Schema can't cleanly express their output shape, so a typed builder beats free-form construction by the agent.
- **Multi-step async chains** (`create_wifi_network` does 6 endpoints; `activate_wifi_network_at_venues` does 7) — these are exactly the pattern the agent contract benefits from. Don't unfold.
- **Single-resource getters that wrap a query-plus-fallback** (`get_radius_server_profile` may hit `/radiusServerProfiles/query` twice) — hide a wire quirk the agent shouldn't learn. Keep.
- **CRUD families across resources** (DPSK services, identity groups, directory profiles, RADIUS profiles, portal profiles) — each resource has its own `create_/query_/get_/update_/delete_` set. Standard CRUD surface; no consolidation candidate.
- **Auth / token plumbing** (`get_ruckus_auth_token`) — load-bearing.

---

## Anomaly — fix separately

**`get_ruckus_venues` (`src/mcpServer.ts:147`)** has `service_function: null` in the inventory because its handler builds the URL and calls `axios.post` inline against `/venues/query`. There's also a private `getRuckusVenues` helper inside `ruckusApiService.ts` used by `updatePrivilegeGroupSimple`'s `resolveVenueIds`, hitting the same endpoint.

Not a redundancy issue — two callers of one endpoint, one in the handler and one in a service helper. But it's an inconsistency: every other tool routes through a named service function. Worth extracting the handler's inline call into a real service function and reusing the existing private helper. Tiny fix, separate concern, not a fold.

---

## Summary

- **Candidates: 7** (2 Strong / 5 Moderate within the 3 settings families).
- **Tools clean: 62 of 74.**
- **Lowest-cost wins:** the 2 Strong candidates remove 2 tools with zero migration risk (no callers anywhere). Worth doing as a single follow-up PR.
- **Discretionary:** the 12 settings-family tools fold to 3, but the surgery is bigger and depends on actual usage patterns. Worth pursuing only if those tools see real downstream use.

## Recommendation

Open one small PR for the Strong candidates (folds 1 and 2 above). File the settings-family consolidation as a tracked-but-deferred issue — re-evaluate after the next quarter of actual tool usage to see whether the dead getters stayed dead or got picked up.
