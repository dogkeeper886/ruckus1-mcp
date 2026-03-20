# STORY-007: Portal Service Profile Management

## User Story

As a network administrator,
I want to manage portal service (captive portal) profiles in RUCKUS One,
So that I can configure guest WiFi portals and self-sign-in experiences.

## Description

Full CRUD operations for portal service profiles including query with filtering/pagination, get by ID, create, update, and delete. Portal service profiles define captive portal behavior for guest networks, including self-sign-in and guest pass authentication flows.

## Acceptance Criteria

- [x] Query portal service profiles with filtering and pagination
- [x] Get a specific portal service profile by ID
- [x] Create a new portal service profile
- [x] Update an existing portal service profile
- [x] Delete a portal service profile

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_portal_service_profiles`, `get_portal_service_profile`, `create_portal_service_profile`, `update_portal_service_profile`, `delete_portal_service_profile`
- API endpoints: Portal service profile CRUD endpoints

## Tool Parameters

### `query_portal_service_profiles` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters | object | no | - | Optional filters to apply |
| fields | array | no | ["id", "name", "displayLangCode", "wifiNetworkIds"] | Fields to return |
| searchString | string | no | - | Search string to filter profiles |
| searchTargetFields | array | no | ["name"] | Fields to search in |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| sortField | string | no | "name" | Field to sort by |
| sortOrder | string | no | "ASC" | Sort order - ASC or DESC |

### `get_portal_service_profile` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the portal service profile to get |

### `create_portal_service_profile` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the portal service profile |
| content | object | yes | - | Portal content configuration object |

### `update_portal_service_profile` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the portal service profile to update |
| name | string | yes | - | Name of the portal service profile |
| content | object | yes | - | Portal content configuration object |

### `delete_portal_service_profile` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the portal service profile to delete |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #11
- Tests: PASS - TC-INT-010, TC-INT-205
