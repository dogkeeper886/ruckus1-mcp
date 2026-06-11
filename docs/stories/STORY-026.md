# STORY-026: Surface the "Marketing Communication" opt-in component on portal service profiles

## User Story

As an AI agent calling `create_portal_service_profile` / `update_portal_service_profile`,
I want to configure a Guest Portal's **Marketing Communication** opt-in (which contact
fields it collects and the consent text shown),
So that I can build captive portals that capture marketing consent — without hand-crafting
the underlying `guestForm` / `componentDisplay` JSON or guessing the field names.

## The Need

R1's Guest Portal has a **Marketing Communication** component (Portal Design → Components →
"Marketing Comm") that lets a guest opt in to marketing while connecting. It collects one or
more contact fields (user name, full name, email, phone) and shows a rich-text consent
statement (with an optional hyperlink, e.g. to a privacy policy).

The MCP `create_portal_service_profile` / `update_portal_service_profile` tools already expose
the parallel **Terms & Conditions** component (`content.termsConditionConfig` Tiptap doc +
`content.componentDisplay.termsConditions`, with a `build_terms_condition_config` builder), but
Marketing Communication is undocumented and unsupported in the schema. An agent today would
have to reverse-engineer the nested `content.guestForm.*` shape to use it, and would have no
guidance on the GUI's enable rules.

This was traced in the R1 dev GUI on 2026-06-11 (Network Control → Service Catalog → Portal →
Add → Guest Portal → Components → Marketing Comm) to capture the exact payload (below).

## Success Looks Like

- An agent can create or update a portal profile with Marketing Communication enabled by
  specifying which contact fields to collect (and whether each is required) and the consent
  text — through clear, documented tool parameters, the same way Terms & Conditions works.
- The consent text supports rich formatting, including an optional hyperlink (e.g. to a
  privacy policy), the same way the Terms & Conditions text does.
- The GUI's enable rule is honored or clearly surfaced: the component requires **Email and/or
  Phone Number** to be enabled, plus consent content.
- A round-trip (create → `query_portal_service_profiles`) shows the marketing fields persisted.

## Captured payload (`<dev-tenant>`, 2026-06-11 via Playwright trace)

`POST /portalServiceProfiles` → `201` (async; returns `{ requestId, response: { id } }`). The
Marketing-Communication-specific additions to the existing portal `content` object:

```jsonc
"content": {
  // ...existing styling / text / display fields...
  "componentDisplay": {
    "marketingCommunication": true,   // toggles the component on
    // ...other componentDisplay flags (logo, welcome, termsConditions, etc.)...
  },
  "guestForm": {
    "fields": {
      "username": { "enabled": false, "required": false },
      "fullName": { "enabled": false, "required": false },
      "email":    { "enabled": true,  "required": false },   // Email and/or phone must be enabled
      "phone":    { "enabled": false, "required": false }
    },
    "marketingCommunication": {
      "content": {                    // Tiptap / ProseMirror doc — same shape family as termsConditionConfig
        "type": "doc",
        "content": [
          { "type": "paragraph", "content": [
            { "type": "text", "text": "I agree to receive marketing communications." }
          ] }
        ]
      }
    }
  }
}
```

GUI behavior observed:
- Enabling the "Marketing Comm" switch prompts: *"To enable the Marketing Communication option,
  select Email and/or Phone Number on the Settings page and provide Marketing Communication
  content."*
- The "Marketing communications" modal exposes the four field checkboxes, each with a
  "Make it a required field" toggle (disabled until the field itself is checked), plus a
  rich-text content editor with a "Manage Link" action (insert a hyperlink on selected text).

## Open Questions — resolved during #142 (PoC against dev tenant, 2026-06-11)

- **Server enforcement of the Email/Phone rule?** → **Yes, API-enforced.** Enabling marketing
  with neither email nor phone returns HTTP 422 / **`GUEST-422049`** ("When marketingCommunication
  is enabled, at least email or phone field must be enabled"). The tools let the API reject;
  TC-INT-344 pins it.
- **New builder vs reuse?** → **Reuse `build_terms_condition_config`.** Its HYPERLINK output is
  accepted verbatim as the marketing consent doc; no dedicated builder added.
- **How to surface `content.guestForm.fields.*`?** → **Free-form `content` passthrough**, documented
  in prose in the tool descriptions (no inputSchema restructuring), consistent with the existing
  T&C/content handling.
- **Portal-type interaction?** → **None observed.** A profile created with no explicit login-type
  fields accepts marketing fine; marketing does not require a specific portal/login type.
- **Update/merge semantics?** → **Confirmed.** Partial update deep-merges `guestForm.fields`
  (e.g. flip `email.required`, add `phone`) without resending the consent doc; to disable, set
  `componentDisplay.marketingCommunication=false` and null `content.guestForm.marketingCommunication`.

## Status

- Created: 2026-06-11
- Issues: #142
