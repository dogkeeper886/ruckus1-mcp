import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { getRuckusJwtToken, getRuckusActivityDetails, createVenueWithRetry, updateVenueWithRetry, deleteVenueWithRetry, createApGroupWithRetry, updateApGroupWithRetry, queryApGroups, deleteApGroupWithRetry, getVenueExternalAntennaSettings, getVenueAntennaTypeSettings, getApGroupExternalAntennaSettings, getApGroupAntennaTypeSettings, queryAPs, moveApWithRetry, updateApWithRetrieval, moveApToGroup, moveApToVenue, renameAp, queryDirectoryServerProfiles, getDirectoryServerProfile, createDirectoryServerProfileWithRetry, updateDirectoryServerProfileWithRetry, deleteDirectoryServerProfileWithRetry, queryPortalServiceProfiles, getPortalServiceProfile, queryPrivilegeGroups, queryCustomRoles, updateCustomRoleWithRetry, queryRoleFeatures, createCustomRole, deleteCustomRoleWithRetry } from './services/ruckusApiService';

dotenv.config();

const server = new Server(
  {
    name: 'ruckus1-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_ruckus_auth_token',
        description: 'Get a JWT token for RUCKUS One authentication',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_ruckus_venues',
        description: 'Get a list of venues from RUCKUS One',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_ruckus_activity_details',
        description: 'Get activity details from RUCKUS One using activity ID (e.g., requestId from venue creation)',
        inputSchema: {
          type: 'object',
          properties: {
            activityId: {
              type: 'string',
              description: 'Activity ID (requestId) to get details for',
            },
          },
          required: ['activityId'],
        },
      },
      {
        name: 'create_ruckus_venue',
        description: 'Create a new venue in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the venue',
            },
            addressLine: {
              type: 'string',
              description: 'Street address of the venue. IMPORTANT: Use city name for reliability (e.g., "Paris" instead of "123 Rue de la Paix") to avoid RUCKUS API validation failures.',
            },
            city: {
              type: 'string',
              description: 'City where the venue is located. Must match the country location to pass RUCKUS validation.',
            },
            country: {
              type: 'string',
              description: 'Country where the venue is located. Must match the actual country where the city is located (e.g., city: "Paris", country: "France").',
            },
            latitude: {
              type: 'number',
              description: 'Latitude coordinate (optional)',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate (optional)',
            },
            timezone: {
              type: 'string',
              description: 'Timezone for the venue (optional)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['name', 'addressLine', 'city', 'country'],
        },
      },
      {
        name: 'delete_ruckus_venue',
        description: 'Delete a venue from RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to delete',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId'],
        },
      },
      {
        name: 'update_ruckus_venue',
        description: 'Update a venue in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to update',
            },
            name: {
              type: 'string',
              description: 'Name of the venue',
            },
            description: {
              type: 'string',
              description: 'Optional description of the venue',
            },
            addressLine: {
              type: 'string',
              description: 'Street address of the venue',
            },
            city: {
              type: 'string',
              description: 'City where the venue is located',
            },
            country: {
              type: 'string',
              description: 'Country where the venue is located',
            },
            countryCode: {
              type: 'string',
              description: 'Country code (optional, e.g., "US")',
            },
            latitude: {
              type: 'number',
              description: 'Latitude coordinate (optional)',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate (optional)',
            },
            timezone: {
              type: 'string',
              description: 'Timezone for the venue (optional)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId', 'name', 'addressLine', 'city', 'country'],
        },
      },
      {
        name: 'create_ruckus_ap_group',
        description: 'Create a new AP group in a RUCKUS One venue with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue where the AP group will be created',
            },
            name: {
              type: 'string',
              description: 'Name of the AP group (2-64 characters, no special characters like backticks or dollar signs)',
            },
            description: {
              type: 'string',
              description: 'Optional description of the AP group (2-180 characters)',
            },
            apSerialNumbers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  serialNumber: {
                    type: 'string',
                    description: 'Serial number of the access point',
                  },
                },
                required: ['serialNumber'],
              },
              description: 'Optional array of AP serial numbers to include in the group',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId', 'name'],
        },
      },
      {
        name: 'get_ruckus_ap_groups',
        description: 'Query AP groups from RUCKUS One with filtering and pagination support',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              description: 'Optional filters to apply (e.g., {"isDefault": [false]})',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to return (default: ["id", "name"])',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 10000)',
            },
          },
          required: [],
        },
      },
      {
        name: 'delete_ruckus_ap_group',
        description: 'Delete an AP group from a RUCKUS One venue with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to delete',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId', 'apGroupId'],
        },
      },
      {
        name: 'update_ruckus_ap_group',
        description: 'Update an AP group in a RUCKUS One venue with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to update',
            },
            name: {
              type: 'string',
              description: 'Name of the AP group',
            },
            description: {
              type: 'string',
              description: 'Optional description of the AP group',
            },
            apSerialNumbers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  serialNumber: {
                    type: 'string',
                    description: 'Serial number of the access point',
                  },
                },
                required: ['serialNumber'],
              },
              description: 'Optional array of AP serial numbers to include in the group',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId', 'apGroupId', 'name'],
        },
      },
      {
        name: 'get_venue_external_antenna_settings',
        description: 'Get external antenna settings for a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to get external antenna settings for',
            },
          },
          required: ['venueId'],
        },
      },
      {
        name: 'get_venue_antenna_type_settings',
        description: 'Get antenna type settings for a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to get antenna type settings for',
            },
          },
          required: ['venueId'],
        },
      },
      {
        name: 'get_ap_group_external_antenna_settings',
        description: 'Get external antenna settings for a specific AP group in a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to get external antenna settings for',
            },
          },
          required: ['venueId', 'apGroupId'],
        },
      },
      {
        name: 'get_ap_group_antenna_type_settings',
        description: 'Get antenna type settings for a specific AP group in a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to get antenna type settings for',
            },
          },
          required: ['venueId', 'apGroupId'],
        },
      },
      {
        name: 'get_ruckus_aps',
        description: 'Get parameters and operational data for a list of APs or mesh APs',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to filter APs (optional)',
            },
            searchString: {
              type: 'string',
              description: 'Search string to filter APs (optional)',
            },
            searchTargetFields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to search in (default: name, model, networkStatus.ipAddress, macAddress, tags, serialNumber)',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to return in the response (default: comprehensive set of AP data)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 10)',
            },
            mesh: {
              type: 'boolean',
              description: 'Get mesh APs (default: false)',
            },
          },
          required: [],
        },
      },
      {
        name: 'move_ruckus_ap',
        description: 'Move an Access Point to a different venue and/or AP group. Two scenarios: 1) Move AP to different VENUE (cross-venue): Always use method="direct" - moves AP from one venue to another venue\'s AP group. 2) Move AP to different AP GROUP in same venue: Use method="update" - changes AP\'s group within current venue. Examples: "move AP to NYC Office" = cross-venue (method="direct"), "move AP to TestGroup" in same venue = same-venue group change (method="update").',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'Target venue ID where the AP will be moved to',
            },
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to move',
            },
            apGroupId: {
              type: 'string',
              description: 'Target AP group ID in the destination venue',
            },
            apName: {
              type: 'string',
              description: 'Display name for the AP (optional)',
            },
            description: {
              type: 'string',
              description: 'Description for the move operation (optional)',
            },
            method: {
              type: 'string',
              enum: ['direct', 'update'],
              description: 'API method: "update" for same-venue AP group changes (works within current venue context), "direct" for cross-venue moves or universal moves (works for both same and cross-venue). Recommendation: Use "update" for confirmed same-venue moves, "direct" for cross-venue moves or when unsure.',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['venueId', 'apSerialNumber', 'apGroupId'],
        },
      },
      {
        name: 'update_ruckus_ap',
        description: 'Update AP properties (name, venue, group, etc.) with automatic property preservation using retrieve-then-update pattern',
        inputSchema: {
          type: 'object',
          properties: {
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to update',
            },
            apName: {
              type: 'string',
              description: 'New AP display name (optional)',
            },
            venueId: {
              type: 'string',
              description: 'Target venue ID (optional - for moving AP to different venue)',
            },
            apGroupId: {
              type: 'string',
              description: 'Target AP group ID (optional - for moving AP to different group)',
            },
            description: {
              type: 'string',
              description: 'Description for the update operation (optional)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['apSerialNumber'],
        },
      },
      {
        name: 'move_ap_to_group',
        description: 'Move AP to different group in same venue (preserves name and other properties)',
        inputSchema: {
          type: 'object',
          properties: {
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to move',
            },
            targetApGroupId: {
              type: 'string',
              description: 'Target AP group ID in the same venue',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['apSerialNumber', 'targetApGroupId'],
        },
      },
      {
        name: 'move_ap_to_venue',
        description: 'Move AP to different venue with specified AP group (preserves name and other properties)',
        inputSchema: {
          type: 'object',
          properties: {
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to move',
            },
            targetVenueId: {
              type: 'string',
              description: 'Target venue ID where the AP will be moved',
            },
            targetApGroupId: {
              type: 'string',
              description: 'Target AP group ID in the destination venue',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['apSerialNumber', 'targetVenueId', 'targetApGroupId'],
        },
      },
      {
        name: 'rename_ap',
        description: 'Change AP display name (preserves venue, group, and other properties)',
        inputSchema: {
          type: 'object',
          properties: {
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to rename',
            },
            newName: {
              type: 'string',
              description: 'New display name for the AP',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['apSerialNumber', 'newName'],
        },
      },
      {
        name: 'query_directory_server_profiles',
        description: 'Query directory server profiles from RUCKUS One with filtering and pagination support',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              description: 'Optional filters to apply',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to return (default: ["id", "name", "domainName", "host", "port", "type", "wifiNetworkIds"])',
            },
            searchString: {
              type: 'string',
              description: 'Search string to filter profiles',
            },
            searchTargetFields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to search in (default: ["name"])',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 10)',
            },
            sortField: {
              type: 'string',
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: 'string',
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_directory_server_profile',
        description: 'Get detailed information for a specific directory server profile',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the directory server profile to get',
            },
          },
          required: ['profileId'],
        },
      },
      {
        name: 'create_directory_server_profile',
        description: 'Create a new directory server profile in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the directory server profile',
            },
            type: {
              type: 'string',
              description: 'Type of directory server (e.g., "LDAP")',
            },
            tlsEnabled: {
              type: 'boolean',
              description: 'Whether TLS is enabled',
            },
            host: {
              type: 'string',
              description: 'Directory server hostname',
            },
            port: {
              type: 'number',
              description: 'Directory server port number',
            },
            domainName: {
              type: 'string',
              description: 'Domain name (e.g., "dc=example,dc=com")',
            },
            adminDomainName: {
              type: 'string',
              description: 'Admin domain name (e.g., "cn=admin,dc=example,dc=com")',
            },
            adminPassword: {
              type: 'string',
              description: 'Admin password',
            },
            identityName: {
              type: 'string',
              description: 'Identity name field',
            },
            identityEmail: {
              type: 'string',
              description: 'Identity email field',
            },
            identityPhone: {
              type: 'string',
              description: 'Identity phone field',
            },
            keyAttribute: {
              type: 'string',
              description: 'Key attribute (e.g., "uid")',
            },
            searchFilter: {
              type: 'string',
              description: 'Optional search filter',
            },
            attributeMappings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Attribute name',
                  },
                  mappedByName: {
                    type: 'string',
                    description: 'Mapped attribute name',
                  },
                },
                required: ['name', 'mappedByName'],
              },
              description: 'Array of attribute mappings',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['name', 'type', 'tlsEnabled', 'host', 'port', 'domainName', 'adminDomainName', 'adminPassword', 'identityName', 'identityEmail', 'identityPhone', 'keyAttribute', 'attributeMappings'],
        },
      },
      {
        name: 'update_directory_server_profile',
        description: 'Update a directory server profile in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the directory server profile to update',
            },
            name: {
              type: 'string',
              description: 'Name of the directory server profile',
            },
            type: {
              type: 'string',
              description: 'Type of directory server (e.g., "LDAP")',
            },
            tlsEnabled: {
              type: 'boolean',
              description: 'Whether TLS is enabled',
            },
            host: {
              type: 'string',
              description: 'Directory server hostname',
            },
            port: {
              type: 'number',
              description: 'Directory server port number',
            },
            domainName: {
              type: 'string',
              description: 'Domain name (e.g., "dc=example,dc=com")',
            },
            adminDomainName: {
              type: 'string',
              description: 'Admin domain name (e.g., "cn=admin,dc=example,dc=com")',
            },
            adminPassword: {
              type: 'string',
              description: 'Admin password',
            },
            identityName: {
              type: 'string',
              description: 'Identity name field',
            },
            identityEmail: {
              type: 'string',
              description: 'Identity email field',
            },
            identityPhone: {
              type: 'string',
              description: 'Identity phone field',
            },
            keyAttribute: {
              type: 'string',
              description: 'Key attribute (e.g., "uid")',
            },
            searchFilter: {
              type: 'string',
              description: 'Optional search filter',
            },
            attributeMappings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Attribute name',
                  },
                  mappedByName: {
                    type: 'string',
                    description: 'Mapped attribute name',
                  },
                },
                required: ['name', 'mappedByName'],
              },
              description: 'Array of attribute mappings',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['profileId', 'name', 'type', 'tlsEnabled', 'host', 'port', 'domainName', 'adminDomainName', 'adminPassword', 'identityName', 'identityEmail', 'identityPhone', 'keyAttribute', 'attributeMappings'],
        },
      },
      {
        name: 'delete_directory_server_profile',
        description: 'Delete a directory server profile from RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the directory server profile to delete',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['profileId'],
        },
      },
      {
        name: 'query_portal_service_profiles',
        description: 'Query portal service profiles from RUCKUS One with filtering and pagination support',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              description: 'Optional filters to apply',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to return (default: ["id", "name", "displayLangCode", "wifiNetworkIds"])',
            },
            searchString: {
              type: 'string',
              description: 'Search string to filter profiles',
            },
            searchTargetFields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to search in (default: ["name"])',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 10)',
            },
            sortField: {
              type: 'string',
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: 'string',
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_portal_service_profile',
        description: 'Get detailed information for a specific portal service profile',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the portal service profile to get',
            },
          },
          required: ['profileId'],
        },
      },
      {
        name: 'get_ruckus_user_groups',
        description: 'Get user group assignments showing which roles are assigned to users with venue and customer scope information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_ruckus_roles',
        description: 'Get all roles from RUCKUS One including both system roles (ADMIN, READ_ONLY, etc.) and custom roles with their feature permissions',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'update_custom_role',
        description: 'Update a custom role in RUCKUS One with specific features and permissions',
        inputSchema: {
          type: 'object',
          properties: {
            roleId: {
              type: 'string',
              description: 'ID of the custom role to update',
            },
            name: {
              type: 'string',
              description: 'Name of the custom role',
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of feature permissions (use query_role_features to see available options)',
            },
            preDefinedRole: {
              type: 'string',
              description: 'Base predefined role to inherit from (optional)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of polling retries (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['roleId', 'name', 'features'],
        },
      },
      {
        name: 'query_role_features',
        description: 'Search and filter role features for custom roles. Returns feature names to use in update_custom_role tool. Available categories: wifi, Wired, Gateways, AI, Admin. Search examples: "dhcp" for DHCP permissions, "access_points" for AP management, "venue" for venue features. Permission suffixes: -r (read), -c (create), -u (update), -d (delete)',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category: wifi, Wired, Gateways, AI, or Admin',
            },
            searchString: {
              type: 'string',
              description: 'Search in feature names and descriptions (e.g., "dhcp", "access_points", "venue")',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 100, max: 500)',
            },
            showScopes: {
              type: 'boolean',
              description: 'Whether to show scopes (default: false)',
            },
          },
          required: [],
        },
      },
      {
        name: 'create_custom_role',
        description: 'Create a new custom role in RUCKUS One with automatic parent permission injection. When you specify advanced permissions (e.g., wifi.venue-c), the tool automatically adds required parent permissions (e.g., wifi-r) for proper functionality. Use preDefinedRole="READ_ONLY" to include all base read permissions.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the custom role to create',
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of permission features. Use query_role_features to find valid feature names. Parent permissions are automatically added when needed.',
            },
            preDefinedRole: {
              type: 'string',
              description: 'Optional base role template (e.g., "READ_ONLY", "ADMIN"). Defaults to "READ_ONLY" for base read permissions.',
            },
          },
          required: ['name', 'features'],
        },
      },
      {
        name: 'delete_custom_role',
        description: 'Delete a custom role from RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            roleId: {
              type: 'string',
              description: 'ID of the custom role to delete',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['roleId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  console.log(`[MCP] Tool called: ${name}`);

  switch (name) {
    case 'get_ruckus_auth_token': {
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        return {
          content: [
            {
              type: 'text',
              text: token,
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting auth token:', error);
        let errorMessage = `Error getting Ruckus auth token: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_venues': {
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        const region = process.env.RUCKUS_REGION;
        const apiUrl = region && region.trim() !== ''
          ? `https://api.${region}.ruckus.cloud/venues/query`
          : 'https://api.ruckus.cloud/venues/query';
        const payload = {
          fields: ["id", "name"],
          searchTargetFields: ["name", "addressLine", "description", "tagList"],
          filters: {},
          sortField: "name",
          sortOrder: "ASC",
          page: 1,
          pageSize: 10000,
          defaultPageSize: 10,
          total: 0
        };
        const response = await axios.post(apiUrl, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('[MCP] Venues response:', response.data);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting venues:', error);
        let errorMessage = `Error getting Ruckus venues: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_activity_details': {
      try {
        const { activityId } = request.params.arguments as {
          activityId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const activityDetails = await getRuckusActivityDetails(
          token,
          activityId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Activity details response:', activityDetails);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(activityDetails, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting activity details:', error);
        let errorMessage = `Error getting activity details: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'create_ruckus_venue': {
      try {
        const { 
          name, 
          addressLine, 
          city, 
          country, 
          latitude, 
          longitude, 
          timezone,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          name: string;
          addressLine: string;
          city: string;
          country: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const venueData: any = {
          name,
          addressLine,
          city,
          country,
        };
        if (latitude !== undefined) venueData.latitude = latitude;
        if (longitude !== undefined) venueData.longitude = longitude;
        if (timezone !== undefined) venueData.timezone = timezone;

        const result = await createVenueWithRetry(
          token,
          venueData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Create venue response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error creating venue:', error);
        
        // Create a structured error response
        const errorResponse: any = {
          operation: 'create_venue',
          success: false,
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide detailed API response information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          errorResponse.apiResponse = error.response.data;
          
          // Extract specific error details from RUCKUS API response
          if (error.response.data) {
            if (error.response.data.error) {
              errorResponse.error.apiError = error.response.data.error;
            }
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorResponse.error.apiErrors = error.response.data.errors;
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'delete_ruckus_venue': {
      try {
        const { 
          venueId, 
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await deleteVenueWithRetry(
          token,
          venueId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Delete venue response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error deleting venue:', error);
        
        // Create a structured error response
        const errorResponse: any = {
          operation: 'delete_venue',
          success: false,
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide detailed API response information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          errorResponse.apiResponse = error.response.data;
          
          // Extract specific error details from RUCKUS API response
          if (error.response.data) {
            if (error.response.data.error) {
              errorResponse.error.apiError = error.response.data.error;
            }
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorResponse.error.apiErrors = error.response.data.errors;
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'update_ruckus_venue': {
      try {
        const { 
          venueId,
          name,
          description,
          addressLine,
          city,
          country,
          countryCode,
          latitude,
          longitude,
          timezone,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          name: string;
          description?: string;
          addressLine: string;
          city: string;
          country: string;
          countryCode?: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await updateVenueWithRetry(
          token,
          venueId,
          {
            name,
            ...(description !== undefined && { description }),
            addressLine,
            city,
            country,
            ...(countryCode !== undefined && { countryCode }),
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude }),
            ...(timezone !== undefined && { timezone })
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error('[MCP] Error updating venue:', error);
        
        let errorMessage = `Error updating venue: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
    }
    case 'create_ruckus_ap_group': {
      try {
        const { 
          venueId, 
          name, 
          description,
          apSerialNumbers,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          name: string;
          description?: string;
          apSerialNumbers?: Array<{ serialNumber: string }>;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const apGroupData: any = { name };
        if (description !== undefined) apGroupData.description = description;
        if (apSerialNumbers !== undefined) apGroupData.apSerialNumbers = apSerialNumbers;

        const result = await createApGroupWithRetry(
          token,
          venueId,
          apGroupData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Create AP group response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error creating AP group:', error);
        
        // Create a structured error response
        const errorResponse: any = {
          operation: 'create_ap_group',
          success: false,
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide detailed API response information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          errorResponse.apiResponse = error.response.data;
          
          // Extract specific error details from RUCKUS API response
          if (error.response.data) {
            if (error.response.data.error) {
              errorResponse.error.apiError = error.response.data.error;
            }
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorResponse.error.apiErrors = error.response.data.errors;
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_ap_groups': {
      try {
        const { 
          filters = {},
          fields = ['id', 'name'],
          page = 1,
          pageSize = 10000
        } = request.params.arguments as {
          filters?: any;
          fields?: string[];
          page?: number;
          pageSize?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryApGroups(
          token,
          process.env.RUCKUS_REGION,
          filters,
          fields,
          page,
          pageSize
        );
        
        console.log('[MCP] Query AP groups response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error querying AP groups:', error);
        
        let errorMessage = `Error querying AP groups: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'delete_ruckus_ap_group': {
      try {
        const { 
          venueId, 
          apGroupId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await deleteApGroupWithRetry(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Delete AP group response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error deleting AP group:', error);
        
        // Create a structured error response
        const errorResponse: any = {
          operation: 'delete_ap_group',
          success: false,
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide detailed API response information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          errorResponse.apiResponse = error.response.data;
          
          // Extract specific error details from RUCKUS API response
          if (error.response.data) {
            if (error.response.data.error) {
              errorResponse.error.apiError = error.response.data.error;
            }
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorResponse.error.apiErrors = error.response.data.errors;
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'update_ruckus_ap_group': {
      try {
        const { 
          venueId,
          apGroupId,
          name,
          description,
          apSerialNumbers,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
          name: string;
          description?: string;
          apSerialNumbers?: Array<{ serialNumber: string }>;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await updateApGroupWithRetry(
          token,
          venueId,
          apGroupId,
          {
            name,
            ...(description !== undefined && { description }),
            ...(apSerialNumbers !== undefined && { apSerialNumbers })
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error('[MCP] Error updating AP group:', error);
        
        let errorMessage = `Error updating AP group: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
    }
    case 'get_venue_external_antenna_settings': {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const antennaSettings = await getVenueExternalAntennaSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Venue external antenna settings response:', antennaSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(antennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting venue external antenna settings:', error);
        let errorMessage = `Error getting venue external antenna settings: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_venue_antenna_type_settings': {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const antennaTypeSettings = await getVenueAntennaTypeSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Venue antenna type settings response:', antennaTypeSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(antennaTypeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting venue antenna type settings:', error);
        let errorMessage = `Error getting venue antenna type settings: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ap_group_external_antenna_settings': {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const apGroupAntennaSettings = await getApGroupExternalAntennaSettings(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP group external antenna settings response:', apGroupAntennaSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apGroupAntennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP group external antenna settings:', error);
        let errorMessage = `Error getting AP group external antenna settings: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ap_group_antenna_type_settings': {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const apGroupAntennaTypeSettings = await getApGroupAntennaTypeSettings(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP group antenna type settings response:', apGroupAntennaTypeSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apGroupAntennaTypeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP group antenna type settings:', error);
        let errorMessage = `Error getting AP group antenna type settings: ${error}`;
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_aps': {
      try {
        const { 
          venueId,
          searchString = '',
          searchTargetFields,
          fields,
          page = 1,
          pageSize = 10,
          mesh = false
        } = request.params.arguments as {
          venueId?: string;
          searchString?: string;
          searchTargetFields?: string[];
          fields?: string[];
          page?: number;
          pageSize?: number;
          mesh?: boolean;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        // Build filters object
        const filters: any = {};
        if (venueId) {
          filters.venueId = [venueId];
        }
        
        const apsData = await queryAPs(
          token,
          process.env.RUCKUS_REGION,
          filters,
          fields,
          searchString,
          searchTargetFields,
          page,
          pageSize,
          mesh
        );
        
        console.log('[MCP] Query APs response:', apsData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apsData, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error querying APs:', error);
        
        // Build structured error response
        const errorResponse: any = {
          message: 'Failed to query APs',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide detailed API response information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          errorResponse.apiResponse = error.response.data;
          
          // Extract specific error details from RUCKUS API response
          if (error.response.data) {
            if (error.response.data.error) {
              errorResponse.error.apiError = error.response.data.error;
            }
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorResponse.error.apiErrors = error.response.data.errors;
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'move_ruckus_ap': {
      try {
        const { 
          venueId, 
          apSerialNumber, 
          apGroupId,
          apName,
          description,
          method = 'update',
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          apSerialNumber: string;
          apGroupId: string;
          apName?: string;
          description?: string;
          method?: 'direct' | 'update';
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        console.log('[MCP] Moving AP:', {
          venueId,
          apSerialNumber,
          apGroupId,
          method
        });
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await moveApWithRetry(
          token,
          venueId,
          apSerialNumber,
          apGroupId,
          apName,
          description,
          method,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Move AP response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error moving AP:', error);
        
        // Build structured error response
        const errorResponse: any = {
          message: 'Failed to move AP',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          
          // Add response data details for debugging
          if (error.response.data) {
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message || firstError.value;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'update_ruckus_ap': {
      try {
        const { 
          apSerialNumber,
          apName,
          venueId,
          apGroupId,
          description,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          apSerialNumber: string;
          apName?: string;
          venueId?: string;
          apGroupId?: string;
          description?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        console.log('[MCP] Updating AP:', {
          apSerialNumber,
          apName,
          venueId,
          apGroupId
        });
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        // Build changes object with only provided values
        const changes: any = {};
        if (apName !== undefined) changes.name = apName;
        if (venueId !== undefined) changes.venueId = venueId;
        if (apGroupId !== undefined) changes.apGroupId = apGroupId;
        if (description !== undefined) changes.description = description;
        
        const result = await updateApWithRetrieval(
          token,
          apSerialNumber,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
          changes
        );
        
        console.log('[MCP] Update AP response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error updating AP:', error);
        
        const errorResponse: any = {
          message: 'Failed to update AP',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
          
          if (error.response.data) {
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage = firstError.message || firstError.value;
                errorResponse.error.primaryErrorReason = firstError.reason;
              }
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
            if (error.response.data.code) {
              errorResponse.error.apiCode = error.response.data.code;
            }
            if (error.response.data.details) {
              errorResponse.error.details = error.response.data.details;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
          errorResponse.error.request = error.request;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'move_ap_to_group': {
      try {
        const { 
          apSerialNumber,
          targetApGroupId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          apSerialNumber: string;
          targetApGroupId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        console.log('[MCP] Moving AP to group:', {
          apSerialNumber,
          targetApGroupId
        });
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await moveApToGroup(
          token,
          apSerialNumber,
          targetApGroupId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Move AP to group response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error moving AP to group:', error);
        
        const errorResponse: any = {
          message: 'Failed to move AP to group',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'move_ap_to_venue': {
      try {
        const { 
          apSerialNumber,
          targetVenueId,
          targetApGroupId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          apSerialNumber: string;
          targetVenueId: string;
          targetApGroupId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        console.log('[MCP] Moving AP to venue:', {
          apSerialNumber,
          targetVenueId,
          targetApGroupId
        });
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await moveApToVenue(
          token,
          apSerialNumber,
          targetVenueId,
          targetApGroupId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Move AP to venue response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error moving AP to venue:', error);
        
        const errorResponse: any = {
          message: 'Failed to move AP to venue',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'rename_ap': {
      try {
        const { 
          apSerialNumber,
          newName,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          apSerialNumber: string;
          newName: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        console.log('[MCP] Renaming AP:', {
          apSerialNumber,
          newName
        });
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await renameAp(
          token,
          apSerialNumber,
          newName,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Rename AP response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error renaming AP:', error);
        
        const errorResponse: any = {
          message: 'Failed to rename AP',
          error: {
            message: error.message || 'Unknown error',
            type: error.name || 'Error'
          }
        };
        
        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case 'query_directory_server_profiles': {
      try {
        const { 
          filters = {},
          fields = ['id', 'name', 'domainName', 'host', 'port', 'type', 'wifiNetworkIds'],
          searchString = '',
          searchTargetFields = ['name'],
          page = 1,
          pageSize = 10,
          sortField = 'name',
          sortOrder = 'ASC'
        } = request.params.arguments as {
          filters?: any;
          fields?: string[];
          searchString?: string;
          searchTargetFields?: string[];
          page?: number;
          pageSize?: number;
          sortField?: string;
          sortOrder?: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryDirectoryServerProfiles(
          token,
          process.env.RUCKUS_REGION,
          filters,
          fields,
          searchString,
          searchTargetFields,
          page,
          pageSize,
          sortField,
          sortOrder
        );
        
        console.log('[MCP] Query directory server profiles response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error querying directory server profiles:', error);
        
        let errorMessage = `Error querying directory server profiles: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_directory_server_profile': {
      try {
        const { profileId } = request.params.arguments as {
          profileId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await getDirectoryServerProfile(
          token,
          profileId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Get directory server profile response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting directory server profile:', error);
        
        let errorMessage = `Error getting directory server profile: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'create_directory_server_profile': {
      try {
        const { 
          name,
          type,
          tlsEnabled,
          host,
          port,
          domainName,
          adminDomainName,
          adminPassword,
          identityName,
          identityEmail,
          identityPhone,
          keyAttribute,
          searchFilter,
          attributeMappings,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          name: string;
          type: string;
          tlsEnabled: boolean;
          host: string;
          port: number;
          domainName: string;
          adminDomainName: string;
          adminPassword: string;
          identityName: string;
          identityEmail: string;
          identityPhone: string;
          keyAttribute: string;
          searchFilter?: string;
          attributeMappings: Array<{
            name: string;
            mappedByName: string;
          }>;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await createDirectoryServerProfileWithRetry(
          token,
          {
            name,
            type,
            tlsEnabled,
            host,
            port,
            domainName,
            adminDomainName,
            adminPassword,
            identityName,
            identityEmail,
            identityPhone,
            keyAttribute,
            ...(searchFilter !== undefined && { searchFilter }),
            attributeMappings
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error('[MCP] Error creating directory server profile:', error);
        
        let errorMessage = `Error creating directory server profile: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
    }
    case 'update_directory_server_profile': {
      try {
        const { 
          profileId,
          name,
          type,
          tlsEnabled,
          host,
          port,
          domainName,
          adminDomainName,
          adminPassword,
          identityName,
          identityEmail,
          identityPhone,
          keyAttribute,
          searchFilter,
          attributeMappings,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          profileId: string;
          name: string;
          type: string;
          tlsEnabled: boolean;
          host: string;
          port: number;
          domainName: string;
          adminDomainName: string;
          adminPassword: string;
          identityName: string;
          identityEmail: string;
          identityPhone: string;
          keyAttribute: string;
          searchFilter?: string;
          attributeMappings: Array<{
            name: string;
            mappedByName: string;
          }>;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await updateDirectoryServerProfileWithRetry(
          token,
          profileId,
          {
            name,
            type,
            tlsEnabled,
            host,
            port,
            domainName,
            adminDomainName,
            adminPassword,
            identityName,
            identityEmail,
            identityPhone,
            keyAttribute,
            ...(searchFilter !== undefined && { searchFilter }),
            attributeMappings
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error('[MCP] Error updating directory server profile:', error);
        
        let errorMessage = `Error updating directory server profile: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
    }
    case 'delete_directory_server_profile': {
      try {
        const { 
          profileId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          profileId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await deleteDirectoryServerProfileWithRetry(
          token,
          profileId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        console.error('[MCP] Error deleting directory server profile:', error);
        
        let errorMessage = `Error deleting directory server profile: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
    }
    case 'query_portal_service_profiles': {
      try {
        const { 
          filters = {},
          searchString = '',
          searchTargetFields = ['name'],
          page = 1,
          pageSize = 10,
          sortField = 'name',
          sortOrder = 'ASC'
        } = request.params.arguments as {
          filters?: any;
          searchString?: string;
          searchTargetFields?: string[];
          page?: number;
          pageSize?: number;
          sortField?: string;
          sortOrder?: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryPortalServiceProfiles(
          token,
          process.env.RUCKUS_REGION,
          filters,
          searchString,
          searchTargetFields,
          page,
          pageSize,
          sortField,
          sortOrder
        );
        
        console.log('[MCP] Query portal service profiles response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error querying portal service profiles:', error);
        
        let errorMessage = `Error querying portal service profiles: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_portal_service_profile': {
      try {
        const { profileId } = request.params.arguments as {
          profileId: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await getPortalServiceProfile(
          token,
          profileId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Get portal service profile response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting portal service profile:', error);
        
        let errorMessage = `Error getting portal service profile: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_user_groups': {
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryPrivilegeGroups(
          token,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Get user groups response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting user groups:', error);
        
        let errorMessage = `Error getting user groups: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'get_ruckus_roles': {
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryCustomRoles(
          token,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Get roles response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting roles:', error);
        
        let errorMessage = `Error getting roles: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'update_custom_role': {
      try {
        const { 
          roleId,
          name,
          features,
          preDefinedRole,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          roleId: string;
          name: string;
          features: string[];
          preDefinedRole?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const roleData = { name, features } as any;
        if (preDefinedRole !== undefined) {
          roleData.preDefinedRole = preDefinedRole;
        }
        
        const result = await updateCustomRoleWithRetry(
          token,
          roleId,
          roleData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error updating custom role:', error);
        
        let errorMessage = `Error updating custom role: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'query_role_features': {
      try {
        const { 
          showScopes = false,
          category = '',
          searchString = '',
          page = 1,
          pageSize = 100
        } = request.params.arguments as {
          showScopes?: boolean;
          category?: string;
          searchString?: string;
          page?: number;
          pageSize?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await queryRoleFeatures(
          token,
          process.env.RUCKUS_REGION,
          showScopes,
          category,
          searchString,
          page,
          pageSize
        );
        
        console.log('[MCP] Query role features response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error querying role features:', error);
        
        let errorMessage = `Error querying role features: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'create_custom_role': {
      try {
        const { 
          name,
          features,
          preDefinedRole = 'READ_ONLY'
        } = request.params.arguments as {
          name: string;
          features: string[];
          preDefinedRole?: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await createCustomRole(
          token,
          name,
          features,
          process.env.RUCKUS_REGION,
          preDefinedRole
        );
        
        console.log('[MCP] Create custom role response:', result);
        
        // Build user-friendly response with auto-added permissions info
        let responseText: string;
        
        if (result._mcp_metadata?.autoAddedPermissions?.length > 0) {
          responseText = `Custom role created successfully!\n\n` +
            `Auto-added parent permissions for proper functionality:\n` +
            `${result._mcp_metadata.autoAddedPermissions.map((p: string) => `  - ${p}`).join('\n')}\n\n` +
            `Role Details:\n` +
            JSON.stringify({
              id: result.id,
              name: result.name,
              features: result.features,
              type: result.type,
              preDefinedRole: result.preDefinedRole
            }, null, 2);
        } else {
          responseText = `Custom role created successfully!\n\n` +
            `No additional permissions were needed.\n\n` +
            `Role Details:\n` +
            JSON.stringify({
              id: result.id,
              name: result.name,
              features: result.features,
              type: result.type,
              preDefinedRole: result.preDefinedRole
            }, null, 2);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error creating custom role:', error);
        
        let errorMessage = `Error creating custom role: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case 'delete_custom_role': {
      try {
        const { 
          roleId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          roleId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const result = await deleteCustomRoleWithRetry(
          token,
          roleId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Delete custom role response:', result);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error deleting custom role:', error);
        
        let errorMessage = `Error deleting custom role: ${error}`;
        
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ruckus://auth/token',
        name: 'Ruckus Auth Token',
        description: 'Current RUCKUS One JWT token',
        mimeType: 'text/plain',
      },
      {
        uri: 'ruckus://venues/list',
        name: 'Ruckus Venues',
        description: 'List of venues from RUCKUS One',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  try {
    if (uri === 'ruckus://auth/token') {
      const token = await getRuckusJwtToken(
        process.env.RUCKUS_TENANT_ID!,
        process.env.RUCKUS_CLIENT_ID!,
        process.env.RUCKUS_CLIENT_SECRET!,
        process.env.RUCKUS_REGION
      );
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: token,
          },
        ],
      };
    } else if (uri === 'ruckus://venues/list') {
      const token = await getRuckusJwtToken(
        process.env.RUCKUS_TENANT_ID!,
        process.env.RUCKUS_CLIENT_ID!,
        process.env.RUCKUS_CLIENT_SECRET!,
        process.env.RUCKUS_REGION
      );
      const region = process.env.RUCKUS_REGION;
      const apiUrl = region && region.trim() !== ''
        ? `https://api.${region}.ruckus.cloud/venues/query`
        : 'https://api.ruckus.cloud/venues/query';
      const payload = {
        fields: ["id", "name"],
        searchTargetFields: ["name", "addressLine", "description", "tagList"],
        filters: {},
        sortField: "name",
        sortOrder: "ASC",
        page: 1,
        pageSize: 10000,
        defaultPageSize: 10,
        total: 0
      };
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown resource: ${uri}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading resource ${uri}: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
console.log('RUCKUS1 MCP server is running and ready for connections.');
server.connect(transport); 