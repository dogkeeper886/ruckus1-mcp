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

## Tool Parameters

### `get_ruckus_aps` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | no | - | ID of the venue to filter APs |
| searchString | string | no | - | Search string to filter APs |
| searchTargetFields | array | no | name, model, ipAddress, macAddress, tags, serialNumber | Fields to search in |
| fields | array | no | comprehensive set | Fields to return in the response |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| mesh | boolean | no | false | Get mesh APs |

### `add_ap_to_group` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue containing the AP group |
| apGroupId | string | yes | - | ID of the AP group to add the AP to |
| name | string | yes | - | Display name for the access point |
| serialNumber | string | yes | - | Serial number of the access point |
| description | string | no | - | Description of the access point |

### `remove_ap` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue containing the AP |
| apSerialNumber | string | yes | - | Serial number of the access point to remove |

### `update_ruckus_ap` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apSerialNumber | string | yes | - | Serial number of the AP to update |
| apName | string | no | - | New AP display name |
| venueId | string | no | - | Target venue ID (for moving AP to different venue) |
| apGroupId | string | no | - | Target AP group ID (for moving AP to different group) |
| description | string | no | - | Description for the update operation |

### `get_ap_radio_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue containing the AP |
| apSerialNumber | string | yes | - | Serial number of the AP |

### `get_ap_client_admission_control_settings` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| venueId | string | yes | - | ID of the venue containing the AP |
| apSerialNumber | string | yes | - | Serial number of the AP |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #8
- Tests: PASS - TC-INT-007, TC-INT-104, TC-INT-307
