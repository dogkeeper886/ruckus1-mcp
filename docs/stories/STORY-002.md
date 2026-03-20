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

## Tool Parameters

### `get_ruckus_venues` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | - | - | - | No parameters required |

### `create_ruckus_venue` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the venue |
| addressLine | string | yes | - | Street address of the venue |
| city | string | yes | - | City where the venue is located |
| country | string | yes | - | Country where the venue is located |
| latitude | number | no | - | Latitude coordinate |
| longitude | number | no | - | Longitude coordinate |
| timezone | string | no | - | Timezone for the venue |

### `delete_ruckus_venue` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue to delete |

### `update_ruckus_venue` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue to update |
| name | string | yes | - | Name of the venue |
| addressLine | string | yes | - | Street address of the venue |
| city | string | yes | - | City where the venue is located |
| country | string | yes | - | Country where the venue is located |
| description | string | no | - | Description of the venue |
| countryCode | string | no | - | Country code (e.g., "US") |
| latitude | number | no | - | Latitude coordinate |
| longitude | number | no | - | Longitude coordinate |
| timezone | string | no | - | Timezone for the venue |

### `get_venue_external_antenna_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue |

### `get_venue_antenna_type_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue |

### `get_venue_ap_model_band_mode_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue |

### `get_venue_radio_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #6
- Tests: PASS - TC-INT-003, TC-INT-004, TC-INT-005, TC-INT-102, TC-INT-201, TC-INT-302, TC-INT-303
