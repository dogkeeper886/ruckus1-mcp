# STORY-018: Walled-Garden Allowlist Tools

Tracks GitHub issue #91.

## User Story

As a QA engineer running captive-portal tests (e.g. <internal-ticket> TS-03-TC-02 Link-to-URL phases),
I want MCP tools to **read**, **add to**, and **remove from** a WiFi network's walled-garden allowlist,
So that I can verify Phase A (entry absent) → modify mid-test → Phase B (entry present) → restore baseline, all without driving the R1 admin UI through Playwright and without disconnecting the pre-auth client between phases.

## Problem

`ruckus1-mcp` has no tools to read or modify a WLAN's walled-garden allowlist. Today the only options are:

- Provision via the R1 admin GUI (slow, brittle selectors, easy to leak baseline state).
- Pass `guestPortal: { walledGardens: [...] }` at create time — but this requires destroying and recreating the WLAN to change the list, which forces clients to re-associate.

The issue author requested 3 tools: `query_walled_garden`, `add_walled_garden_entry`, `remove_walled_garden_entry`.

## Captured payloads (<dev-tenant>, 2026-05-29 via Playwright trace)

### Wire location

```
PUT /wifiNetworks/{networkId}   ← full WLAN config replacement, async (returns 202)

Body shape (relevant slice):
{
  "name": "...",
  "type": "guest",
  "guestPortal": {
    "guestNetworkType": "GuestPass",   // or any of the 9 captive-portal sub-types
    "walledGardens": ["probe.example.com"],   // ← THE FIELD
    ... other guestPortal fields ...
  },
  ... ~27 other top-level WLAN fields ...
}
```

### GET-back behavior

`GET /wifiNetworks/{networkId}` returns the full WLAN config. `guestPortal.walledGardens` is present **only when non-empty** — empty lists are omitted from the response, so a tool reading the current allowlist must treat a missing key as "empty list" (not "error").

### Observed against <example-guest-pass-wlan> (Guest Pass, dev tenant)

- Before: GET response had no `walledGardens` key in `guestPortal`.
- Added `probe.example.com` via GUI → POST returned 202 → GET after returned `guestPortal.walledGardens: ["probe.example.com"]`.
- Cleared via Walled Garden Clear button → state restored to baseline. Tenant clean.

## Key API constraint

**R1 exposes no granular endpoints** like `POST /wifiNetworks/{id}/walledGardens` or `DELETE /wifiNetworks/{id}/walledGardens/{entry}`. The GUI itself does **retrieve-then-update**: GET the full WLAN, splice in the modified `walledGardens` array, PUT the full WLAN back. Every Apply re-sends ~28 top-level fields.

→ Each of our 3 tools must internally do retrieve-then-update. This is **Pattern 2** in `.claude/rules/mcp-tool-patterns.md` (full-config preservation), with companion calls cascading through portal-profile re-association and RADIUS settings PUTs (mirroring what `createWifiNetworkWithRetry` does today).

## Scope finding — issue author's assumption was wrong

The issue speculates walled garden is a **per-venue** setting (Network Control → Venues → Wi-Fi → Walled Garden). **Confirmed false** by GUI recon: venue detail → Services tab has only DHCP / mDNS Proxy / Client Isolation Allowlist sub-tabs, no Walled Garden. Walled garden is **per-WLAN only**, accessed in the WLAN edit form's Host Settings tab.

This simplifies the tool surface — every tool takes a `networkId`, not a `venueId`.

## Proposed tool surface (3 tools)

```
query_walled_garden(networkId) → { entries: string[] }
add_walled_garden_entry(networkId, entry: string) → async
remove_walled_garden_entry(networkId, entry: string) → async
```

