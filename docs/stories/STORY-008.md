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

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #12
- Tests: TC-INT-011, TC-INT-012, TC-INT-013
