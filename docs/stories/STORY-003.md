# STORY-003: AP Group Management

## User Story

As a network administrator,
I want to manage AP groups in RUCKUS One,
So that I can organize access points into logical groups for configuration and policy management.

## Description

Full CRUD operations for AP groups plus group-level radio, antenna, band mode, and client admission control configuration queries. AP groups allow batch configuration of APs sharing common settings. Create, delete, and update are async operations. The update operation preserves existing APs in the group when modifying group properties.

## Acceptance Criteria

- [x] Query AP groups with filtering and pagination
- [x] Create a new AP group (async with polling)
- [x] Delete an AP group (async with polling)
- [x] Update AP group properties while preserving existing APs
- [x] Get AP group external antenna settings
- [x] Get AP group antenna type settings
- [x] Get AP group AP model band mode settings
- [x] Get AP group radio settings
- [x] Get AP group client admission control settings

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `get_ruckus_ap_groups`, `create_ruckus_ap_group`, `delete_ruckus_ap_group`, `update_ruckus_ap_group`, `get_ap_group_external_antenna_settings`, `get_ap_group_antenna_type_settings`, `get_ap_group_ap_model_band_mode_settings`, `get_ap_group_radio_settings`, `get_ap_group_client_admission_control_settings`
- API endpoints: AP Group CRUD endpoints, AP Group settings endpoints

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #7
- Tests: PASS - TC-INT-006
