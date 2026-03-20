# STORY-005: Directory Server Profile Management

## User Story

As a network administrator,
I want to manage directory server (LDAP/AD) profiles in RUCKUS One,
So that I can configure user authentication against enterprise directory services.

## Description

Full CRUD operations for directory server profiles including query with filtering/pagination, get by ID, create, update, and delete. Directory server profiles define LDAP/Active Directory connections used for enterprise authentication.

## Acceptance Criteria

- [x] Query directory server profiles with filtering and pagination
- [x] Get a specific directory server profile by ID
- [x] Create a new directory server profile
- [x] Update an existing directory server profile
- [x] Delete a directory server profile

## Technical Notes

- Affected files: `src/services/ruckusApiService.ts`, `src/mcpServer.ts`
- MCP tools: `query_directory_server_profiles`, `get_directory_server_profile`, `create_directory_server_profile`, `update_directory_server_profile`, `delete_directory_server_profile`
- API endpoints: Directory server profile CRUD endpoints

## Tool Parameters

### `query_directory_server_profiles` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters | object | no | - | Optional filters to apply |
| fields | array | no | ["id", "name", "domainName", "host", "port", "type", "wifiNetworkIds"] | Fields to return |
| searchString | string | no | - | Search string to filter profiles |
| searchTargetFields | array | no | ["name"] | Fields to search in |
| page | number | no | 1 | Page number |
| pageSize | number | no | 10 | Number of results per page |
| sortField | string | no | "name" | Field to sort by |
| sortOrder | string | no | "ASC" | Sort order - ASC or DESC |

### `get_directory_server_profile` (READ-ONLY)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the directory server profile to get |

### `create_directory_server_profile` (CRUD - CREATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | - | Name of the directory server profile |
| type | string | yes | - | Type of directory server (e.g., "LDAP") |
| tlsEnabled | boolean | yes | - | Whether TLS is enabled |
| host | string | yes | - | Directory server hostname |
| port | number | yes | - | Directory server port number |
| domainName | string | yes | - | Domain name (e.g., "dc=example,dc=com") |
| adminDomainName | string | yes | - | Admin domain name |
| adminPassword | string | yes | - | Admin password |
| identityName | string | yes | - | Identity name field |
| identityEmail | string | yes | - | Identity email field |
| identityPhone | string | yes | - | Identity phone field |
| keyAttribute | string | yes | - | Key attribute (e.g., "uid") |
| attributeMappings | array | yes | - | Array of attribute mappings |
| searchFilter | string | no | - | Optional search filter |

### `update_directory_server_profile` (CRUD - UPDATE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the directory server profile to update |
| name | string | yes | - | Name of the directory server profile |
| type | string | yes | - | Type of directory server (e.g., "LDAP") |
| tlsEnabled | boolean | yes | - | Whether TLS is enabled |
| host | string | yes | - | Directory server hostname |
| port | number | yes | - | Directory server port number |
| domainName | string | yes | - | Domain name (e.g., "dc=example,dc=com") |
| adminDomainName | string | yes | - | Admin domain name |
| adminPassword | string | yes | - | Admin password |
| identityName | string | yes | - | Identity name field |
| identityEmail | string | yes | - | Identity email field |
| identityPhone | string | yes | - | Identity phone field |
| keyAttribute | string | yes | - | Key attribute (e.g., "uid") |
| attributeMappings | array | yes | - | Array of attribute mappings |
| searchFilter | string | no | - | Optional search filter |

### `delete_directory_server_profile` (CRUD - DELETE)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| profileId | string | yes | - | ID of the directory server profile to delete |

## Status

- Created: 2026-03-19
- Implementation: complete
- Tasks: complete
- Test Issue: #9
- Tests: PASS - TC-INT-008, TC-INT-106, TC-INT-207
