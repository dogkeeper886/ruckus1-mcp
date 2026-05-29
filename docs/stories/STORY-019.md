# STORY-019: Fold WiFi-Network Update Sub-Tools into `update_wifi_network`

Tracks a GitHub issue filed from the `/review-tool` audit on 2026-05-29.

## Goal

Remove two MCP tools whose capability is already reachable through `update_wifi_network` plus the existing multi-endpoint chain pattern. After the change, the agent's tool list shrinks by 2 with no loss of capability and no migration cost.

The two tools to remove:

- `update_wifi_network_portal_service_profile`
- `update_wifi_network_radius_server_profile_settings`

## Why this is worth doing

The MCP tool surface is a contract with the AI agent. Every tool consumes schema bytes the agent must read, decision-load when picking among options, and maintenance when R1 changes. The two tools above have:

- **Zero callers anywhere.** No YAML test references either tool. No other service function wraps either of their service functions.
- **Single-endpoint scope.** Each tool's sole purpose is to call one R1 endpoint that **another tool already calls internally** as part of a multi-step chain.

Removing them produces a strictly better agent contract: one less standalone tool to consider, one richer parent tool whose schema gains a small number of optional fields.

## Evidence from the audit

Source: `.claude/audit/tool-inventory.yml` (generated 2026-05-29) and `.claude/audit/tool-redundancy-report-2026-05-29.md`.

### `update_wifi_network_portal_service_profile`

| Aspect | Value |
|---|---|
| Registered | `src/mcpServer.ts:2127` |
| Service function | `updateWifiNetworkPortalServiceProfileWithRetry` at `ruckusApiService.ts:5561` |
| R1 endpoint | `PUT /wifiNetworks/{networkId}/portalServiceProfiles/{profileId}` |
| Required inputs | `networkId`, `profileId` |
| Optional inputs | none (only framework `maxRetries`/`pollIntervalMs`) |
| Tests calling it | 0 |
| Service code wrapping it | 0 |
| Parent precedent | `create_wifi_network` calls this exact endpoint as step 2 of its 6-endpoint chain in `createWifiNetworkWithRetry` (see `ruckusApiService.ts:4134`). `activate_wifi_network_at_venues` also calls it conditionally. |

### `update_wifi_network_radius_server_profile_settings`

| Aspect | Value |
|---|---|
| Registered | `src/mcpServer.ts:2153` |
| Service function | `updateWifiNetworkRadiusServerProfileSettingsWithRetry` at `ruckusApiService.ts:5676` |
| R1 endpoint | `PUT /wifiNetworks/{networkId}/radiusServerProfileSettings` |
| Required inputs | `networkId` |
| Optional inputs | `enableAuthProxy`, `enableAccountingProxy` (both boolean) |
| Tests calling it | 0 |
| Service code wrapping it | 0 |
| Parent precedent | Three other tools (`create_wifi_network`, `activate_wifi_network_at_venues`, `deactivate_wifi_network_at_venues`) already call this endpoint as part of their chains. This standalone tool is the only one where it's the sole purpose. |

## Proposed change

Extend `update_wifi_network`'s schema with optional fields covering both folds:

```typescript
// New optional params on update_wifi_network
portalServiceProfileId?: string;   // when set, also PUT the portal-association endpoint
enableAuthProxy?: boolean;          // when set, also PUT the radius-settings endpoint
enableAccountingProxy?: boolean;    // ditto
```

Extend `updateWifiNetworkWithRetry` (or refactor it to share the multi-endpoint chain pattern with `createWifiNetworkWithRetry`) so that:

- When `portalServiceProfileId` is supplied, the service does an additional PUT to `/wifiNetworks/{networkId}/portalServiceProfiles/{portalServiceProfileId}` after (or alongside) the main WLAN config PUT.
- When `enableAuthProxy` or `enableAccountingProxy` is supplied, the service does an additional PUT to `/wifiNetworks/{networkId}/radiusServerProfileSettings` with the appropriate body.

Both chain calls follow the existing async pattern: collect all `requestId` values, poll each to terminal status, return a consolidated result.

Delete the two standalone tool registrations from `src/mcpServer.ts` and the two service functions from `src/services/ruckusApiService.ts`. The TypeScript types in the handler destructure also need their type literals updated.

