# STORY-005: Directory Server Profile Management

## User Story

As a network administrator,
I want to manage directory server (LDAP/AD) profiles in RUCKUS One,
So that I can configure user authentication against enterprise directory services.

## Description

Full CRUD operations for directory server profiles including query with filtering/pagination, get by ID, create, update, and delete. Directory server profiles define LDAP/Active Directory connections used for enterprise authentication.

## Acceptance Criteria

- [x] Query directory server profiles with filtering and pagination
- [x] Get a specific directory server profile by ID
- [x] Create a new directory server profile
- [x] Update an existing directory server profile
- [x] Delete a directory server profile

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_directory_server_profiles`, `get_directory_server_profile`, `create_directory_server_profile`, `update_directory_server_profile`, `delete_directory_server_profile`
- API endpoints: Directory server profile CRUD endpoints

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #9
- Tests: PASS - TC-INT-008
