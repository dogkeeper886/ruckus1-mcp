# STORY-017: Expose Portal Type on `create_wifi_network`

Tracks GitHub issue #92.

## User Story

As an AI agent calling `create_wifi_network`,
I want a clear, enumerable choice for which captive-portal flow the resulting WLAN renders,
So that I never have to guess and never silently default the user into Guest Pass when they asked for Click-Through (or any of the other 7 portal types).

## Problem

`create_wifi_network` exposes `type=guest` as one black-box value. R1 actually has 9 distinct captive-portal flows under WLAN `nwSubType=guest`, distinguished by a sub-field `guestPortal.guestNetworkType` on the WLAN payload. The MCP hardcodes that field to `"GuestPass"` (and `"SelfSignIn"` for `type=selfSignIn`), leaving the other 7 flows unreachable via the schema.

Discovered during ACX-115080 TS-03-TC-01 on 2026-05-28 when a Click-Through-intended WLAN silently rendered the Guest Pass password page. Blocks ACX-115080 TS-04 series outright.

## Captured payloads (dog1051, 2026-05-28 via Playwright trace)

**WLAN POST `/wifiNetworks` body (Click-Through):**

```json
{
  "name": "probe-wlan-portaltype-20260528",
  "type": "guest",
  "isCloudpathEnabled": false,
  "wlan": { "ssid": "...", "wlanSecurity": "None", ... },
  "guestPortal": {
    "guestNetworkType": "ClickThrough",
    "enableSelfService": true,
    "endOfDayReauthDelay": false,
    "lockoutPeriod": 120,
    "lockoutPeriodEnabled": false,
    "macCredentialsDuration": 240,
    "maxDevices": 1,
    "userSessionGracePeriod": 60,
    "userSessionTimeout": 1440,
    "walledGardens": []
  },
  "redirectCheckbox": false,
  "enableDhcp": false
}
```

The portal profile is attached via a **separate** `PUT /wifiNetworks/{id}/portalServiceProfiles/{profileId}` call — same pattern the MCP already uses.

## Where the bug lives in code

`src/services/ruckusApiService.ts:4393-4408`:

```ts
if (isGuestType) {
  basePayload.guestPortal = networkConfig.guestPortal || {
    guestNetworkType: "GuestPass",   // ← hardcoded default
    enableSelfService: true,
    ...
  };
}
```

`networkConfig.guestPortal` is typed `any`. A sophisticated caller can already override `guestNetworkType` by passing a whole `guestPortal` object — but the agent has no schema signal that `guestNetworkType` exists or what values are valid.

## The 9 portal types (GUI radio labels → wire values)

The R1 admin GUI's WLAN-create wizard exposes 9 radios under "Portal Type" when the user picks "Captive Portal" security. Wire values for `guestPortal.guestNetworkType`, captured 2026-05-28 by reading the radio inputs' `value` attribute directly from the rendered DOM on dev.ruckus.cloud (single source of truth — these are the exact strings the frontend POSTs):

| # | GUI label | Wire value | How confirmed |
|---|---|---|---|
| 1 | Click-Through | `ClickThrough` | live POST trace |
| 2 | Self Sign In | `SelfSignIn` | DOM `value` + matches existing `i18n-PT-Email` WLAN |
| 3 | Cloudpath Captive Portal | `Cloudpath` | DOM `value` (wizard blocked on RADIUS/URL; could not full-submit) |
| 4 | Host Approval | `HostApproval` | live POST trace |
| 5 | Guest Pass | `GuestPass` | DOM `value` + matches existing `TS03-TC02-LinkToURL` WLAN |
| 6 | 3rd Party Captive Portal (WISPr) | `WISPr` | DOM `value` |
| 7 | Active Directory/LDAP Server | `Directory` | DOM `value` — **surprise**, not `ADLDAP` |
| 8 | SAML Identity Provider (IdP) | `SAML` | DOM `value` |
| 9 | Workflow | `Workflow` | DOM `value` |

### Notes on the values

