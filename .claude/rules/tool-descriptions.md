---
paths:
  - "src/mcpServer.ts"
---

# MCP Tool Description Guidelines

Tool `description` strings and parameter descriptions in `src/mcpServer.ts` are the only signal an AI agent sees when deciding whether and how to call a tool. Write them to be self-contained and actionable.

## Description Structure

1. **Action and purpose** — what the tool does, in one clear sentence.
2. **PREREQUISITE** (if applicable) — required state/condition, with the tool that reaches it.
3. **REQUIRED** — every required parameter, with the tool that produces its value.
4. **Special conditions** — type-specific requirements, warnings, scope notes.

### Template

```
[Action verb] [what it does]. [Additional context]. PREREQUISITE: [condition] (use [tool_name]). REQUIRED: [param1] (use [tool_name] to get [param1]) + [param2] (use [tool_name] to get [param2]). [Special notes].
```

## Examples

**Delete (destructive, has prerequisite):**
```
Permanently delete a WiFi network from RUCKUS One. This removes the network globally and cannot be undone. PREREQUISITE: Network must be deactivated from all venues first (use deactivate_wifi_network_at_venues). REQUIRED: networkId (use query_wifi_networks to get network ID).
```

**Batch (multi-type, scope):**
```
Activate an existing WiFi network at one or more venues. This is a batch operation that activates the network at specified venues in a single call. The network must already be created using create_wifi_network. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueConfigs array (use get_ruckus_venues to get venue IDs). FOR GUEST PASS NETWORKS: Must provide portalServiceProfileId (use query_portal_service_profiles to get ID). FOR PSK NETWORKS: Do not provide portalServiceProfileId. Can activate at a single venue or multiple venues.
```

**Create (type-dependent required fields):**
```
Create a new WiFi network (WLAN/SSID) in RUCKUS One without activating at any venue. The network is created globally and can later be activated at specific venues using activate_wifi_network_at_venues. FOR PSK: Requires passphrase + wlanSecurity=WPA2Personal. FOR GUEST PASS: Requires portalServiceProfileId (use query_portal_service_profiles to get ID) + wlanSecurity=None.
```

## Parameter Descriptions

Every parameter that carries an ID or references another resource **must** name the tool that produces it:

```typescript
networkId: {
  type: 'string',
  description: 'ID of the WiFi network to delete (use query_wifi_networks to find network ID)'
},
venueIds: {
  type: 'array',
  items: { type: 'string' },
  description: 'Array of venue IDs (use get_ruckus_venues to get venue IDs). Can contain one venue or multiple venues.'
},
portalServiceProfileId: {
  type: 'string',
  description: 'Portal service profile ID (use query_portal_service_profiles to get ID)'
},
apGroups: {
  type: 'array',
  items: { type: 'string' },
  description: 'Array of AP group IDs (use get_ruckus_ap_groups to get AP group IDs). Required only if isAllApGroups is false'
}
```

## Required Elements by Operation Type

- **Destructive** (delete/remove): include "Permanently" and "cannot be undone".
- **With prerequisite state**: use "PREREQUISITE:" + the tool that changes the state.
- **Multiple required parameters**: use "REQUIRED:" followed by the list, each with its producer tool.
- **Type-dependent behavior**: use "FOR [TYPE]:" to separate per-type requirements.
- **Single vs. batch**: explicitly say "Can operate on a single X or multiple Xs" (or the inverse).
- **Usage hints**: include common default values ("Use 'Both' for most cases").

## Anti-Patterns

- ❌ `'ID of the network'` — no producer tool reference.
- ❌ "should be deactivated" — vague; say "must be deactivated from all venues first".
- ❌ Missing PREREQUISITE on destructive operations.
- ❌ Not saying which tool produces required IDs.
- ❌ Unclear scope — is this permanent? reversible? single? batch? global? venue-specific?

## Review Checklist

Before committing a new or modified tool definition in `src/mcpServer.ts`:

- [ ] Clear action verb and purpose.
- [ ] PREREQUISITE section present if applicable (with tool reference).
- [ ] REQUIRED section with every required parameter (with tool references).
- [ ] Type-specific requirements stated with "FOR X:" / "FOR Y:".
- [ ] Scope clarified (single/batch, permanent/reversible, global/venue-specific).
- [ ] Every parameter description that carries an ID names its producer tool.
- [ ] Destructive/permanent operations carry explicit warnings.
