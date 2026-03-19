# STORY-002: Venue Management

## User Story

As a network administrator,
I want to manage venues (sites/locations) in RUCKUS One,
So that I can organize my network infrastructure by physical location.

## Description

Full CRUD operations for RUCKUS One venues plus venue-level radio and antenna configuration queries. Venues represent physical locations where APs are deployed. Create and delete are async operations with polling. Venue settings provide read-only access to radio, antenna, and band mode configurations at the venue level.

## Acceptance Criteria

- [x] List all venues with pagination support
- [x] Create a new venue (async with polling)
- [x] Delete a venue (async with polling)
- [x] Update venue properties
- [x] Get venue external antenna settings
- [x] Get venue antenna type settings
- [x] Get venue AP model band mode settings
- [x] Get venue radio settings

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`, `src/types/ruckusApi.ts`
- MCP tools: `get_ruckus_venues`, `create_ruckus_venue`, `delete_ruckus_venue`, `update_ruckus_venue`, `get_venue_external_antenna_settings`, `get_venue_antenna_type_settings`, `get_venue_ap_model_band_mode_settings`, `get_venue_radio_settings`
- API endpoints: Venue CRUD endpoints, Venue settings endpoints

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #6
- Tests: TC-INT-003, TC-INT-004, TC-INT-005
