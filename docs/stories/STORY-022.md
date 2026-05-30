# STORY-022: Config-Driven `update_wifi_network` — Retrieve-Then-Merge + Orchestrate

Captures a design direction confirmed by a live GUI API trace on the DEV tenant (2026-05-29). Supersedes the walled-garden tool approach in STORY-018 and generalizes the fold in STORY-019.

## Goal

Make `update_wifi_network` a **config-driven orchestrator** so that **any** WLAN config attribute can be changed by passing only the changed slice — with no per-attribute tools. Specifically:

1. Accept a **partial** `networkConfig` (any subset of fields).
2. **Retrieve-then-merge**: GET the current full config, deep-merge the caller's partial onto it, and `PUT` the full merged config.
3. **Re-run the sub-resource association chain** (portal profile, RADIUS proxy settings, RADIUS auth/accounting profile) the same way `create_wifi_network` does — driven by which fields are present.

This lets walled garden (`guestPortal.walledGardens`) and every other in-config attribute flow through `create`/`update` via the config object, collapsing the WLAN domain to a CRUD surface (`query` / `get` / `create` / `update` / `delete`).

## Why this is worth doing

- The RUCKUS API has ~1,500 operations and thousands of nested attributes. A tool per attribute (or per sub-resource) does not scale. The maintainable shape is **CRUD-only per resource, with the config object as the interface**.
- R1 `PUT` is **not partial**. Today `update_wifi_network` requires the full config (the TC-INT-326 round-trip problem), which an agent cannot reliably author for a 100+-field nested body.
- Retrieve-then-merge supplies the untouched fields from current state, so the agent sends only what it's changing (e.g. `{ guestPortal: { walledGardens: [...] } }`).

## Evidence — live GUI trace (DEV, 2026-05-29)

Editing a clickThrough WLAN's **Walled Garden** (Onboarding tab) and clicking Apply fired this sequence:

```
GET  /wifiNetworks/{id}                              (retrieve current) ×2
GET  /wifiNetworks/{id}/radiusServerProfileSettings
PUT  /wifiNetworks/{id}                              (full config, walledGardens merged in)
GET  /wifiNetworks/{id}
PUT  /wifiNetworks/{id}/portalServiceProfiles/{profileId}     (re-associate portal)
PUT  /wifiNetworks/{id}/radiusServerProfileSettings          (re-apply RADIUS settings)
GET  /wifiNetworks/{id}
```

The `PUT /wifiNetworks/{id}` body contained the walled garden in the full config:

```json
"guestPortal": { …, "walledGardens": ["example.com"] }
```

So the GUI itself does **retrieve-then-merge full PUT + re-orchestration of the sub-resource chain** — exactly the behavior this story asks `update_wifi_network` to mirror.

## Proposed change

- `update_wifi_network` accepts an optional, **partial** `networkConfig`.
- Service flow:
  1. `getWifiNetwork(networkId)` → current config.
  2. **Deep-merge** the partial onto current using JSON Merge Patch (RFC 7386) semantics: recursively merge objects, **replace** arrays and scalars, `null` deletes a key.
  3. **Reshape to the PUT body** the wire expects (see risk below — GET and PUT shapes differ) and `PUT /wifiNetworks/{id}`.
  4. Conditionally re-run associations, mirroring `createWifiNetworkWithRetry`:
     - `portalServiceProfileId` present → `PUT …/portalServiceProfiles/{id}`
     - `enableAuthProxy` / `enableAccountingProxy` present → `PUT …/radiusServerProfileSettings`
     - `radiusServiceProfileId` / `accountingRadiusServiceProfileId` present → `PUT …/radiusServerProfiles/{id}` (this is the "switch RADIUS profile" capability, missing today)
  5. Collect all `requestId`s, poll to terminal status (consolidated), report per-step status.
