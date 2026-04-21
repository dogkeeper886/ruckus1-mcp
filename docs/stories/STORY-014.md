# STORY-014: Self Sign-In SMS and WhatsApp Channel Support

## User Story

As a QA engineer,
I want `create_wifi_network` to accept SMS and WhatsApp as Self Sign-In OTP channels in addition to Email,
So that I can automate test precondition setup for SMS/WhatsApp captive-portal flows (ACX-60786, ACX-105619) in a single tool call instead of creating via Email and patching via `update_wifi_network`.

## Description

The `create_wifi_network` tool currently hardcodes Self Sign-In to Email-only:

- `src/services/ruckusApiService.ts:4418-4420` sets `enableSmsLogin: false`, `enableEmailLogin: true`, `enableWhatsappLogin: false` unconditionally.
- `src/services/ruckusApiService.ts:4436` hardcodes `allowSign: ["enableEmailLogin"]`.
- `src/services/ruckusApiService.ts:4423` hardcodes `socialEmails: true`.
- `src/mcpServer.ts:1708` description says "selfSignIn (Self Sign-In with Email)".

The R1 API already accepts three OTP channels — `enableSmsLogin`, `enableEmailLogin`, `enableWhatsappLogin` — and an `smsPasswordDuration` object. Captured from the dev.ruckus.cloud UI on 2026-04-21 via `POST https://api.dev.ruckus.cloud/wifiNetworks`:

```json
"guestPortal": {
  "guestNetworkType": "SelfSignIn",
  "enableSmsLogin": true,
  "enableEmailLogin": false,
  "enableWhatsappLogin": false,
  "smsPasswordDuration": { "duration": 12, "unit": "HOUR" },
  "socialDomains": [],
  "socialEmails": false,
  ...
}
```

Today the only workaround is: create an Email Self Sign-In via the tool, then flip channels via `update_wifi_network` with a raw `networkConfig` pass-through — two steps, bypasses the typed schema, and breaks declarative test fixtures.

## Acceptance Criteria

- [x] `create_wifi_network` accepts new boolean parameters for `type=selfSignIn`: `enableSmsLogin`, `enableEmailLogin`, `enableWhatsappLogin`
- [x] `create_wifi_network` accepts `smsPasswordDuration` as `{ duration: number, unit: "MINUTE" | "HOUR" | "DAY" }` (only meaningful when SMS is enabled)
- [x] Validation: at least one of the three `enable*Login` flags must be `true`
- [x] `allowedEmailDomains` becomes optional — required only when `enableEmailLogin=true`
- [x] Backwards-compatible default: when none of the three flags are specified, behave as today (`enableEmailLogin=true`, others `false`) so existing callers keep working
- [x] Wire payload reflects the selected channels:
  - `guestPortal.enableSmsLogin` / `enableEmailLogin` / `enableWhatsappLogin` set from inputs
  - `guestPortal.smsPasswordDuration` emitted when SMS is on (default `{ duration: 12, unit: "HOUR" }`); when SMS is off, keep the current shape (preserves email session duration path)
  - `guestPortal.socialEmails` = `enableEmailLogin`
  - `guestPortal.socialDomains` = `allowedEmailDomains` when email is on, else `[]`
  - `allowSign` built from which `enable*Login` flags are true
  - `allowedDomainsCheckbox` = `allowedEmailDomains.length > 0`
- [x] Tool description updated: replace the single "FOR SELF SIGN-IN WITH EMAIL" paragraph with per-channel guidance and the at-least-one-channel rule
- [ ] Existing `type=selfSignIn` Email tests (TC-INT-320-ish / temporary-connection tests) still pass (tracked in #68)
- [ ] New integration test covers SMS-only Self Sign-In creation and verifies persisted `enableSmsLogin=true` + `smsPasswordDuration` round-trip (tracked in #68)

## Technical Notes

- Affected files:
  - `src/services/ruckusApiService.ts` — replace the hardcoded block at lines ~4404-4440
  - `src/mcpServer.ts` — add schema fields at ~1708 (enum description), ~1760 (`allowedEmailDomains` description), and new props; propagate them through the service call site at ~5959
- MCP tool: `create_wifi_network` (extend existing tool, no new tools needed)
- Wire-format gotchas confirmed from capture:
  - `smsPasswordDuration.unit` is one of `MINUTE` / `HOUR` / `DAY`. UI default for SMS is `12 HOUR`.
  - Current code reuses `smsPasswordDuration` to encode email session duration in `DAY` units. That's unrelated to real SMS OTP expiry — worth flagging as a pre-existing quirk; keep behavior unchanged for the email path to avoid scope creep.
  - `allowSign` and `allowedDomainsCheckbox` appear to be UI-state mirrors. The server likely doesn't need them, but the current code already sends `allowSign` so keep parity; set both based on the inputs.
  - `socialIdentities: {}`, `socialDomains`, `socialEmails` remain in the payload shape — unchanged from today except `socialEmails` becomes conditional on `enableEmailLogin`.
- WhatsApp prerequisite: On dev tenant the WhatsApp UI checkbox is disabled even with feature flag `whatsapp-self-sign-in-toggle: on`. Direct-API probe on 2026-04-21 confirmed the **backend accepts `enableWhatsappLogin=true`** and persists the flag successfully — the UI disable is purely client-side tenant-provisioning gating (likely missing WhatsApp business settings). Accordingly, the MCP tool does not gate WA client-side; callers can flip it on regardless of UI state.
- Related issue: #67
- API capture artifact: `POST https://api.dev.ruckus.cloud/wifiNetworks` followed by `PUT /wifiNetworks/{id}/portalServiceProfiles/{profileId}` and `PUT /wifiNetworks/{id}/radiusServerProfileSettings` (captured 2026-04-21 on tenant `213ae01ae5464745833a1f6ffc3148a8`)

## Status

- Created: 2026-04-21
- Tasks: #67 (implementation), #68 (tests)
- PR: #69 (2026-04-21) — verified 5/5 integration tests pass on live dev tenant
- Implementation: in review
- Tests: in review
