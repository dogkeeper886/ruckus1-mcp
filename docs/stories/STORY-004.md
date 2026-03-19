# STORY-004: Access Point Management

## User Story

As a network administrator,
I want to manage individual access points in RUCKUS One,
So that I can add, configure, move, and remove APs across my network.

## Description

Comprehensive AP lifecycle management including adding APs to groups, removing APs, querying AP inventory, and updating AP properties. The update operation uses a retrieve-then-update pattern to preserve existing fields while updating specific properties (name, venue, AP group, description). Also provides read-only access to AP-level radio and client admission control settings.

## Acceptance Criteria

- [x] Query APs with filtering and pagination
- [x] Add an AP to an AP group (async with polling)
- [x] Remove an AP (async with polling)
- [x] Update AP properties using retrieve-then-update pattern
- [x] Support AP name changes, venue moves, and AP group changes
- [x] Get AP radio settings
- [x] Get AP client admission control settings

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `get_ruckus_aps`, `add_ap_to_group`, `remove_ap`, `update_ruckus_ap`, `get_ap_radio_settings`, `get_ap_client_admission_control_settings`
- API endpoints: AP CRUD endpoints, AP settings endpoints
- Uses retrieve-then-update pattern for AP updates

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #8
- Tests: PASS - TC-INT-007
