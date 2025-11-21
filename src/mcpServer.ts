import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { getRuckusJwtToken, getRuckusActivityDetails, createVenueWithRetry, updateVenueWithRetry, deleteVenueWithRetry, createApGroupWithRetry, addApToGroupWithRetry, removeApWithRetry, updateApGroupWithRetry, queryApGroups, deleteApGroupWithRetry, getVenueExternalAntennaSettings, getVenueAntennaTypeSettings, getApGroupExternalAntennaSettings, getApGroupAntennaTypeSettings, getVenueApModelBandModeSettings, getVenueRadioSettings, getApGroupApModelBandModeSettings, getApGroupRadioSettings, getApRadioSettings, getApClientAdmissionControlSettings, getApGroupClientAdmissionControlSettings, queryAPs, updateApWithRetrieval, queryDirectoryServerProfiles, getDirectoryServerProfile, createDirectoryServerProfileWithRetry, updateDirectoryServerProfileWithRetry, deleteDirectoryServerProfileWithRetry, queryPortalServiceProfiles, getPortalServiceProfile, createPortalServiceProfileWithRetry, updatePortalServiceProfileWithRetry, deletePortalServiceProfileWithRetry, queryPrivilegeGroups, updatePrivilegeGroupSimple, queryCustomRoles, updateCustomRoleWithRetry, queryRoleFeatures, createCustomRole, deleteCustomRoleWithRetry, queryWifiNetworks, getWifiNetwork, createWifiNetworkWithRetry, activateWifiNetworkAtVenuesWithRetry, deactivateWifiNetworkAtVenuesWithRetry, deleteWifiNetworkWithRetry, createGuestPassWithRetry, updateWifiNetworkPortalServiceProfileWithRetry, updateWifiNetworkRadiusServerProfileSettingsWithRetry, updateWifiNetworkWithRetry } from './services/ruckusApiService';
import { tokenService } from './services/tokenService';

dotenv.config();

