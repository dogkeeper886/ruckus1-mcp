# STORY-012: OWE Transition and DSAE Network Creation

## User Story

As a QA engineer,
I want to create OWE Transition and DSAE (DPSK WPA2/WPA3-Mixed) networks via the MCP tool,
So that I can automate test precondition setup for dual-network scheduling tests instead of creating them manually through the GUI.

## Description

The `create_wifi_network` tool currently supports `psk`, `enterprise`, `open`, `guest`, and `selfSignIn` network types but cannot create two dual-network types needed for TS-08 (Dual-Network Type Scheduling) test automation:

1. **OWE Transition networks** -- An Open network with OWE encryption and OWE Transition mode enabled. The API automatically creates a dual-network pair: an OWE-encrypted primary network and an Open companion network with a `-owe-tr` suffix.

2. **DSAE networks (DPSK WPA2/WPA3-Mixed)** -- A DPSK network with WPA2/WPA3-Mixed security protocol. The API automatically creates a dual-network pair: a WPA2/WPA3-Mixed service network and a WPA2 onboard companion network with a `-dpsk3-wpa2` suffix.

Both types are currently created manually via the GUI:
- OWE: Wi-Fi > Add > Open Network > OWE encryption ON > OWE Transition mode ON
- DSAE: Wi-Fi > Add > DPSK > Security Protocol = WPA2/WPA3 mixed mode

## Acceptance Criteria

- [x] `create_wifi_network` supports OWE Transition: `type=open` + `oweEnabled=true` + `oweTransitionEnabled=true`
- [x] OWE Transition sets correct payload fields (`wlanSecurity=OWETransition`, `enableOweTransition=true`, `clientIsolation=true`, no MFP)
- [ ] `create_wifi_network` supports DSAE: `type=dpsk` + `wlanSecurity=WPA23Mixed` (deferred)
- [ ] DSAE sets correct payload fields (deferred)
- [x] OWE Transition creates successfully via API and produces dual-network pair
- [x] Existing network type creation (psk, enterprise, open, guest, selfSignIn) remains unaffected
- [x] Tool description updated with usage instructions for OWE Transition

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tool: `create_wifi_network` (extend existing tool, no new tools needed)
- New parameters for OWE: `oweEnabled` (boolean), `oweTransitionEnabled` (boolean)
- API payload: `wlanSecurity: "OWETransition"` + `enableOweTransition: true` (top-level)
- OWE Transition does NOT include `managementFrameProtection` in payload
- `clientIsolation` defaults to `true` for OWE Transition
- Activation uses existing `activate_wifi_network_at_venues` — companion network activated automatically
- Related issue: #35

## Status

- Created: 2026-04-12
- OWE Transition: implemented (2026-04-12)
- DSAE: deferred
- Tests: none
