# RUCKUS1-MCP API Reference

## Overview

This document provides a comprehensive reference for all MCP tools available in the RUCKUS1-MCP server. Each tool is designed to interact with the RUCKUS One API through a standardized MCP interface.

## Authentication Tools

### get_ruckus_auth_token

Get a JWT token for RUCKUS One authentication.

**Parameters:** None

**Returns:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Example:**
```bash
# MCP tool call
{
  "tool": "get_ruckus_auth_token",
  "arguments": {}
}
```

## Venue Management Tools

### get_ruckus_venues

Get a list of venues from RUCKUS One.

**Parameters:** None

**Returns:**
```json
{
  "data": [
    {
      "id": "venue-uuid",
      "name": "NYC Office",
      "addressLine": "123 Main St",
      "city": "New York",
      "country": "United States",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10000
}
```

### create_ruckus_venue

Create a new venue in RUCKUS One with automatic status checking.

**Parameters:**
- `name` (string, required): Name of the venue
- `addressLine` (string, required): Street address (use city name for reliability)
- `city` (string, required): City where the venue is located
- `country` (string, required): Country where the venue is located
- `latitude` (number, optional): Latitude coordinate
- `longitude` (number, optional): Longitude coordinate
- `timezone` (string, optional): Timezone for the venue
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

**Returns:**
```json
{
  "requestId": "activity-uuid",
  "status": "completed",
  "message": "Venue created successfully",
  "activityDetails": {
    "id": "activity-uuid",
    "status": "SUCCESS",
    "endDatetime": "2024-01-01T12:00:00Z"
  }
}
```

### update_ruckus_venue

Update a venue in RUCKUS One with automatic status checking.

**Parameters:**
- `venueId` (string, required): ID of the venue to update
- `name` (string, required): Name of the venue
- `description` (string, optional): Optional description of the venue
- `addressLine` (string, required): Street address of the venue
- `city` (string, required): City where the venue is located
- `country` (string, required): Country where the venue is located
- `countryCode` (string, optional): Country code (e.g., "US")
- `latitude` (number, optional): Latitude coordinate
- `longitude` (number, optional): Longitude coordinate
- `timezone` (string, optional): Timezone for the venue
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### delete_ruckus_venue

Delete a venue from RUCKUS One with automatic status checking.

**Parameters:**
- `venueId` (string, required): ID of the venue to delete
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

## AP Group Management Tools

### get_ruckus_ap_groups

Query AP groups from RUCKUS One with filtering and pagination support.

**Parameters:**
- `filters` (object, optional): Optional filters to apply (e.g., `{"isDefault": [false]}`)
- `fields` (array, optional): Fields to return (default: `["id", "name"]`)
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Number of results per page (default: 10000)

**Returns:**
```json
{
  "data": [
    {
      "id": "ap-group-uuid",
      "name": "NYC Office APs",
      "description": "Access points for NYC office",
      "venueId": "venue-uuid",
      "isDefault": false,
      "apCount": 5
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10000
}
```

### create_ruckus_ap_group

Create a new AP group in a RUCKUS One venue with automatic status checking.

**Parameters:**
- `venueId` (string, required): ID of the venue where the AP group will be created
- `name` (string, required): Name of the AP group (2-64 characters, no special characters)
- `description` (string, optional): Optional description of the AP group (2-180 characters)
- `apSerialNumbers` (array, optional): Array of AP serial numbers to include in the group
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

**Example apSerialNumbers:**
```json
[
  {
    "serialNumber": "421706000056"
  },
  {
    "serialNumber": "421706000057"
  }
]
```

### update_ruckus_ap_group

Update an AP group in a RUCKUS One venue with automatic status checking.

**Parameters:**
- `venueId` (string, required): ID of the venue containing the AP group
- `apGroupId` (string, required): ID of the AP group to update
- `name` (string, required): Name of the AP group
- `description` (string, optional): Optional description of the AP group
- `apSerialNumbers` (array, optional): Array of AP serial numbers to include in the group
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### delete_ruckus_ap_group

Delete an AP group from a RUCKUS One venue with automatic status checking.

**Parameters:**
- `venueId` (string, required): ID of the venue containing the AP group
- `apGroupId` (string, required): ID of the AP group to delete
- `maxRetries` (number, optional): Maximum retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

## Access Point Management Tools

### get_ruckus_aps

Query access points with filtering, search, and pagination.

**Parameters:**
- `venueId` (string, optional): ID of the venue to filter APs
- `searchString` (string, optional): Search string to filter APs
- `searchTargetFields` (array, optional): Fields to search in (default: `["name", "model", "networkStatus.ipAddress", "macAddress", "tags", "serialNumber"]`)
- `fields` (array, optional): Fields to return in the response
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Number of results per page (default: 10)
- `mesh` (boolean, optional): Get mesh APs (default: false)

