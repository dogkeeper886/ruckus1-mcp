# STORY-013: Venue WiFi Scheduler Management (Legacy + New Format)

## User Story

As a QA engineer or network operator,
I want MCP tools to configure per-venue WiFi schedulers in both the legacy bitmask format and the new BASIC/ADVANCED scheduled-activation format,
So that I can automate Scheduled Network Activation test cases (<internal-ticket>, TS-05 and TS-06) end-to-end and readily switch between modes without hand-rolling the nested JSON payloads.

## Description

RUCKUS One accepts four distinct shapes under `scheduler` for `activate_wifi_network_at_venues` and `update_venue_wifi_network_settings`:

1. **ALWAYS_ON** — 24/7 availability.
2. **LEGACY CUSTOM** — per-day 96-character bitmask strings only.
3. **BASIC** (new format) — user-friendly recurring schedule with time windows (`customType`, `repeatRule`, `startDate`, `endDate`, `allDay`, `fromTime`, `toTime`, `weeklyRepeatDays`, `monthlyRepeatRule`).
4. **ADVANCED** (new format) — per-day bitmasks with start/end dates and repeat rule.

Fields don't mix across shapes. Throwing all fields into a single JSON Schema produces ambiguous combinations; JSON Schema `oneOf` renders inconsistently across MCP clients. Instead, agents need a way to pick a shape cleanly and have the server assemble the correct wire payload.

## Acceptance Criteria

- [x] `update_venue_wifi_network_settings` exists as a pass-through update tool (from STORY for #36, merged in PR #50) — covers any scheduler shape via raw JSON.
- [x] `get_venue_wifi_network_settings` exists as a pass-through GET tool — returns all scheduler fields R1 sends, including new-format fields (`customType`, `repeatRule`, `startDate`, `endDate`, `allDay`, `fromTime`, `toTime`, `weeklyRepeatDays`, `monthlyRepeatRule`). Verified by TC-INT-325.
- [x] `build_wifi_scheduler_config` (PR #56) — pure builder tool that constructs a correctly-shaped scheduler JSON from mode-discriminated inputs, for agent use with the activation/update tools.
- [x] `activate_wifi_network_at_venues` `scheduler` sub-schema documents all four valid shapes and references the builder (PR #56).
- [x] Integration tests cover legacy bitmask lifecycle (TC-INT-324) and new-format BASIC + ADVANCED round-trip via the builder (TC-INT-325).
- [ ] Widen `repeatRule` and `monthlyRepeatRule` enums in the builder once R1-accepted values are confirmed.
- [ ] Extend TC-INT-325 to cover BASIC with `fromTime`/`toTime` (allDay=false) and BASIC/ADVANCED with `NO_REPEAT`.

## Technical Notes

- Affected files: `src/mcpServer.ts`, `src/services/ruckusApiService.ts` (minor TS type alignment only)
- Related issues: #36 (PUT scheduler), #51 (CI test), #54 (new-format round-trip + builder)
- Related PRs: #50 (PUT/GET tools), #52 (TC-INT-324), #56 (builder + TC-INT-325)
- The builder is the project's first **pure builder** MCP tool (no RUCKUS API call). Pattern documented under "Pure Builder Tool Pattern" in `CLAUDE.md`.
- Enum value gotcha: R1 `weeklyRepeatDays` expects `java.time.DayOfWeek` full names (`MONDAY`..`SUNDAY`, uppercase). The short `MON`/`TUE` form is rejected with `WIFI-10001`.

## Status

- Created: 2026-04-20
- Implementation: complete for legacy (#36/#50) + builder (#56)
- Tests: PASS — TC-INT-324 (legacy), TC-INT-325 (new-format, passed 16/16 locally 2026-04-20)
- Open: enum widening and BASIC fromTime/toTime coverage tracked under acceptance criteria
