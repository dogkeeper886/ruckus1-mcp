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

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #11
- Tests: TC-INT-010
