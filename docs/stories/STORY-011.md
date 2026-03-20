# STORY-011: Client Query & Monitoring

## User Story

As a network administrator,
I want to query connected clients in RUCKUS One,
So that I can monitor which devices are connected to my network and troubleshoot connectivity issues.

## Description

Query connected wireless clients with filtering and pagination support. Provides visibility into devices connected across the network, useful for monitoring, troubleshooting, and capacity planning.

## Acceptance Criteria

- [x] Query connected clients with filtering and pagination
- [x] Support search and sort options

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_clients`
- API endpoints: Client query endpoint

## Tool Parameters

### `query_clients` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters | object | no | - | Optional filters (e.g., {"venueId": ["venue-id"]}) |
| fields | array | no | comprehensive set | Fields to return |
| searchString | string | no | - | Search string to filter clients |
| searchTargetFields | array | no | macAddress, ipAddress, username, hostname, etc. | Fields to search in |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| sortField | string | no | "name" | Field to sort by |
| sortOrder | string | no | "ASC" | Sort order - ASC or DESC |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #15
- Tests: PASS - TC-INT-017, TC-INT-112