**Returns:**
```json
{
  "data": [
    {
      "id": "ap-uuid",
      "name": "e510",
      "serialNumber": "421706000056",
      "model": "R750",
      "status": "ONLINE",
      "venueId": "venue-uuid",
      "apGroupId": "ap-group-uuid",
      "macAddress": "00:11:22:33:44:55",
      "networkStatus": {
        "ipAddress": "192.168.1.100"
      }
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 10
}
```

### move_ruckus_ap

Move an Access Point to a different venue and/or AP group.

**Parameters:**
- `venueId` (string, required): Target venue ID where the AP will be moved to
- `apSerialNumber` (string, required): Serial number of the AP to move
- `apGroupId` (string, required): Target AP group ID in the destination venue
- `apName` (string, optional): Display name for the AP
- `description` (string, optional): Description for the move operation
- `method` (string, optional): API method - "update" for same-venue AP group changes, "direct" for cross-venue moves (default: "direct")
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### update_ruckus_ap

Update AP properties with automatic property preservation using retrieve-then-update pattern.

**Parameters:**
- `apSerialNumber` (string, required): Serial number of the AP to update
- `apName` (string, optional): New AP display name
- `venueId` (string, optional): Target venue ID (for moving AP to different venue)
- `apGroupId` (string, optional): Target AP group ID (for moving AP to different group)
- `description` (string, optional): Description for the update operation
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### move_ap_to_group

Move AP to different group in same venue (preserves name and other properties).

**Parameters:**
- `apSerialNumber` (string, required): Serial number of the AP to move
- `targetApGroupId` (string, required): Target AP group ID in the same venue
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### move_ap_to_venue

Move AP to different venue with specified AP group (preserves name and other properties).

**Parameters:**
- `apSerialNumber` (string, required): Serial number of the AP to move
- `targetVenueId` (string, required): Target venue ID where the AP will be moved
- `targetApGroupId` (string, required): Target AP group ID in the destination venue
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### rename_ap

Change AP display name (preserves venue, group, and other properties).

**Parameters:**
- `apSerialNumber` (string, required): Serial number of the AP to rename
- `newName` (string, required): New display name for the AP
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

## Activity Monitoring Tools

### get_ruckus_activity_details

Get activity details from RUCKUS One using activity ID (e.g., requestId from venue creation).

**Parameters:**
- `activityId` (string, required): Activity ID (requestId) to get details for

**Returns:**
```json
{
  "id": "activity-uuid",
  "requestId": "request-uuid",
  "status": "SUCCESS",
  "type": "VENUE_CREATE",
  "description": "Create venue operation",
  "progress": 100,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:05:00Z",
  "endDatetime": "2024-01-01T10:05:00Z"
}
```

## Antenna Configuration Tools

### get_venue_external_antenna_settings

Get external antenna settings for a venue.

**Parameters:**
- `venueId` (string, required): ID of the venue to get external antenna settings for

### get_venue_antenna_type_settings

Get antenna type settings for a venue.

**Parameters:**
- `venueId` (string, required): ID of the venue to get antenna type settings for

### get_ap_group_external_antenna_settings

Get external antenna settings for a specific AP group in a venue.

**Parameters:**
- `venueId` (string, required): ID of the venue containing the AP group
- `apGroupId` (string, required): ID of the AP group to get external antenna settings for

### get_ap_group_antenna_type_settings

Get antenna type settings for a specific AP group in a venue.

**Parameters:**
- `venueId` (string, required): ID of the venue containing the AP group
- `apGroupId` (string, required): ID of the AP group to get antenna type settings for

## Directory Server Profile Tools

### query_directory_server_profiles

Query directory server profiles from RUCKUS One with filtering and pagination support.

**Parameters:**
- `filters` (object, optional): Optional filters to apply
- `fields` (array, optional): Fields to return (default: `["id", "name", "domainName", "host", "port", "type", "wifiNetworkIds"]`)
- `searchString` (string, optional): Search string to filter profiles
- `searchTargetFields` (array, optional): Fields to search in (default: `["name"]`)
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Number of results per page (default: 10)
- `sortField` (string, optional): Field to sort by (default: "name")
- `sortOrder` (string, optional): Sort order - ASC or DESC (default: "ASC")

### get_directory_server_profile

Get detailed information for a specific directory server profile.

**Parameters:**
- `profileId` (string, required): ID of the directory server profile to get

### create_directory_server_profile

Create a new directory server profile in RUCKUS One with automatic status checking.

**Parameters:**
- `name` (string, required): Name of the directory server profile
- `type` (string, required): Type of directory server (e.g., "LDAP")
- `tlsEnabled` (boolean, required): Whether TLS is enabled
- `host` (string, required): Directory server hostname
- `port` (number, required): Directory server port number
- `domainName` (string, required): Domain name (e.g., "dc=example,dc=com")
- `adminDomainName` (string, required): Admin domain name (e.g., "cn=admin,dc=example,dc=com")
- `adminPassword` (string, required): Admin password
- `identityName` (string, required): Identity name field
- `identityEmail` (string, required): Identity email field
- `identityPhone` (string, required): Identity phone field
- `keyAttribute` (string, required): Key attribute (e.g., "uid")
- `searchFilter` (string, optional): Optional search filter
- `attributeMappings` (array, required): Array of attribute mappings
- `maxRetries` (number, optional): Maximum number of retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

