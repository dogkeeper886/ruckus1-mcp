# STORY-016: Portal Service Profile T&C Fields (Tiptap Config + URL Mode)

## User Story

As a QA engineer,
I want MCP tools to set the new Terms & Conditions fields (`termsConditionConfig`, `termsConditionUrl`, and the `componentDisplay.termsConditions` toggle) on portal service profiles,
So that I can validate the ACX-115080 flag-gated T&C feature end-to-end through MCP without driving the admin UI.

## Description

The R1 backend added T&C-related fields to the Portal Service Profile API per **ACX-115080** (HLD Confluence page `897220609`, last modified 2026-05-19). The feature flag `guest-t-and-c-checkbox-url-toggle` is ON for QA tenant `dog1051` and the admin UI now uses these fields. The existing `create_portal_service_profile` / `update_portal_service_profile` MCP tools accept a free-form `content` blob, so the wire-level capability is already there — but no top-level params surface the new fields, so an agent reading the tool schema has no signal they exist or how to shape `termsConditionConfig`.

### Captured payloads (dog1051, 2026-05-27 via Playwright trace)

**Rich-doc mode (Tiptap config):**

```json
{"content":{
  "termsCondition":"",
  "termsConditionConfig":{"type":"doc","content":[{"type":"paragraph","content":[
    {"type":"text","text":"By connecting to this network, you agree to use it lawfully and responsibly. Read our privacy policy for details."}]}]},
  "termsConditionUrl":"",
  "componentDisplay":{"...":"...","termsConditions":true}
}}
```

**Link-to-URL mode:**

```json
{"content":{
  "termsCondition":"",
  "termsConditionUrl":"https://example.com/terms",
  "componentDisplay":{"...":"...","termsConditions":true}
}}
```

Note: in URL mode the admin UI **omits** `termsConditionConfig` entirely — it does not send `{}`. Mutual exclusion is signaled by omission, server-enforced.

### Schema for `termsConditionConfig` (Tiptap doc)

Allowed node types: `doc`, `paragraph`, `text`, `hardBreak`. Allowed marks on `text`: `link` (with `attrs.href`). Server validates depth ≤10, ≤700 paragraphs, ≤100 text nodes/paragraph, ≤60k chars total, and `http`/`https` href protocol — error codes `GUEST-422039` through `GUEST-422049`.

## Acceptance Criteria

- [ ] `create_portal_service_profile` accepts optional `terms_condition_config` (object), `terms_condition_url` (string), and `terms_conditions_display` (boolean); handler merges them into `content.termsConditionConfig` / `content.termsConditionUrl` / `content.componentDisplay.termsConditions` before forwarding
- [ ] `update_portal_service_profile` accepts the same three optional params with identical merge semantics
- [ ] Caller's free-form `content` still wins on collision — the new params merge **first**, then caller's `content` spreads on top
- [ ] New `build_terms_condition_config` pure-builder tool (no API call) emits a valid Tiptap `doc` from a `mode` discriminator: `PLAIN` (single text run), `HYPERLINK` (segments with optional `href` for `link` mark), `MULTILINE` (lines joined by `hardBreak`). Output passes verbatim to `terms_condition_config`
- [ ] `get_portal_service_profile` / `query_portal_service_profiles` round-trip the new fields (already pass-through; verified by test)
- [ ] Tool descriptions follow PREREQUISITE/REQUIRED conventions in `.claude/rules/tool-descriptions.md`, with a `FOR TERMS & CONDITIONS:` block listing the three modes
- [ ] Integration test TC-INT-333 covers: rich-doc create (byte-match captured payload) → GET round-trip → update to URL mode → GET round-trip → delete; all fixtures suffixed with `{{TEST_RUN_ID}}`

## Technical Notes

- Affected files: `src/mcpServer.ts` only (tool schemas + handlers + builder). **No** `src/services/ruckusApiService.ts` change — the service forwards `content` verbatim already; the merge of new params into `content.*` happens in the handler. This differs from the `temporaryConnection` precedent (which merged in the service) because the portal service has no per-field assembly logic.
- Mutual exclusion is server-enforced (`GUEST-422xxx`); no client-side validation. Follows the project rule "no error handling for impossible scenarios" — surface the server response.
- Tiptap node/mark validation (depth, paragraph count, href protocol) is the server's job. The builder produces only valid shapes by construction so common callers stay inside the limits.
- `build_terms_condition_config` follows the Pure Builder Pattern in `.claude/rules/mcp-tool-patterns.md` — `build_*` prefix, `mode` discriminator, handler-only, no service function, no token, no polling. Precedent: `build_wifi_scheduler_config`.
- Related GitHub issue: #89
- Driving Jira: ACX-117673 (this MCP work); upstream backend: ACX-115080
- HLD: Confluence page `897220609` (ACX space)

## Status

- Created: 2026-05-27
- Implementation: complete (issue #89)
- Tests: TC-INT-333 passing
