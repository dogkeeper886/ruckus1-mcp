# STORY-008: Role & Permission Management

## User Story

As a network administrator,
I want to manage roles, permissions, and user groups in RUCKUS One,
So that I can control access and define what actions different users can perform.

## Description

Management of RBAC (Role-Based Access Control) in RUCKUS One including querying user groups, roles, and role features. Supports creating, updating, and deleting custom roles, as well as updating privilege groups. Role features define granular permissions that can be assigned to custom roles.

## Acceptance Criteria

- [x] Query user groups
- [x] Query roles
- [x] Query role features with filtering
- [x] Create a custom role with specific permissions
- [x] Update a custom role
- [x] Delete a custom role
- [x] Update privilege group settings

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `get_ruckus_user_groups`, `get_ruckus_roles`, `query_role_features`, `create_custom_role`, `update_custom_role`, `delete_custom_role`, `update_privilege_group`
- API endpoints: Role/permission management endpoints

## Tool Parameters

### `get_ruckus_user_groups` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | - | - | - | No parameters required |

### `get_ruckus_roles` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | - | - | - | No parameters required |

### `query_role_features` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | no | - | Filter by category: wifi, Wired, Gateways, AI, or Admin |
| searchString | string | no | - | Search in feature names and descriptions |
| page | number | no | 1 | Page number for pagination |
| pageSize | number | no | 100 | Number of results per page (max: 500) |
| showScopes | boolean | no | false | Whether to show scopes |

### `create_custom_role` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the custom role to create |
| features | array | yes | - | Array of permission features |
| preDefinedRole | string | no | "READ_ONLY" | Base role template to inherit from |

### `update_custom_role` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| roleId | string | yes | - | ID of the custom role to update |
| name | string | yes | - | Name of the custom role |
| features | array | yes | - | Array of feature permissions |
| preDefinedRole | string | no | - | Base predefined role to inherit from |

### `delete_custom_role` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| roleId | string | yes | - | ID of the custom role to delete |

### `update_privilege_group` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| privilegeGroupName | string | yes | - | Name or ID of the privilege group to update |
| name | string | yes | - | Display name of the privilege group |
| roleName | string | yes | - | Name of the role to assign to the group |
| delegation | boolean | yes | - | Whether delegation is enabled |
| allVenues | boolean | no | true | Grant access to all venues (true) or specific venues only (false) |
| venueNames | array | no | - | Array of venue names or IDs (only used when allVenues is false) |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #12
- Tests: PASS - TC-INT-011, TC-INT-012, TC-INT-013, TC-INT-109, TC-INT-208
