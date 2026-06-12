# STORY-029: Bind a Click-Through WiFi network to an Identity Group

Tracks GitHub issue #158.

## User Story

As an AI agent setting up a Click-Through captive-portal network,
I want to associate an Identity Group with the WiFi network and see that association
when I read the network back,
So that I can script the same onboarding setup the R1 admin GUI offers, instead of
hitting a dead end where the binding is GUI-only and invisible to the API.

## The Need

The R1 admin GUI clearly binds an Identity Group to a Click-Through network, but the
MCP cannot reach that binding from either direction:

- **Can't read it.** `get_wifi_network` returns a WLAN object with no identity-group
  field anywhere — the binding the GUI shows is simply absent from the payload we get
  back. We suspect the WLAN GET is using an API version older than the one that
  surfaces the association.
- **Can't write it.** `create_wifi_network` and `update_wifi_network` expose no way to
  set an Identity Group; their only sub-resource associations today are portal,
  RADIUS, accounting, directory, and SAML profiles.

This surfaced while setting up a Click-Through guest network for a captive-portal test
(ACX-61894): the Identity Group association could not be found or scripted at all,
blocking automated setup of that test scenario.

## Success Looks Like

- An agent can create a Click-Through network and bind it to an Identity Group in one
  scripted flow — no manual GUI step.
- An agent can add or change the Identity Group binding on an existing network through
  the update path.
- Reading the network back makes the Identity Group binding observable, so a test can
  assert it round-trips.
- We have a written, confirmed answer to *why* the binding was invisible — which API
  version / endpoint surfaces it — so the gap is understood, not just patched.

## Open Questions

*(The "how" — resolved on the issue via the live GUI trace already in progress.)*

- **Where the binding actually lives.** Is the Identity Group held on the WLAN object
  under a newer API version, or on the identity-group side / a dedicated association
  endpoint? The GUI network trace (captured via Playwright against dev tenant
  `213ae01ae5464745833a1f6ffc3148a8`, network `625e8f45c1e146dc924b23932a855762`
  `tc-clickthru-network`) is the source of truth for the real endpoint, method, API
  version header, and body.
- **The GET version mismatch.** Confirm the `Content-Type`/version the MCP uses for the
  WLAN GET vs. what the GUI uses, and whether bumping it is what surfaces the binding —
  weigh against the risk of changing the shape every other WLAN reader depends on.
- **Write shape.** Whether the binding is set inline on create/update or via a separate
  sub-resource call (the pattern create/update already use for portal/RADIUS/etc.), and
  what the new parameter should be called.
- **Scope of the binding.** Is identity-group binding specific to Click-Through, or does
  it apply to other captive-portal flows too?

## Status

- Created: 2026-06-12
- Issues: #158
- Plan: #161
- Tasks: #162, #163, #164, #165
- PR: #167 (write/bind path; read-back unresolved — #165)