Update `update_wifi_network`'s tool description with `FOR PORTAL ATTACH:` and `FOR RADIUS PROXY SETTINGS:` clauses per `.claude/rules/tool-descriptions.md`, telling the agent that the optional fields trigger the additional internal PUTs.

## Agent contract impact

| | Before | After |
|---|---|---|
| Tool count | 74 | 72 (−2) |
| `update_wifi_network` schema fields | 4 (incl. framework) | 7 (incl. 3 new optional) |
| `update_wifi_network` description chars | ~150 | ~400 (~+250 for the FOR clauses) |
| Agent decision branches when choosing "how do I attach a portal profile to an existing WLAN?" | 1 (`update_wifi_network_portal_service_profile`) | 1 (`update_wifi_network` with `portalServiceProfileId`) |
| Same for "how do I toggle RADIUS proxy?" | 1 | 1 |

Net positive: −2 tool slots, +3 optional fields on a tool the agent already knows about, +1 description block that's structurally identical to existing `FOR <TYPE>:` patterns.

## Acceptance criteria

- Both standalone tools (`update_wifi_network_portal_service_profile` and `update_wifi_network_radius_server_profile_settings`) are removed from `src/mcpServer.ts` and their service functions are removed from `src/services/ruckusApiService.ts`.
- `update_wifi_network` accepts the three new optional params and triggers the additional R1 endpoint PUTs internally when they are supplied.
- The multi-endpoint chain in `updateWifiNetworkWithRetry` follows the same pattern as `createWifiNetworkWithRetry` — collect all `requestId`s, poll each, return a consolidated `{ status, activities }` shape.
- `update_wifi_network`'s tool description gains `FOR PORTAL ATTACH:` and `FOR RADIUS PROXY SETTINGS:` clauses per `.claude/rules/tool-descriptions.md`.
- `npm run build` passes.
- At least one new YAML integration test exercises the new params end-to-end:
  - Create a WLAN + portal profile → call `update_wifi_network` with `portalServiceProfileId` → query the WLAN and assert the portal profile is attached.
  - (Optional second test) Same for the RADIUS proxy toggles.
- No existing tests need updates (verified by the audit: 0 tests reference the removed tools).
- Tool inventory is regenerated (`/review-tool --rebuild`) and committed alongside the change so the audit baseline reflects the new tool count.

## Risks and what to watch

- **None known.** The audit confirms zero existing callers for both removed tools.
- One subtle thing: the multi-endpoint chain pattern requires the service function to handle partial failure — if the main PUT succeeds but the chained PUT fails, the WLAN is in an inconsistent state. `createWifiNetworkWithRetry` already faces this and handles it by collecting all `requestId`s and reporting per-step status. Mirror that approach.

## What's intentionally out of scope

- The 12 settings-family getters (5 venue + 5 AP-group + 2 AP) — separate, larger consolidation tracked in STORY-020. Don't bundle.
- The `get_ruckus_venues` service-function inconsistency — separate cleanup tracked in STORY-021. Don't bundle.
- A generalized "multi-endpoint chain" service helper extracted from `createWifiNetworkWithRetry`. Tempting refactor but unnecessary for this story; the duplication is small. Leave the helper extraction to a future story if more chains land.

## How a future AI agent should approach this

1. Read this document plus the audit report and inventory to confirm the evidence is still current — regenerate the inventory with `/review-tool --rebuild` and check that caller counts for both tools are still zero.
2. If the counts are non-zero (someone added a test or wrapper), pause and re-evaluate. The fold cost calculation depends on them being zero.
3. Read `createWifiNetworkWithRetry` carefully — that's the precedent. Mirror its multi-endpoint chain shape in the updated `updateWifiNetworkWithRetry`.
4. Implement following the patterns in `.claude/rules/mcp-tool-patterns.md` (Advanced Pattern 1: Conditional async steps, Advanced Pattern 5: Multi-step with conditional steps).
5. Open a small PR with `Fixes #<issue>` in the body.

## References

- Source audit: `.claude/audit/tool-redundancy-report-2026-05-29.md`
- Source inventory: `.claude/audit/tool-inventory.yml`
- Skill that produced these: `.claude/skills/review-tool/SKILL.md`
