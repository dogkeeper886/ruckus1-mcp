# STORY-015: SMS Provider Management (Twilio)

## User Story

As a QA engineer,
I want MCP tools to configure, read, and remove the per-tenant Twilio SMS provider,
So that I can fully automate Self Sign-In SMS / WhatsApp test preconditions (<internal-ticket>, <internal-ticket>) end-to-end, instead of requiring a human to prime each fresh tenant through the RUCKUS One UI.

## Description

On a fresh RUCKUS One tenant, the SMS Token channel's full delivery (beyond the 100-message free pool) and the **WhatsApp** channel on Self Sign-In networks both remain gated until an SMS provider is configured at `Administration → Account Management → Settings → SMS Brand and Provider Setup`. STORY-014 added the `enableSmsLogin` / `enableWhatsappLogin` flags, but without the provider plumbed, end users don't receive OTPs. This story unblocks that.

Live capture on <region>.ruckus.cloud 2026-04-21 revealed the API shape:

### Reads
- `GET /notifications/sms` → `{threshold, provider, brandName, ruckusOneUsed}` — brand + SMS-pool singleton
- `GET /notifications/sms/providers/twilios` → `{accountSid, authToken, fromNumber, enableWhatsapp, authTemplateSid}` — Twilio record; all fields `null` when unconfigured

### Writes (async, 202 with requestId)
- `POST /notifications/sms` body `{threshold, provider, brandName}`
- `POST /notifications/sms/providers/twilios` body `{accountSid, authToken, fromNumber, enableWhatsapp, authTemplateSid}`
  - `fromNumber` is an overloaded string: `"+E.164"` for phone-number mode, `"<Service Name> [MG<32hex>]"` for messaging-service mode (the UI inspects the prefix to render the radio choice)

### Delete (sync 200, plain text)
- `DELETE /notifications/sms/providers/twilios` → text body `"Twilio configuration deleted successfully."`

### Twilio live-validation helpers (sync POST, used by UI to populate dropdowns — not first-classed in this story)
- `POST .../twilios/incomingPhoneNumbers` body `{accountSid, authToken}`
- `POST .../twilios/messagingServices` body `{accountSid, authToken}`
- `POST .../twilios/templateApprovalStatus` body `{accountSid, authToken, authTemplateSid}`

## Acceptance Criteria

- [ ] `create_sms_provider` MCP tool exists and handles both POSTs (`/notifications/sms` brand + `/notifications/sms/providers/twilios` creds) in one call, polling both async activities until SUCCESS or timeout
- [ ] `create_sms_provider` input: `accountSid`, `authToken`, `fromNumber`, optional `brandName`, `threshold` (default 80), `provider` (default `TWILIO`), `enableWhatsapp` (default false), `authTemplateSid` (required when `enableWhatsapp=true`)
- [ ] Client-side validation: `enableWhatsapp=true` requires `authTemplateSid`
- [ ] `get_sms_provider` returns `{ brand: {...}, twilio: {...} }` combining both GETs in one response
- [ ] `delete_sms_provider` issues `DELETE /notifications/sms/providers/twilios`; synchronous 200 with plain-text confirmation is surfaced cleanly
- [ ] Back-and-forth smoke test via the `ruckus1` MCP server against live dev tenant: delete → get (empty) → create → get (populated) → delete (empty again)
- [ ] Tool descriptions follow the repo's PREREQUISITE/REQUIRED conventions and cross-reference the Twilio live-validation dropdowns as discovery hints

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts` (three new service functions), `src/mcpServer.ts` (three tool definitions + handlers)
- Async polling uses the multi-step fan-out pattern (Advanced Pattern 1/5 in `mcp-tool-patterns.md`) across both `brandRequestId` and `twilioRequestId`
- DELETE returns plain text, not JSON — wrap the response text in `{status, message}` so callers see a consistent shape
- Esendex / Other SMS providers are **out of scope** for this story; tool accepts only `TWILIO` as the `provider` value. Add future issues if those get real demand.
- Twilio-discovery helper tools (`query_twilio_phone_numbers`, etc.) are deferred. Callers can pass the already-known `fromNumber` / `authTemplateSid` values directly (they're visible in the UI dropdowns or Twilio console).
- Related issue: #70
- Depends on / continues from: STORY-014 (which exposes the `enable*Login` flags that require an SMS provider to actually deliver OTPs)

## Status

- Created: 2026-04-21
- Implementation: pending
- Tests: pending