const server = new Server(
  {
    name: 'ruckus1-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
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
        name: 'add_ap_to_group',
        description: 'Add an access point to an AP group in a RUCKUS One venue with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to add the AP to',
            },
            name: {
              type: 'string',
              description: 'Display name for the access point',
            },
            serialNumber: {
              type: 'string',
              description: 'Serial number of the access point',
            },
            description: {
              type: 'string',
              description: 'Optional description of the access point',
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
          required: ['venueId', 'apGroupId', 'name', 'serialNumber'],
        },
      },
      {
        name: 'remove_ap',
        description: 'Remove an access point from a RUCKUS One venue with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP',
            },
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the access point to remove',
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
          required: ['venueId', 'apSerialNumber'],
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
        name: 'get_venue_ap_model_band_mode_settings',
        description: 'Get AP model band mode settings for a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to get AP model band mode settings for',
            },
          },
          required: ['venueId'],
        },
      },
      {
        name: 'get_venue_radio_settings',
        description: 'Get radio settings for a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to get radio settings for',
            },
          },
          required: ['venueId'],
        },
      },
      {
        name: 'get_ap_group_ap_model_band_mode_settings',
        description: 'Get AP model band mode settings for a specific AP group in a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to get AP model band mode settings for',
            },
          },
          required: ['venueId', 'apGroupId'],
        },
      },
      {
        name: 'get_ap_group_radio_settings',
        description: 'Get radio settings for a specific AP group in a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to get radio settings for',
            },
          },
          required: ['venueId', 'apGroupId'],
        },
      },
      {
        name: 'get_ap_radio_settings',
        description: 'Get radio settings for a specific AP',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP',
            },
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to get radio settings for',
            },
          },
          required: ['venueId', 'apSerialNumber'],
        },
      },
      {
        name: 'get_ap_client_admission_control_settings',
        description: 'Get client admission control settings for a specific AP',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP',
            },
            apSerialNumber: {
              type: 'string',
              description: 'Serial number of the AP to get client admission control settings for',
            },
          },
          required: ['venueId', 'apSerialNumber'],
        },
      },
      {
        name: 'get_ap_group_client_admission_control_settings',
        description: 'Get client admission control settings for a specific AP group',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to get client admission control settings for',
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
        name: 'create_portal_service_profile',
        description: 'Create a new portal service profile in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the portal service profile',
            },
            content: {
              type: 'object',
              description: 'Portal content configuration object with styling, text, and display settings',
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
          required: ['name', 'content'],
        },
      },
      {
        name: 'update_portal_service_profile',
        description: 'Update a portal service profile in RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the portal service profile to update',
            },
            name: {
              type: 'string',
              description: 'Name of the portal service profile',
            },
            content: {
              type: 'object',
              description: 'Portal content configuration object with styling, text, and display settings',
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
          required: ['profileId', 'name', 'content'],
        },
      },
      {
        name: 'delete_portal_service_profile',
        description: 'Delete a portal service profile from RUCKUS One with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            profileId: {
              type: 'string',
              description: 'ID of the portal service profile to delete',
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
        name: 'update_privilege_group',
        description: 'Update a privilege group in RUCKUS One using simple parameters. Accepts group and venue names (auto-resolves to IDs) or IDs directly. Examples: {"privilegeGroupName": "example-group-1", "name": "example-group-1", "roleName": "example-role-1", "delegation": false, "allVenues": true} or {"privilegeGroupName": "example-group-1", "name": "example-group-1", "roleName": "example-role-1", "delegation": false, "allVenues": false, "venueNames": ["Example Venue 1", "Example Venue 2"]}',
        inputSchema: {
          type: 'object',
          properties: {
            privilegeGroupName: {
              type: 'string',
              description: 'Name or ID of the privilege group to update (use query_privilege_groups to see available groups)',
            },
            name: {
              type: 'string',
              description: 'Display name of the privilege group',
            },
            roleName: {
              type: 'string',
              description: 'Name of the role to assign to the group (use get_ruckus_roles to find available roles)',
            },
            delegation: {
              type: 'boolean',
              description: 'Whether delegation is enabled for this group',
            },
            allVenues: {
              type: 'boolean',
              description: 'Grant access to all venues (true) or specific venues only (false). Default: true',
            },
            venueNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of venue names or IDs (only used when allVenues is false). Use get_ruckus_venues to see available venues',
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
          required: ['privilegeGroupName', 'name', 'roleName', 'delegation'],
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
      {
        name: 'query_wifi_networks',
        description: 'Query WiFi networks from RUCKUS One with filtering and pagination support',
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
              description: 'Fields to return (default: ["name", "description", "nwSubType", "venueApGroups", "apSerialNumbers", "apCount", "clientCount", "vlan", "cog", "ssid", "vlanPool", "captiveType", "id", "securityProtocol", "dsaeOnboardNetwork", "isOweMaster", "owePairNetworkId", "tunnelWlanEnable", "isEnforced"])',
            },
            searchString: {
              type: 'string',
              description: 'Search string to filter WiFi networks',
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
        name: 'get_wifi_network',
        description: 'Get detailed information for a specific WiFi network',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to get',
            },
          },
          required: ['networkId'],
        },
      },
      {
        name: 'create_wifi_network',
        description: 'Create a new WiFi network (WLAN/SSID) in RUCKUS One without activating at any venue. The network is created globally and can later be activated at specific venues using activate_wifi_network_at_venue or activate_wifi_network_at_venues. FOR PSK: Requires passphrase + wlanSecurity=WPA2Personal. FOR GUEST PASS: Requires portalServiceProfileId (use query_portal_service_profiles to get ID) + wlanSecurity=None.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the WiFi network (internal identifier)',
            },
            ssid: {
              type: 'string',
              description: 'SSID (network name visible to clients)',
            },
            type: {
              type: 'string',
              description: 'Network type: psk (WPA2 Personal) or guest (Guest Pass portal)',
              enum: ['psk', 'enterprise', 'open', 'guest'],
            },
            passphrase: {
              type: 'string',
              description: 'Network passphrase/password (REQUIRED for type=psk, minimum 8 characters)',
            },
            wlanSecurity: {
              type: 'string',
              description: 'WLAN security type (REQUIRED). Use WPA2Personal for PSK networks, None for guest pass networks',
              enum: ['WPA2Personal', 'WPA3Personal', 'WPA2Enterprise', 'WPA3Enterprise', 'Open', 'None'],
            },
            guestPortal: {
              type: 'object',
              description: 'Guest portal configuration object (optional for type=guest, uses defaults if not provided)',
            },
            portalServiceProfileId: {
              type: 'string',
              description: 'Portal service profile ID (REQUIRED for type=guest, use query_portal_service_profiles to get available IDs)',
            },
            vlanId: {
              type: 'number',
              description: 'VLAN ID for client traffic (default: 1)',
            },
            managementFrameProtection: {
              type: 'string',
              description: 'Management Frame Protection (802.11w) setting (default: Disabled)',
              enum: ['Disabled', 'Capable', 'Required'],
            },
            maxClientsOnWlanPerRadio: {
              type: 'number',
              description: 'Maximum clients per radio (default: 100)',
            },
            enableBandBalancing: {
              type: 'boolean',
              description: 'Enable band balancing (default: true)',
            },
            clientIsolation: {
              type: 'boolean',
              description: 'Enable client isolation (default: false)',
            },
            hideSsid: {
              type: 'boolean',
              description: 'Hide SSID from broadcast (default: false)',
            },
            enableFastRoaming: {
              type: 'boolean',
              description: 'Enable 802.11r fast roaming (default: false)',
            },
            mobilityDomainId: {
              type: 'number',
              description: 'Mobility domain ID for fast roaming (default: 1)',
            },
            wifi6Enabled: {
              type: 'boolean',
              description: 'Enable WiFi 6 (802.11ax) support (default: true)',
            },
            wifi7Enabled: {
              type: 'boolean',
              description: 'Enable WiFi 7 (802.11be) support (default: true)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts for async polling (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['name', 'ssid', 'type', 'wlanSecurity'],
        },
      },
      {
        name: 'activate_wifi_network_at_venues',
        description: 'Activate an existing WiFi network at one or more venues. This is a batch operation that activates the network at specified venues in a single call. The network must already be created using create_wifi_network. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueConfigs array (use get_ruckus_venues to get venue IDs). FOR GUEST PASS NETWORKS: Must provide portalServiceProfileId (use query_portal_service_profiles to get ID). FOR PSK NETWORKS: Do not provide portalServiceProfileId. Can activate at a single venue or multiple venues.',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to activate (use query_wifi_networks to find network ID)',
            },
            venueConfigs: {
              type: 'array',
              description: 'Array of venue configurations where the network should be activated. Each venue config specifies venue ID, AP groups, radios, and schedule. Can contain one venue or multiple venues.',
              items: {
                type: 'object',
                properties: {
                  venueId: {
                    type: 'string',
                    description: 'ID of the venue (use get_ruckus_venues to get venue IDs)',
                  },
                  isAllApGroups: {
                    type: 'boolean',
                    description: 'Broadcast on all AP groups in the venue (true) or specific groups only (false)',
                  },
                  apGroups: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of AP group IDs (use get_ruckus_ap_groups to get AP group IDs). Required only if isAllApGroups is false',
                  },
                  allApGroupsRadio: {
                    type: 'string',
                    description: 'Which radios to use: Both (2.4GHz + 5GHz), 2.4GHz, 5GHz, or 6GHz. Use "Both" for most cases',
                    enum: ['Both', '2.4GHz', '5GHz', '6GHz'],
                  },
                  allApGroupsRadioTypes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Radio types to enable. Use ["2.4-GHz", "5-GHz"] for dual-band or ["2.4-GHz", "5-GHz", "6-GHz"] for tri-band',
                  },
                  scheduler: {
                    type: 'object',
                    description: 'Network schedule configuration. Use {type: "ALWAYS_ON"} for 24/7 availability',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'Schedule type: ALWAYS_ON (24/7) or SCHEDULED (custom schedule)',
                        enum: ['ALWAYS_ON', 'SCHEDULED'],
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['venueId', 'isAllApGroups', 'allApGroupsRadio', 'allApGroupsRadioTypes', 'scheduler'],
              },
            },
            portalServiceProfileId: {
              type: 'string',
              description: 'Portal service profile ID (REQUIRED for guest pass networks - use query_portal_service_profiles to get ID, do not provide for PSK networks)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts for async polling (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['networkId', 'venueConfigs'],
        },
      },
      {
        name: 'update_wifi_network_portal_service_profile',
        description: 'Associate a portal service profile with a WiFi network',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network',
            },
            profileId: {
              type: 'string',
              description: 'ID of the portal service profile to associate',
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
          required: ['networkId', 'profileId'],
        },
      },
      {
        name: 'update_wifi_network_radius_server_profile_settings',
        description: 'Update RADIUS server profile settings for a WiFi network',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network',
            },
            enableAccountingProxy: {
              type: 'boolean',
              description: 'Enable accounting proxy (default: false)',
            },
            enableAuthProxy: {
              type: 'boolean',
              description: 'Enable authentication proxy (default: false)',
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
          required: ['networkId'],
        },
      },
      {
        name: 'update_wifi_network',
        description: 'Update a WiFi network with full configuration object',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to update',
            },
            networkConfig: {
              type: 'object',
              description: 'Full network configuration object',
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
          required: ['networkId', 'networkConfig'],
        },
      },
      {
        name: 'deactivate_wifi_network_at_venues',
        description: 'Deactivate a WiFi network from one or more venues. This is a batch operation that removes the network from specified venues in a single call. The network remains globally available but is no longer broadcast at these venues. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueIds array (use get_ruckus_venues to get venue IDs). Can deactivate from a single venue or multiple venues.',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to deactivate (use query_wifi_networks to find network ID)',
            },
            venueIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of venue IDs where the network should be deactivated (use get_ruckus_venues to get venue IDs). Can contain one venue or multiple venues.',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts for async polling (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['networkId', 'venueIds'],
        },
      },
      {
        name: 'delete_wifi_network',
        description: 'Permanently delete a WiFi network from RUCKUS One. This removes the network globally and cannot be undone. PREREQUISITE: Network must be deactivated from all venues first (use deactivate_wifi_network_at_venues). REQUIRED: networkId (use query_wifi_networks to get network ID).',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to delete (use query_wifi_networks to find network ID)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts for async polling (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['networkId'],
        },
      },
      {
        name: 'create_guest_pass',
        description: 'Create a guest pass credential for a WiFi network in RUCKUS One. This generates a temporary access credential with configurable expiration and device limits. Returns the generated password in the response. REQUIRED: networkId (use query_wifi_networks to get network ID) + name + expiration (duration, unit, activationType) + maxDevices + deliveryMethods. Use deliveryMethods: ["PRINT"] for manual distribution.',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'ID of the WiFi network to create guest pass for (use query_wifi_networks to find network ID)',
            },
            name: {
              type: 'string',
              description: 'Name/identifier for the guest pass',
            },
            expiration: {
              type: 'object',
              description: 'Expiration configuration for the guest pass',
              properties: {
                duration: {
                  type: 'number',
                  description: 'Duration value (e.g., 7 for 7 days)',
                },
                unit: {
                  type: 'string',
                  description: 'Time unit for duration',
                  enum: ['Hour', 'Day', 'Week', 'Month'],
                },
                activationType: {
                  type: 'string',
                  description: 'When expiration starts: Creation (from creation time) or FirstUse (from first connection)',
                  enum: ['Creation', 'FirstUse'],
                },
              },
              required: ['duration', 'unit', 'activationType'],
            },
            maxDevices: {
              type: 'number',
              description: 'Maximum number of devices that can use this guest pass simultaneously',
            },
            deliveryMethods: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['PRINT', 'EMAIL', 'SMS'],
              },
              description: 'How the guest pass will be delivered. Use ["PRINT"] for manual distribution',
            },
            mobilePhoneNumber: {
              type: 'string',
              description: 'Mobile phone number for SMS delivery (required if SMS in deliveryMethods)',
            },
            email: {
              type: 'string',
              description: 'Email address for email delivery (required if EMAIL in deliveryMethods)',
            },
            notes: {
              type: 'string',
              description: 'Optional notes about this guest pass',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts for async polling (default: 5)',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
          },
          required: ['networkId', 'name', 'expiration', 'maxDevices', 'deliveryMethods'],
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
        const tokenResponse = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        return {
          content: [
            {
              type: 'text',
              text: tokenResponse.access_token,
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
        const token = await tokenService.getValidToken();
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
    case 'add_ap_to_group': {
      try {
        const { 
          venueId,
          apGroupId,
          name,
          serialNumber,
          description,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
          name: string;
          serialNumber: string;
          description?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const apData: any = {
          name,
          serialNumber
        };
        if (description !== undefined) apData.description = description;

        const result = await addApToGroupWithRetry(
          token,
          venueId,
          apGroupId,
          apData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );
        
        console.log('[MCP] Add AP to group response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error adding AP to group:', error);
        
        // Create a structured error response
        const errorResponse: any = {
          operation: 'add_ap_to_group',
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
            if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
              errorResponse.error.apiErrors = error.response.data.errors;
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
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
    case 'remove_ap': {
      try {
        const {
          venueId,
          apSerialNumber,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          venueId: string;
          apSerialNumber: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await removeApWithRetry(
          token,
          venueId,
          apSerialNumber,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );

        console.log('[MCP] Remove AP response:', result);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error removing AP:', error);

        // Create a structured error response
        const errorResponse: any = {
          operation: 'remove_ap',
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
            if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
              errorResponse.error.apiErrors = error.response.data.errors;
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = 'No response received from server';
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
    case 'get_venue_ap_model_band_mode_settings': {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const venueApModelBandModeSettings = await getVenueApModelBandModeSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Venue AP model band mode settings response:', venueApModelBandModeSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(venueApModelBandModeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting venue AP model band mode settings:', error);
        let errorMessage = `Error getting venue AP model band mode settings: ${error}`;
        
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
    case 'get_venue_radio_settings': {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const venueRadioSettings = await getVenueRadioSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] Venue radio settings response:', venueRadioSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(venueRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting venue radio settings:', error);
        let errorMessage = `Error getting venue radio settings: ${error}`;
        
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
    case 'get_ap_group_ap_model_band_mode_settings': {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const apGroupApModelBandModeSettings = await getApGroupApModelBandModeSettings(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP group AP model band mode settings response:', apGroupApModelBandModeSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apGroupApModelBandModeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP group AP model band mode settings:', error);
        let errorMessage = `Error getting AP group AP model band mode settings: ${error}`;
        
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
    case 'get_ap_group_radio_settings': {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const apGroupRadioSettings = await getApGroupRadioSettings(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP group radio settings response:', apGroupRadioSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apGroupRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP group radio settings:', error);
        let errorMessage = `Error getting AP group radio settings: ${error}`;
        
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
    case 'get_ap_radio_settings': {
      try {
        const { venueId, apSerialNumber } = request.params.arguments as {
          venueId: string;
          apSerialNumber: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const apRadioSettings = await getApRadioSettings(
          token,
          venueId,
          apSerialNumber,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP radio settings response:', apRadioSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP radio settings:', error);
        let errorMessage = `Error getting AP radio settings: ${error}`;
        
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
    case 'get_ap_client_admission_control_settings': {
      try {
        const { venueId, apSerialNumber } = request.params.arguments as {
          venueId: string;
          apSerialNumber: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const apClientAdmissionControlSettings = await getApClientAdmissionControlSettings(
          token,
          venueId,
          apSerialNumber,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP client admission control settings response:', apClientAdmissionControlSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apClientAdmissionControlSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP client admission control settings:', error);
        let errorMessage = `Error getting AP client admission control settings: ${error}`;
        
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
    case 'get_ap_group_client_admission_control_settings': {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };
        
        const token = await tokenService.getValidToken();
        
        const apGroupClientAdmissionControlSettings = await getApGroupClientAdmissionControlSettings(
          token,
          venueId,
          apGroupId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP group client admission control settings response:', apGroupClientAdmissionControlSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apGroupClientAdmissionControlSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP group client admission control settings:', error);
        let errorMessage = `Error getting AP group client admission control settings: ${error}`;
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
        // Build changes object with only provided values
        const changes: any = {};
        if (apName !== undefined) changes.name = apName;
        if (venueId !== undefined) changes.venueId = venueId;
        if (apGroupId !== undefined) changes.apGroupId = apGroupId;
        if (description !== undefined) changes.description = description;
        
        const result = await updateApWithRetrieval(
          token,
          apSerialNumber,
          changes,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
    case 'create_portal_service_profile': {
      try {
        const { 
          name,
          content,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          name: string;
          content: any;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await createPortalServiceProfileWithRetry(
          token,
          {
            name,
            content
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
        console.error('[MCP] Error creating portal service profile:', error);
        
        let errorMessage = `Error creating portal service profile: ${error}`;
        
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
    case 'update_portal_service_profile': {
      try {
        const { 
          profileId,
          name,
          content,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          profileId: string;
          name: string;
          content: any;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await updatePortalServiceProfileWithRetry(
          token,
          profileId,
          {
            name,
            content
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
        console.error('[MCP] Error updating portal service profile:', error);
        
        let errorMessage = `Error updating portal service profile: ${error}`;
        
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
    case 'delete_portal_service_profile': {
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
        
        const token = await tokenService.getValidToken();
        
        const result = await deletePortalServiceProfileWithRetry(
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
        console.error('[MCP] Error deleting portal service profile:', error);
        
        let errorMessage = `Error deleting portal service profile: ${error}`;
        
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
    case 'get_ruckus_user_groups': {
      try {
        const token = await tokenService.getValidToken();
        
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
        const token = await tokenService.getValidToken();
        
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
    case 'update_privilege_group': {
      try {
        const { 
          privilegeGroupName,
          name,
          roleName,
          delegation,
          allVenues = true,
          venueNames = [],
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          privilegeGroupName: string;
          name: string;
          roleName: string;
          delegation: boolean;
          allVenues?: boolean;
          venueNames?: string[];
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await updatePrivilegeGroupSimple(
          token,
          privilegeGroupName,
          name,
          roleName,
          delegation,
          allVenues,
          venueNames,
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
        console.error('[MCP] Error updating privilege group:', error);
        
        let errorMessage = `Error updating privilege group: ${error}`;
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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
        
        const token = await tokenService.getValidToken();
        
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

    case 'query_wifi_networks': {
      try {
        const {
          filters = {},
          fields = ['name', 'description', 'nwSubType', 'venueApGroups', 'apSerialNumbers', 'apCount', 'clientCount', 'vlan', 'cog', 'ssid', 'vlanPool', 'captiveType', 'id', 'securityProtocol', 'dsaeOnboardNetwork', 'isOweMaster', 'owePairNetworkId', 'tunnelWlanEnable', 'isEnforced'],
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

        const token = await tokenService.getValidToken();

        const result = await queryWifiNetworks(
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

        console.log('[MCP] Query WiFi networks response:', result);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('[MCP] Error querying WiFi networks:', error);

        let errorMessage = `Error querying WiFi networks: ${error}`;

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

    case 'get_wifi_network': {
      try {
        const { networkId } = request.params.arguments as {
          networkId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getWifiNetwork(
          token,
          networkId,
          process.env.RUCKUS_REGION
        );

        console.log('[MCP] Get WiFi network response:', result);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('[MCP] Error getting WiFi network:', error);

        let errorMessage = `Error getting WiFi network: ${error}`;

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

    case 'create_wifi_network': {
      try {
        const {
          name,
          ssid,
          type,
          passphrase,
          wlanSecurity,
          vlanId,
          managementFrameProtection,
          maxClientsOnWlanPerRadio,
          enableBandBalancing,
          clientIsolation,
          hideSsid,
          enableFastRoaming,
          mobilityDomainId,
          wifi6Enabled,
          wifi7Enabled,
          guestPortal,
          portalServiceProfileId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          name: string;
          ssid: string;
          type: 'psk' | 'enterprise' | 'open' | 'guest';
          passphrase?: string;
          wlanSecurity: 'WPA2Personal' | 'WPA3Personal' | 'WPA2Enterprise' | 'WPA3Enterprise' | 'Open' | 'None';
          vlanId?: number;
          managementFrameProtection?: 'Disabled' | 'Capable' | 'Required';
          maxClientsOnWlanPerRadio?: number;
          enableBandBalancing?: boolean;
          clientIsolation?: boolean;
          hideSsid?: boolean;
          enableFastRoaming?: boolean;
          mobilityDomainId?: number;
          wifi6Enabled?: boolean;
          wifi7Enabled?: boolean;
          guestPortal?: any;
          portalServiceProfileId?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const networkConfig: any = {
          name,
          ssid,
          type,
          wlanSecurity,
        };

        // Add optional properties only if defined
        if (passphrase !== undefined) networkConfig.passphrase = passphrase;
        if (vlanId !== undefined) networkConfig.vlanId = vlanId;
        if (managementFrameProtection !== undefined) networkConfig.managementFrameProtection = managementFrameProtection;
        if (maxClientsOnWlanPerRadio !== undefined) networkConfig.maxClientsOnWlanPerRadio = maxClientsOnWlanPerRadio;
        if (enableBandBalancing !== undefined) networkConfig.enableBandBalancing = enableBandBalancing;
        if (clientIsolation !== undefined) networkConfig.clientIsolation = clientIsolation;
        if (hideSsid !== undefined) networkConfig.hideSsid = hideSsid;
        if (enableFastRoaming !== undefined) networkConfig.enableFastRoaming = enableFastRoaming;
        if (mobilityDomainId !== undefined) networkConfig.mobilityDomainId = mobilityDomainId;
        if (wifi6Enabled !== undefined) networkConfig.wifi6Enabled = wifi6Enabled;
        if (wifi7Enabled !== undefined) networkConfig.wifi7Enabled = wifi7Enabled;
        if (guestPortal !== undefined) networkConfig.guestPortal = guestPortal;
        if (portalServiceProfileId !== undefined) networkConfig.portalServiceProfileId = portalServiceProfileId;

        const result = await createWifiNetworkWithRetry(
          token,
          networkConfig,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );

        console.log('[MCP] Create WiFi network response:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error creating WiFi network:', error);

        let errorMessage = `Error creating WiFi network: ${error}`;

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

    case 'activate_wifi_network_at_venues': {
      try {
        const {
          networkId,
          venueConfigs,
          portalServiceProfileId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          venueConfigs: Array<{
            venueId: string;
            isAllApGroups: boolean;
            apGroups?: string[];
            allApGroupsRadio: 'Both' | '2.4GHz' | '5GHz' | '6GHz';
            allApGroupsRadioTypes: string[];
            scheduler: {
              type: 'ALWAYS_ON' | 'SCHEDULED';
              [key: string]: any;
            };
          }>;
          portalServiceProfileId?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await activateWifiNetworkAtVenuesWithRetry(
          token,
          networkId,
          venueConfigs,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
          portalServiceProfileId
        );

        console.log('[MCP] Activate WiFi network at venues response:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error activating WiFi network at venues:', error);

        let errorMessage = `Error activating WiFi network at venues: ${error}`;

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

    case 'deactivate_wifi_network_at_venues': {
      try {
        const {
          networkId,
          venueIds,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          venueIds: string[];
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deactivateWifiNetworkAtVenuesWithRetry(
          token,
          networkId,
          venueIds,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );

        console.log('[MCP] Deactivate WiFi network at venues response:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error deactivating WiFi network at venues:', error);

        let errorMessage = `Error deactivating WiFi network at venues: ${error}`;

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

    case 'delete_wifi_network': {
      try {
        const {
          networkId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deleteWifiNetworkWithRetry(
          token,
          networkId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );

        console.log('[MCP] Delete WiFi network response:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error deleting WiFi network:', error);

        let errorMessage = `Error deleting WiFi network: ${error}`;

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

    case 'create_guest_pass': {
      try {
        const {
          networkId,
          name,
          expiration,
          maxDevices,
          deliveryMethods,
          mobilePhoneNumber,
          email,
          notes,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          name: string;
          expiration: {
            duration: number;
            unit: 'Hour' | 'Day' | 'Week' | 'Month';
            activationType: 'Creation' | 'FirstUse';
          };
          maxDevices: number;
          deliveryMethods: ('PRINT' | 'EMAIL' | 'SMS')[];
          mobilePhoneNumber?: string;
          email?: string;
          notes?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await createGuestPassWithRetry(
          token,
          networkId,
          {
            name,
            expiration,
            maxDevices,
            deliveryMethods,
            ...(mobilePhoneNumber !== undefined && { mobilePhoneNumber }),
            ...(email !== undefined && { email }),
            ...(notes !== undefined && { notes })
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs
        );

        console.log('[MCP] Create guest pass response:', result);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error creating guest pass:', error);

        let errorMessage = `Error creating guest pass: ${error}`;

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

    case 'update_wifi_network_portal_service_profile': {
      try {
        const { 
          networkId,
          profileId,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          profileId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await updateWifiNetworkPortalServiceProfileWithRetry(
          token,
          networkId,
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
        console.error('[MCP] Error updating WiFi network portal service profile:', error);
        
        let errorMessage = `Error updating WiFi network portal service profile: ${error}`;
        
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

    case 'update_wifi_network_radius_server_profile_settings': {
      try {
        const { 
          networkId,
          enableAccountingProxy = false,
          enableAuthProxy = false,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          enableAccountingProxy?: boolean;
          enableAuthProxy?: boolean;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await updateWifiNetworkRadiusServerProfileSettingsWithRetry(
          token,
          networkId,
          process.env.RUCKUS_REGION,
          enableAccountingProxy,
          enableAuthProxy,
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
        console.error('[MCP] Error updating WiFi network RADIUS server profile settings:', error);
        
        let errorMessage = `Error updating WiFi network RADIUS server profile settings: ${error}`;
        
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

    case 'update_wifi_network': {
      try {
        const { 
          networkId,
          networkConfig,
          maxRetries = 5,
          pollIntervalMs = 2000
        } = request.params.arguments as {
          networkId: string;
          networkConfig: any;
          maxRetries?: number;
          pollIntervalMs?: number;
        };
        
        const token = await tokenService.getValidToken();
        
        const result = await updateWifiNetworkWithRetry(
          token,
          networkId,
          networkConfig,
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
        console.error('[MCP] Error updating WiFi network:', error);
        
        let errorMessage = `Error updating WiFi network: ${error}`;
        
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



const transport = new StdioServerTransport();
console.log('RUCKUS1 MCP server is running and ready for connections.');
server.connect(transport); 