Each modify tool internally:
1. GET the full WLAN config.
2. Compute the new `guestPortal.walledGardens` array (append for add; filter-out for remove).
3. PUT the full WLAN config back. Returns `requestId` → poll `getRuckusActivityDetails` until terminal.
4. Idempotent: `add` on an existing entry is a no-op; `remove` on a missing entry is a no-op (no error, since the caller's intent was "make sure it's gone").

Service layer can share a helper:

```ts
async function mutateWalledGarden(
  token, networkId, region,
  mutator: (current: string[]) => string[],
  maxRetries, pollIntervalMs
): Promise<any> { /* retrieve-then-update + poll */ }
```

`add_*` and `remove_*` just supply different mutator closures.

### Alternative considered: single `set_walled_garden` tool

One tool taking a complete array, replacing wholesale. Smaller API surface but forces every caller to do the read-merge dance, which is exactly the friction issue #91 is asking to remove. **Rejected** in favor of the 3-tool surface that matches the QA Phase A → Phase B workflow.

### Tool descriptions (sketch)

- `query_walled_garden`: "Get the captive-portal walled-garden allowlist (URLs and IP subnets reachable pre-auth) for a WiFi network. REQUIRED: networkId (use query_wifi_networks to get network ID). Returns the current entries as an array of strings; returns an empty array if the WLAN has no entries or if walled garden does not apply to its security type. Read-only — does not modify state."
- `add_walled_garden_entry`: "Add a single URL/host/subnet to the captive-portal walled-garden allowlist for a WiFi network. Idempotent — adding an existing entry is a no-op. PREREQUISITE: WLAN must be a captive-portal type (guestPass, clickThrough, selfSignIn, hostApproval, cloudpath, wispr, directory, saml, workflow). REQUIRED: networkId (use query_wifi_networks to get network ID) + entry (the hostname pattern, URL, or IP subnet to permit pre-auth)."
- `remove_walled_garden_entry`: same shape as add, idempotent.

## Test coverage

One YAML lifecycle test covering all 3 tools:

```
TC-INT-XXX:
  1. Create a captive-portal WLAN (Guest Pass)
  2. query_walled_garden → expect []
  3. add_walled_garden_entry "probe.example.com"
  4. query_walled_garden → expect ["probe.example.com"]
  5. add_walled_garden_entry "probe.example.com"  (idempotency)
  6. query_walled_garden → still ["probe.example.com"]
  7. add_walled_garden_entry "second.example.com"
  8. query_walled_garden → expect both
  9. remove_walled_garden_entry "probe.example.com"
 10. query_walled_garden → expect ["second.example.com"]
 11. remove_walled_garden_entry "second.example.com"
 12. query_walled_garden → expect []
 13. remove_walled_garden_entry "ghost.example.com"  (idempotency)
 14. Cleanup: delete WLAN, delete portal profile
```

## Files to touch (estimated)

- `src/services/ruckusApiService.ts` — add `queryWalledGarden`, `addWalledGardenEntry`, `removeWalledGardenEntry`, and the shared `mutateWalledGarden` helper. Reuse existing `getWifiNetwork` (already in the file).
- `src/mcpServer.ts` — register 3 new tools + 3 handlers following the templates in `.claude/rules/mcp-tool-patterns.md`.
- `cicd/tests/testcases/integration/TC-INT-XXX.yml` — 1 lifecycle test.

## Out of scope

- Bulk replace (`set_walled_garden`) — can be added later if a workflow needs it.
- Walled-garden support for non-captive-portal WLAN types — R1 only allows walled garden on captive-portal networks, so guarding by `nwSubType=guest` at the service layer is sufficient.
- Validation of entry format (hostname vs IP subnet) — defer to R1. Surface 422 errors to the caller.

## Refs

- Issue #91 (GitHub)
- <internal-ticket> TS-03-TC-02 (TestLink <internal-ticket>) — the test that needs this
- Recon trail: WLAN PUT body captured 2026-05-29 against <example-guest-pass-wlan> on <region>.ruckus.cloud tenant `<dev-tenant>`
- Related: STORY-017 / PR #93 — same overall WLAN payload shape; walled-garden field already populated as `walledGardens: []` in the default `guestPortal` block at `src/services/ruckusApiService.ts:4439, 4512`
