# STORY-021: Extract `get_ruckus_venues` Handler into a Service Function

Tracks a GitHub issue filed from the `/review-tool` audit on 2026-05-29.

## Goal

Move the inline R1 API call inside the `get_ruckus_venues` handler into a named service function in `src/services/ruckusApiService.ts`, matching the pattern every other tool follows. Reuse the existing private `getRuckusVenues` helper if it exists, or extract the call cleanly.

Not a redundancy issue — a consistency issue. The tool surface stays at 74 tools; only the implementation moves.

> **Status: implemented.** The private `getRuckusVenues` helper is now `export`ed and returns the
> **full** query-response body (`{ data, totalCount, ... }`) — matching what the handler already
> emitted. The `get_ruckus_venues` handler calls it (inline `axios.post` removed; the now-unused
> `axios` import dropped from `mcpServer.ts`), and `resolveVenueIds` calls the same fn, extracting
> `.data`. Wire behavior unchanged; build green; `get_ruckus_venues`-dependent tests pass.

## Why this is worth doing

The audit found that `get_ruckus_venues` is the only registered tool whose handler builds the URL and calls `axios.post` inline. Every other tool routes through a named service function in `src/services/ruckusApiService.ts`. Two reasons this matters:

- **Pattern consistency.** Future agents reading the codebase (human or AI) follow the pattern they see. An inline call invites more inline calls, which gradually erodes the clean separation between protocol layer (mcpServer.ts) and API layer (ruckusApiService.ts).
- **Duplicated logic.** The audit notes that `ruckusApiService.ts` already contains a private `getRuckusVenues` helper used by `updatePrivilegeGroupSimple`'s `resolveVenueIds` — it hits the same `/venues/query` endpoint. The handler's inline call duplicates this. Extracting the handler's call into a shared function eliminates the duplication.

## Evidence from the audit

```yaml
- name: get_ruckus_venues
  registered_at: src/mcpServer.ts:147
  service_function: null            # ← anomaly: every other tool has one
  service_at: null
  operation_type: read-only
  r1_endpoints:
    - method: POST
      path: /venues/query
      always: true
  callers:
    tests: [10 test files]
    code: []
  inputs:
    required: []
    optional_count: 0
    total_params: 0
```

10 test files reference this tool — it's heavily used. So the inline-call pattern has been visible to many readers; the cleanup is overdue but low-impact.

## Proposed change

1. Locate the existing private `getRuckusVenues` helper in `src/services/ruckusApiService.ts` (the audit notes it's used inside `updatePrivilegeGroupSimple`'s `resolveVenueIds`).
2. Promote it to an exported `getRuckusVenues(token, region)` function following the project's read-only pattern (see `.claude/rules/mcp-tool-patterns.md` "Simple GET Pattern").
3. Replace the inline `axios.post` in the `get_ruckus_venues` handler in `src/mcpServer.ts` with a call to the exported service function.
4. Update `resolveVenueIds` (and any other internal caller) to use the exported function rather than its current private duplicate.

The wire-level behavior is unchanged — same endpoint, same payload, same response shape.

## Acceptance criteria

- `getRuckusVenues` exists as an exported function in `src/services/ruckusApiService.ts`, following the read-only Simple GET pattern.
- The `get_ruckus_venues` handler in `src/mcpServer.ts` calls this service function instead of constructing the URL and calling `axios.post` inline.
- Any internal caller that previously had a duplicate inline implementation (notably `updatePrivilegeGroupSimple` → `resolveVenueIds`) now uses the exported function.
- `npm run build` passes.
- All 10 existing tests calling `get_ruckus_venues` still pass without modification — the change is implementation-only.
- Tool inventory regenerated with `/review-tool --rebuild`; the entry for `get_ruckus_venues` should now show `service_function: getRuckusVenues` and `service_at: <line>`.

## Risks and what to watch

- **Behavior must be identical.** This is a refactor, not a feature change. If the new service function adds any defaults, validation, or response transformation that the inline code didn't have, that's a bug. Diff the wire calls carefully.
- **Error-handling shape.** Other service functions handle errors with a try-catch that includes HTTP status + response data + headers. The current inline call may handle errors differently. Match the project pattern.

## What's intentionally out of scope

- Changing the tool's schema, description, or parameters.
- Adding pagination, filtering, or search options. The tool currently has zero input parameters; that's preserved.
- Auditing other tools for similar inline-call patterns. The audit reviewed all 74 tools and only `get_ruckus_venues` exhibited this anomaly; a sweep isn't needed.

## How a future AI agent should approach this

1. Read the current `get_ruckus_venues` handler in `src/mcpServer.ts:147` and the inline `axios.post` it makes.
2. Search for the existing private `getRuckusVenues` helper in `src/services/ruckusApiService.ts` (grep for `getRuckusVenues` excluding `mcpServer.ts`). Compare its shape to the inline call.
3. Decide whether to promote the existing private helper or write a fresh exported function from scratch. Promotion is cheaper if the shapes match; a fresh function is cleaner if the private helper has caller-specific logic baked in.
4. Implement following the patterns in `.claude/rules/mcp-tool-patterns.md` "Simple GET Pattern" — copy parameter order, defaults, and error handling from an existing read-only function like `getRuckusActivityDetails`.
5. Run the existing tests; they should pass unchanged.

## References

- Source audit: `.claude/audit/tool-redundancy-report-2026-05-29.md`
- Source inventory: `.claude/audit/tool-inventory.yml`
- Pattern reference: `.claude/rules/mcp-tool-patterns.md` (Simple GET Pattern)
- Skill that produced these: `.claude/skills/review-tool/SKILL.md`