- **AD/LDAP** is `Directory`, NOT `ADLDAP` or `ActiveDirectory`. The GUI label is misleading.
- **WISPr** and **SAML** are all-uppercase, NOT PascalCase. Treat the strings as opaque identifiers — don't normalize.
- The WLAN list column in the GUI displays user-friendly versions (e.g. "Captive Portal - Managed Guest Pass" for `GuestPass`); the wire value remains the radio's `value` attribute.

### Top-level WLAN security types

The same wizard's first step exposes 6 security-type radios; their `value` attributes match the MCP's existing `type` enum. Captured for reference:

| GUI label | `type` value (MCP-side) |
|---|---|
| Passphrase (PSK/SAE) | `psk` |
| Dynamic Pre-Shared Key | `dpsk` |
| Enterprise AAA (802.1X) | `aaa` (MCP exposes as `enterprise`) |
| Hotspot 2.0 Access | `hotspot20` (not in MCP enum today) |
| Captive Portal | `guest` |
| Open Network | `open` |

## Discriminator field name asymmetry

| Direction | Field |
|---|---|
| `POST /wifiNetworks` body | `guestPortal.guestNetworkType` (nested) |
| `GET /wifiNetworks/query` response | top-level `captiveType` (same string values) |
| `nwSubType` | unchanged — stays `"guest"` for all 9 |

Both names already appear in the codebase (`captiveType` in default query fields at `mcpServer.ts:1714`, `6106`; `guestNetworkType` hardcoded twice in `ruckusApiService.ts` at 4395, 4461).

## Portal service profile is type-agnostic

`POST /portalServiceProfiles` body carries **no** portal-type field. Body is `{name, content}` where `content` is styling/text only. The GUI's "View as: Click Through / Guest Pass - Connect" combobox is a preview-switcher and does not persist.

→ The fix does **not** touch `create_portal_service_profile` / `update_portal_service_profile`.

## Planned change

**Two files only.** Two interface options — both expose the choice clearly to the agent.

### Option A — split the `type` enum (preferred)

`src/mcpServer.ts:1778` — replace `guest` with `guestPass | clickThrough | hostApproval | adLdap | samlIdp | cloudpath | wispr | workflow`. (Keep `selfSignIn` as-is — it already maps to `nwSubType=guest` + `guestNetworkType=SelfSignIn` internally.)

### Option B — add a `portalType` field alongside `type=guest`

`src/mcpServer.ts:1778` — keep `type=guest`; add `portalType` enum at the top level (`guestPass | clickThrough | ...`) with `guestPass` as default for backward compat.

### Handler (both options)

`src/services/ruckusApiService.ts:4393-4408` — replace the hardcoded `"GuestPass"` literal with a switch on the chosen value, falling through to `"GuestPass"` when absent.

### Schema description

Each value needs a `FOR <TYPE>:` clause in the tool description per `.claude/rules/tool-descriptions.md` — so the agent reads, picks correctly, and never lands on the wrong portal flow.

## Open questions

- **Option A vs Option B**: A is what issue author leans toward and removes the "guest" overload; B is fully backward-compatible. Pick before implementation.
- **Per-type extra payload fields**: Cloudpath sets `isCloudpathEnabled: true` (observed `false` in Click-Through and HostApproval traces) — implies a top-level toggle, not just a `guestNetworkType` value. HostApproval requires `guestPortal.hostContacts` (radio: EntireDomain / SpecificEmails + domain/email list). SAML / Directory / WISPr / Workflow likely need server-profile references and additional payload fields, captured only at full-submit time. **Each of those 5 needs a separate trace once external dependencies (Cloudpath account, RADIUS profile, AD server profile, SAML IdP metadata) are available**, to discover the additional required fields. The discriminator string itself is locked in by the DOM-value capture; only the *companion* fields remain unknown for full feature parity.

## Test coverage

3 YAML tests today (one per confirmed type): ClickThrough, GuestPass, SelfSignIn. Add one per type as wire values are confirmed.

## Refs

- Issue #92 (GitHub)
- ACX-115080 TS-03-TC-01 execution log, 2026-05-28
- Probe trace artifacts (deleted after recon, not committed): `wlan-clickthrough-create.json`, `wifinetworks-query-after-create.json`
