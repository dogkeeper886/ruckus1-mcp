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

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #14
- Tests: TC-INT-016
