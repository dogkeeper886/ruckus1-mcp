# STORY-001: Authentication & Activity Monitoring

## User Story

As a network administrator,
I want to authenticate with RUCKUS One and monitor async operation status,
So that I can securely access the API and track long-running operations.

## Description

Provides OAuth2 authentication using client credentials grant flow and activity monitoring for async operations. The auth token is required by all other MCP tools. Activity details allow polling async operations (create, delete, update) to determine completion status.

## Acceptance Criteria

- [x] Obtain JWT token using tenant ID, client ID, and client secret
- [x] Support multi-region RUCKUS cloud endpoints
- [x] Token caching with expiry to avoid unnecessary re-authentication
- [x] Retrieve activity details by request ID
- [x] Activity status values: SUCCESS, COMPLETED, FAIL, INPROGRESS

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`, `src/utils/tokenCache.ts`
- MCP tools: `get_ruckus_auth_token`, `get_ruckus_activity_details`
- API endpoints: OAuth2 token endpoint, Activity details endpoint

## Tool Parameters

### `get_ruckus_auth_token` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | - | - | - | No parameters required |

### `get_ruckus_activity_details` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| activityId | string | yes | - | Activity ID (requestId) to get details for |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #5
- Tests: PASS - TC-INT-001, TC-INT-002, TC-INT-301
