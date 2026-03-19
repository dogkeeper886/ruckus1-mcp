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

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #15
- Tests: TC-INT-017
