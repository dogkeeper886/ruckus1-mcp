# STORY-009: WiFi Network Management

## User Story

As a network administrator,
I want to manage WiFi networks (WLANs/SSIDs) in RUCKUS One,
So that I can create, configure, activate, and manage wireless networks across my venues.

## Description

Comprehensive WiFi network lifecycle management including CRUD operations, venue activation/deactivation, and profile associations. Supports multiple network types: PSK (WPA2Personal), Guest Pass (captive portal), and Enterprise 802.1x (AAA). Networks are created globally then activated at specific venues. Portal service and RADIUS profile associations are managed separately. Uses multi-step async operations with type-based conditional logic for different network types.

## Acceptance Criteria

- [x] Query WiFi networks with filtering and pagination
- [x] Get a specific WiFi network by ID
- [x] Create WiFi networks (PSK, Guest Pass, Enterprise 802.1x)
- [x] Update WiFi network properties
- [x] Delete WiFi networks (requires deactivation first)
- [x] Activate networks at one or more venues (batch operation)
- [x] Deactivate networks from venues
- [x] Associate portal service profiles with networks
- [x] Configure RADIUS server profile settings (auth proxy, accounting proxy)
- [x] Support maxDevices parameter for guest/selfSignIn networks

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_wifi_networks`, `get_wifi_network`, `create_wifi_network`, `update_wifi_network`, `delete_wifi_network`, `activate_wifi_network_at_venues`, `deactivate_wifi_network_at_venues`, `update_wifi_network_portal_service_profile`, `update_wifi_network_radius_server_profile_settings`
- Uses advanced patterns: multi-step async, type-based conditional logic, retrieve-then-update for full config preservation, optional payload pattern, type-based early return

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #13
- Tests: TC-INT-014, TC-INT-015