**Example attributeMappings:**
```json
[
  {
    "name": "cn",
    "mappedByName": "displayName"
  },
  {
    "name": "mail",
    "mappedByName": "email"
  }
]
```

### update_directory_server_profile

Update a directory server profile in RUCKUS One with automatic status checking.

**Parameters:**
- `profileId` (string, required): ID of the directory server profile to update
- [All create_directory_server_profile parameters]

### delete_directory_server_profile

Delete a directory server profile from RUCKUS One with automatic status checking.

**Parameters:**
- `profileId` (string, required): ID of the directory server profile to delete
- `maxRetries` (number, optional): Maximum number of retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

## Portal Service Profile Tools

### query_portal_service_profiles

Query portal service profiles from RUCKUS One with filtering and pagination support.

**Parameters:**
- `filters` (object, optional): Optional filters to apply
- `fields` (array, optional): Fields to return (default: `["id", "name", "displayLangCode", "wifiNetworkIds"]`)
- `searchString` (string, optional): Search string to filter profiles
- `searchTargetFields` (array, optional): Fields to search in (default: `["name"]`)
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Number of results per page (default: 10)
- `sortField` (string, optional): Field to sort by (default: "name")
- `sortOrder` (string, optional): Sort order - ASC or DESC (default: "ASC")

### get_portal_service_profile

Get detailed information for a specific portal service profile.

**Parameters:**
- `profileId` (string, required): ID of the portal service profile to get

## Role and Permission Management Tools

### get_ruckus_user_groups

Get user group assignments showing which roles are assigned to users with venue and customer scope information.

**Parameters:** None

### get_ruckus_roles

Get all roles from RUCKUS One including both system roles (ADMIN, READ_ONLY, etc.) and custom roles with their feature permissions.

**Parameters:** None

### update_privilege_group

Update a privilege group in RUCKUS One using simple parameters.

**Parameters:**
- `privilegeGroupName` (string, required): Name or ID of the privilege group to update
- `name` (string, required): Display name of the privilege group
- `roleName` (string, required): Name of the role to assign to the group
- `delegation` (boolean, required): Whether delegation is enabled for this group
- `allVenues` (boolean, optional): Grant access to all venues (true) or specific venues only (false). Default: true
- `venueNames` (array, optional): Array of venue names or IDs (only used when allVenues is false)
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### update_custom_role

Update a custom role in RUCKUS One with specific features and permissions.

**Parameters:**
- `roleId` (string, required): ID of the custom role to update
- `name` (string, required): Name of the custom role
- `features` (array, required): Array of feature permissions
- `preDefinedRole` (string, optional): Base predefined role to inherit from
- `maxRetries` (number, optional): Maximum number of polling retries (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

### query_role_features

Search and filter role features for custom roles.

**Parameters:**
- `category` (string, optional): Filter by category: wifi, Wired, Gateways, AI, or Admin
- `searchString` (string, optional): Search in feature names and descriptions (e.g., "dhcp", "access_points", "venue")
- `page` (number, optional): Page number for pagination (default: 1)
- `pageSize` (number, optional): Number of results per page (default: 100, max: 500)
- `showScopes` (boolean, optional): Whether to show scopes (default: false)

### create_custom_role

Create a new custom role in RUCKUS One with automatic parent permission injection.

**Parameters:**
- `name` (string, required): Name of the custom role to create
- `features` (array, required): Array of permission features
- `preDefinedRole` (string, optional): Base role template (e.g., "READ_ONLY", "ADMIN"). Defaults to "READ_ONLY"

### delete_custom_role

Delete a custom role from RUCKUS One with automatic status checking.

**Parameters:**
- `roleId` (string, required): ID of the custom role to delete
- `maxRetries` (number, optional): Maximum number of retry attempts (default: 5)
- `pollIntervalMs` (number, optional): Polling interval in milliseconds (default: 2000)

## Error Response Format

All tools return errors in a standardized format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message with detailed API error information"
    }
  ],
  "isError": true
}
```

## Common Response Patterns

### Synchronous Operations
- Immediate response with data
- No status tracking required
- Used for queries and simple GET operations

### Asynchronous Operations
- Initial response with `requestId`
- Status polling with configurable retries
- Final response with completion status and details

### Status Values
- `completed`: Operation finished successfully
- `failed`: Operation failed with error details
- `timeout`: Operation timed out after maximum retries
- `in_progress`: Operation still running (intermediate status)

## Rate Limiting and Best Practices

- Use appropriate `pageSize` values for large datasets
- Implement client-side retry logic for transient failures
- Monitor `maxRetries` and `pollIntervalMs` for optimal performance
- Use specific field selection to minimize response sizes
- Cache authentication tokens when possible
