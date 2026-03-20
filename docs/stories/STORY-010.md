# STORY-010: Guest Pass Management

## User Story

As a network administrator,
I want to manage guest passes in RUCKUS One,
So that I can provide temporary WiFi access to visitors with controlled credentials.

## Description

Guest pass lifecycle management including querying existing passes, creating new passes, and deleting expired or unused passes. Guest passes provide temporary WiFi access credentials for guest networks configured with portal service profiles.

## Acceptance Criteria

- [x] Query guest passes with filtering and pagination
- [x] Create new guest passes
- [x] Delete guest passes

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_guest_passes`, `create_guest_pass`, `delete_guest_pass`
- API endpoints: Guest pass management endpoints
- Related: Portal service profiles (STORY-007), WiFi networks (STORY-009)

## Tool Parameters

### `query_guest_passes` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters | object | no | - | Optional filters (e.g., {"includeExpired": ["true"]}) |
| fields | array | no | comprehensive set | Fields to return |
| searchString | string | no | - | Search string to filter guest passes |
| searchTargetFields | array | no | ["name", "mobilePhoneNumber", "emailAddress"] | Fields to search in |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| sortField | string | no | "name" | Field to sort by |
| sortOrder | string | no | "ASC" | Sort order - ASC or DESC |

### `create_guest_pass` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to create guest pass for |
| name | string | yes | - | Name/identifier for the guest pass |
| expiration | object | yes | - | Expiration config (duration, unit, activationType) |
| maxDevices | number | yes | - | Max devices that can use this guest pass simultaneously |
| deliveryMethods | array | yes | - | Delivery methods: PRINT, EMAIL, SMS |
| mobilePhoneNumber | string | no | - | Phone number (required if SMS in deliveryMethods) |
| email | string | no | - | Email address (required if EMAIL in deliveryMethods) |
| notes | string | no | - | Optional notes about this guest pass |

### `delete_guest_pass` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network containing the guest pass |
| guestPassId | string | yes | - | ID of the guest pass to delete |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #14
- Tests: PASS - TC-INT-016, TC-INT-111, TC-INT-318
