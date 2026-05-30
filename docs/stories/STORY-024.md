# STORY-024: Simplify `activate`/`deactivate` to a Uniform Per-Venue Association

A focused simplification under STORY-023, grounded in a live GUI API trace (DEV tenant, 2026-05-30). Not a CRUD-merge generalization — activation is a venue-association lifecycle op — but the trace shows the current implementation is more complex than the product itself.

## Goal

Make `activate_wifi_network_at_venues` and `deactivate_wifi_network_at_venues` use **one uniform per-venue call per venue, for all network types**, removing the type-branch and the full-config-retrieve / `venues[]`-array path.

- **Activate:** `PUT /venues/{venueId}/wifiNetworks/{networkId}` with `{apGroups, scheduler, isAllApGroups, allApGroupsRadio, allApGroupsRadioTypes, venueId, networkId}` — one PUT per venue.
- **Deactivate:** `DELETE /venues/{venueId}/wifiNetworks/{networkId}` — one DELETE per venue.
- Collect all `requestId`s and poll (consolidated), as today.

## Evidence — live GUI trace (DEV, 2026-05-30)

Toggling "Activated" on the venue's Networks tab fired, for **every** type tested:

| Network type | Endpoint | Body |
|---|---|---|
| Self Sign-In (captive / `nwSubType="guest"`) | `PUT /venues/{v}/wifiNetworks/{n}` | `{apGroups:[], scheduler:{type:"ALWAYS_ON"}, isAllApGroups:true, allApGroupsRadio:"Both", allApGroupsRadioTypes:["2.4-GHz","5-GHz"], venueId, networkId}` |
| PSK | same | identical |
| Enterprise (`aaa`) | same | same (matches the current code's enterprise branch) |

Deactivate fired `DELETE /venues/{v}/wifiNetworks/{n}` (per venue). **No** portal or RADIUS re-association occurred on activate; **no** RADIUS reset on deactivate.

AP group / band-radios map to the per-venue PUT payload: AP group→`isAllApGroups`+`apGroups[]`, band/radios→`allApGroupsRadio`+`allApGroupsRadioTypes`. (VLAN is **not** here — it's `wlan.vlanId` in the WLAN config.)

### Scheduler routing (traced separately — the key nuance)

The `scheduler` field is **split across two endpoints**:

- **Activation / `ALWAYS_ON`** → the per-venue `PUT /venues/{v}/wifiNetworks/{n}` carries `scheduler:{type:"ALWAYS_ON"}`.
- **Any CUSTOM schedule** (BASIC/ADVANCED/legacy) → goes to **`PUT /venues/{v}/wifiNetworks/{n}/settings`** (the `update_venue_wifi_network_settings` endpoint), e.g.:
  ```json
  {…, "apGroups":[], "isAllApGroups":true, "allApGroupsRadio":"Both",
   "allApGroupsRadioTypes":["2.4-GHz","5-GHz"],
   "scheduler":{"type":"CUSTOM","customType":"BASIC","startDate":"2026-05-30","repeatRule":"NO_REPEAT","allDay":true}}
  ```
  This is exactly `build_wifi_scheduler_config`'s output. The GUI does **activate (per-venue PUT) then schedule-edit (`/settings`)** as two steps; it never sends a CUSTOM scheduler through the per-venue PUT.

This is why the current **guest branch** of `activate` does *both* a per-venue PUT and a `/settings` PUT — the `/settings` step is how a CUSTOM scheduler is applied at activation time.

## Current divergence

`activateWifiNetworkAtVenuesWithRetry` branches on type (`isEnterpriseType`): enterprise uses the per-venue PUT above; **guest/PSK** instead retrieve the full network config and PUT `/wifiNetworks/{id}` with a `venues[]` array. `deactivate` similarly resets RADIUS settings for non-enterprise. The trace shows the product uses the per-venue PUT/DELETE for **all** types — so the guest/PSK path is unnecessary complexity.

## Proposed change

1. Drop the `isEnterpriseType` branch; use the per-venue `PUT`/`DELETE` for all types.
2. Remove the `venues[]`-array PUT to `/wifiNetworks/{id}` and the full-config retrieve (the GUI never uses them — activation is purely the per-venue PUT).
3. **Preserve scheduler handling via `/settings`:** after the per-venue PUT, if `venueConfig.scheduler` is anything other than `ALWAYS_ON`, do the per-venue `PUT …/settings` with the scheduler (and AP-group/radio settings) — for **all** types, not just guest. (Equivalently: delegate CUSTOM scheduling to `update_venue_wifi_network_settings` and have `activate` only do `ALWAYS_ON` — see open question below.)
4. Re-examine the deactivate RADIUS reset (the GUI did a plain `DELETE` only) — likely removable, verify.
5. Keep the per-venue `venueConfig` input shape and consolidated polling; reuse STORY-023's `pollActivities` helper if it lands.

## Acceptance criteria

- `activate`/`deactivate` issue exactly one per-venue `PUT`/`DELETE` per venue, regardless of type.
- No full-config retrieve or `venues[]`-array PUT remains in either function.
- Existing activate/deactivate integration tests pass unchanged (they assert `completed` / no `isError`).
- A test activates a **PSK** (or guest) network at a venue via `activate_wifi_network_at_venues` and asserts success — covering the path that previously used the divergent branch.
- `npm run build` + unit tests green.

## Risks and what to watch

- **CUSTOM scheduler MUST keep working at activation.** A CUSTOM schedule rides the `/settings` endpoint, not the per-venue PUT — so the simplification must **not** drop the `/settings` step for non-`ALWAYS_ON` schedulers. Cover with a CUSTOM-scheduler activation test (BASIC + ADVANCED).
- **Open question — does the per-venue PUT honor CUSTOM scheduler at all?** The current *enterprise* branch only does the per-venue PUT and passes `venueConfig.scheduler` straight in; the GUI sends CUSTOM only via `/settings`. So enterprise activation with a CUSTOM scheduler may be an existing gap. Verify whether enterprise needs the `/settings` step too (likely yes → apply `/settings` uniformly for CUSTOM, all types).
- **Is the guest `venues[]` PUT ever required?** The trace shows the product never uses it; verify no regression for specific (non-all) `apGroups` and multi-venue activation.
- **Deactivate RADIUS reset removal** — confirm a plain per-venue `DELETE` fully deactivates without it (the GUI did just the DELETE).
- **Response-shape change** — the unified path returns the consolidated `{ status, activities }` shape; no current test pins internal fields, but check.

## What's intentionally out of scope

- Folding activate/deactivate into `update_wifi_network` — they are venue-association lifecycle ops on a dedicated endpoint, not config-merge updates (confirmed by the trace).
- The broader CRUD-merge generalization (STORY-023) and the boilerplate helper extraction (architecture.md "Internal Consolidation").

## How a future AI agent should approach this

1. Read this story + the current `activateWifiNetworkAtVenuesWithRetry` / `deactivateWifiNetworkAtVenuesWithRetry`.
2. Re-trace one activation if in doubt (the recipe is in this story).
3. Collapse to the uniform per-venue loop; keep consolidated polling.
4. Add the PSK/guest activation test; run the existing activate/deactivate suite.

## References

- Live GUI trace, DEV tenant, 2026-05-30 (activate/deactivate of Self Sign-In + PSK at venue `Probe-B-20260529`).
- `.claude/rules/mcp-tool-patterns.md` — Advanced Pattern 6 (type-based early return) is what this story *removes*.
- STORY-023 (generalize CRUD) — parent effort.
- `docs/architecture.md` v1.1 — Multi-Step Orchestration.
