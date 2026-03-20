# STORY-006: RADIUS Server Profile Management

## User Story

As a network administrator,
I want to manage RADIUS server profiles in RUCKUS One,
So that I can configure RADIUS authentication and accounting for WiFi networks.

## Description

Full CRUD operations for RADIUS server profiles including query with filtering/pagination, get by ID, create, update, and delete. RADIUS profiles are used by WiFi networks for 802.1x Enterprise authentication, accounting, and proxy configurations.

## Acceptance Criteria

- [x] Query RADIUS server profiles with filtering and pagination
- [x] Get a specific RADIUS server profile by ID
- [x] Create a new RADIUS server profile
- [x] Update an existing RADIUS server profile
- [x] Delete a RADIUS server profile

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_radius_server_profiles`, `get_radius_server_profile`, `create_radius_server_profile`, `update_radius_server_profile`, `delete_radius_server_profile`
- API endpoints: RADIUS server profile CRUD endpoints

## Tool Parameters

### `query_radius_server_profiles` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |

### `get_radius_server_profile` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the RADIUS server profile to get |

### `create_radius_server_profile` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the RADIUS server profile |
| type | string | yes | - | Type: "AUTHENTICATION" or "ACCOUNTING" |
| enableSecondaryServer | boolean | yes | - | Whether to enable secondary server |
| primary | object | yes | - | Primary RADIUS server config (port, sharedSecret, hostname/ip) |
| secondary | object | no | - | Secondary RADIUS server config (port, sharedSecret, hostname/ip) |

### `update_radius_server_profile` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the RADIUS server profile to update |
| name | string | yes | - | Name of the RADIUS server profile |
| type | string | yes | - | Type: "AUTHENTICATION" or "ACCOUNTING" |
| enableSecondaryServer | boolean | yes | - | Whether to enable secondary server |
| primary | object | yes | - | Primary RADIUS server config (port, sharedSecret, hostname/ip) |
| secondary | object | no | - | Secondary RADIUS server config (port, sharedSecret, hostname/ip) |

### `delete_radius_server_profile` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the RADIUS server profile to delete |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #10
- Tests: PASS - TC-INT-009, TC-INT-107, TC-INT-206