- **Remove** `update_wifi_network_portal_service_profile` and `update_wifi_network_radius_server_profile_settings` — their capability now lives in `update_wifi_network` via config/fields (this is STORY-019's fold, generalized).
- **Walled garden:** settable via `create_wifi_network` (the `guestPortal` passthrough — already works) and `update_wifi_network` (partial `guestPortal.walledGardens`). **No dedicated walled-garden tools** — supersedes STORY-018's `query/add/remove_walled_garden`.
- Preserve schema-absent business rules, notably `WIFI-20049`: apply RADIUS proxy settings **before** associating an FQDN/hostname RADIUS profile.

## Acceptance criteria

- `update_wifi_network` with only `{ networkId, networkConfig: { guestPortal: { walledGardens: ["a.com"] } } }` sets the walled garden **without wiping other fields**; verified by a follow-up `get_wifi_network`.
- A partial update of a nested scalar (e.g. `wlan.vlanId`) merges without dropping sibling fields.
- Array fields (e.g. `walledGardens`) **replace** wholesale with the provided array.
- Switching a network's RADIUS auth/accounting profile via `update_wifi_network` works, including the FQDN→proxy ordering rule.
- The two standalone sub-tools are removed; their behavior is reachable via `update_wifi_network`.
- `create_wifi_network` accepts `guestPortal.walledGardens` (add a test).
- `npm run build` passes; a new YAML integration test covers the walled-garden round-trip (create → partial update → get asserts the entry); existing tests pass.
- Net tool-count change recorded (and `tool-inventory.yml` regenerated if the audit tooling is run).

## Risks and what to watch

- **GET vs PUT shape — RESOLVED (no reshape needed).** The GUI's `PUT` body carried fields the `GET` did not (`isCloudpathEnabled`, `venues: []`, `hotspot20Settings`, `maxRate`, several top-level flags), which suggested a reshape might be required. A live round-trip experiment (2026-05-30) **refuted this**: `getWifiNetwork` → `applyMergePatch(current, { guestPortal: { walledGardens: ["example.com"] } })` → `PUT` succeeded and persisted the change with **every other field intact**. So R1 accepts the GET-shaped body verbatim on PUT; the GUI's extra fields are its own form defaults, not API requirements. Implementation is therefore plain **GET → merge → PUT**, no reshape. (Implemented in `updateWifiNetworkWithRetry`.)
- **Deep-merge correctness** (recursive object merge, array/scalar replace, no clobbering of unmentioned nested objects) is the one piece of real logic — implement as a pure, unit-tested helper.
- **Unconditional re-association** (the GUI re-PUTs portal + RADIUS settings on every save) may be wasteful or risky; prefer re-associating **only** when those fields are explicitly provided.
- **RADIUS profile replace semantics** — confirm whether `PUT`-ing a new profile replaces the old association or requires de-associating first.
- **Partial failure** across the chain — consolidated polling reports per-step status.

## What's intentionally out of scope

- A generic per-endpoint dispatcher (evaluated and rejected: defeated by payload depth and multi-call flows).
- Applying the same retrieve-then-merge pattern to other resources' update tools (do later if this proves out).

## How a future AI agent should approach this

1. Read this story, `docs/architecture.md` (Multi-Step Orchestration), and `.claude/rules/mcp-tool-patterns.md` (Advanced Patterns 1, 2, 5).
2. Re-trace WLAN create + update in the GUI to capture the exact GET→PUT body transform per network type.
3. Implement the deep-merge as a pure, tested helper (JSON Merge Patch semantics).
4. Mirror `createWifiNetworkWithRetry`'s conditional associations + consolidated polling for the update path.
5. Add round-trip tests (walled garden, a nested scalar, RADIUS proxy toggle, RADIUS profile switch).
6. Remove the two standalone sub-tools and update tool descriptions.

## References

- Live GUI API trace, DEV tenant, 2026-05-29 (walled-garden edit on a clickThrough WLAN).
- `docs/architecture.md` v1.1 — Multi-Step Orchestration, Business rules (`WIFI-20049`).
- `.claude/rules/mcp-tool-patterns.md` — Advanced Async Patterns 1 (conditional steps), 2 (retrieve-then-update), 5 (multi-step conditional).
- STORY-009 (WiFi Network Management), STORY-018 (walled-garden tools — superseded), STORY-019 (sub-tool fold — generalized here).
