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
- [x] Support Captive Portal Temporary Connection (`temporaryConnectionEnabled`, `temporaryConnection` with duration/maxDownloadRate/maxUploadRate) for Self Sign-In networks — ACX-105619 (issue #55)

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_wifi_networks`, `get_wifi_network`, `create_wifi_network`, `update_wifi_network`, `delete_wifi_network`, `activate_wifi_network_at_venues`, `deactivate_wifi_network_at_venues`, `update_wifi_network_portal_service_profile`, `update_wifi_network_radius_server_profile_settings`
- Uses advanced patterns: multi-step async, type-based conditional logic, retrieve-then-update for full config preservation, optional payload pattern, type-based early return

## Tool Parameters

### `query_wifi_networks` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters | object | no | - | Optional filters to apply |
| fields | array | no | comprehensive set | Fields to return |
| searchString | string | no | - | Search string to filter WiFi networks |
| searchTargetFields | array | no | ["name"] | Fields to search in |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| sortField | string | no | "name" | Field to sort by |
| sortOrder | string | no | "ASC" | Sort order - ASC or DESC |

### `get_wifi_network` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to get |

### `create_wifi_network` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the WiFi network (internal identifier) |
| ssid | string | yes | - | SSID (network name visible to clients) |
| type | string | yes | - | Network type: psk, enterprise, open, guest, or selfSignIn |
| wlanSecurity | string | yes | - | WLAN security type: WPA2Personal, WPA2Enterprise, None, etc. |
| passphrase | string | no | - | Network passphrase (required for type=psk, min 8 chars) |
| portalServiceProfileId | string | no | - | Portal service profile ID (required for guest/selfSignIn) |
| radiusServiceProfileId | string | no | - | RADIUS auth profile ID (required for enterprise) |
| accountingRadiusServiceProfileId | string | no | - | RADIUS accounting profile ID |
| enableAuthProxy | boolean | no | false | Enable authentication proxy |
| enableAccountingProxy | boolean | no | false | Enable accounting proxy |
| allowedEmailDomains | array | no | - | Allowed email domains for selfSignIn |
| sessionDurationDays | number | no | 12 | Session duration in days for selfSignIn |
| maxDevices | number | no | 1 | Max devices per user for guest/selfSignIn |
| vlanId | number | no | 1 | VLAN ID for client traffic |
| managementFrameProtection | string | no | "Disabled" | 802.11w setting |
| maxClientsOnWlanPerRadio | number | no | 100 | Maximum clients per radio |
| enableBandBalancing | boolean | no | true | Enable band balancing |
| clientIsolation | boolean | no | false | Enable client isolation |
| hideSsid | boolean | no | false | Hide SSID from broadcast |
| enableFastRoaming | boolean | no | false | Enable 802.11r fast roaming |
| mobilityDomainId | number | no | 1 | Mobility domain ID for fast roaming |
| wifi6Enabled | boolean | no | true | Enable WiFi 6 (802.11ax) |
| wifi7Enabled | boolean | no | true | Enable WiFi 7 (802.11be) |
| guestPortal | object | no | - | Guest portal configuration object |
| radiusOptions | object | no | - | RADIUS options for NAS ID configuration |
| temporaryConnectionEnabled | boolean | no | false | Enable temporary pre-OTP access for Self Sign-In (only type=selfSignIn) |
| temporaryConnection | object | no | - | Temporary connection settings: duration (1-15 min), maxDownloadRate (1000/2000/5000/-1 kbps), maxUploadRate (256/512/1000/-1 kbps) |

### `update_wifi_network` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to update |
| networkConfig | object | yes | - | Full network configuration object |

### `delete_wifi_network` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to delete |

### `activate_wifi_network_at_venues` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to activate |
| venueConfigs | array | yes | - | Array of venue configurations (venueId, isAllApGroups, apGroups, allApGroupsRadio, allApGroupsRadioTypes, scheduler) |
| portalServiceProfileId | string | no | - | Portal service profile ID (required for guest pass networks) |

### `deactivate_wifi_network_at_venues` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network to deactivate |
| venueIds | array | yes | - | Array of venue IDs to deactivate from |

### `update_wifi_network_portal_service_profile` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network |
| profileId | string | yes | - | ID of the portal service profile to associate |

### `update_wifi_network_radius_server_profile_settings` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| networkId | string | yes | - | ID of the WiFi network |
| enableAccountingProxy | boolean | no | false | Enable accounting proxy |
| enableAuthProxy | boolean | no | false | Enable authentication proxy |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #13
- Tests: PASS - TC-INT-014, TC-INT-015, TC-INT-110, TC-INT-209, TC-INT-316
- Temporary Connection (issue #55): implemented 2026-04-20; TC-INT-326
