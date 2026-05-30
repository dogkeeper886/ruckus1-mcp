import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import {
  getRuckusJwtToken,
  getRuckusActivityDetails,
  createVenueWithRetry,
  updateVenueWithRetry,
  deleteVenueWithRetry,
  createApGroupWithRetry,
  addApToGroupWithRetry,
  removeApWithRetry,
  updateApGroupWithRetry,
  queryApGroups,
  deleteApGroupWithRetry,
  getVenueExternalAntennaSettings,
  getVenueAntennaTypeSettings,
  getApGroupExternalAntennaSettings,
  getApGroupAntennaTypeSettings,
  getVenueApModelBandModeSettings,
  getVenueRadioSettings,
  getApGroupApModelBandModeSettings,
  getApGroupRadioSettings,
  getApRadioSettings,
  getApClientAdmissionControlSettings,
  getApGroupClientAdmissionControlSettings,
  queryAPs,
  updateApWithRetrieval,
  queryDirectoryServerProfiles,
  getDirectoryServerProfile,
  createDirectoryServerProfileWithRetry,
  updateDirectoryServerProfileWithRetry,
  deleteDirectoryServerProfileWithRetry,
  queryRadiusServerProfiles,
  getRadiusServerProfile,
  createRadiusServerProfileWithRetry,
  deleteRadiusServerProfileWithRetry,
  updateRadiusServerProfileWithRetry,
  queryPortalServiceProfiles,
  getPortalServiceProfile,
  createPortalServiceProfileWithRetry,
  updatePortalServiceProfileWithRetry,
  deletePortalServiceProfileWithRetry,
  queryPrivilegeGroups,
  updatePrivilegeGroupSimple,
  queryCustomRoles,
  updateCustomRoleWithRetry,
  queryRoleFeatures,
  createCustomRole,
  deleteCustomRoleWithRetry,
  queryWifiNetworks,
  getWifiNetwork,
  createWifiNetworkWithRetry,
  activateWifiNetworkAtVenuesWithRetry,
  deactivateWifiNetworkAtVenuesWithRetry,
  deleteWifiNetworkWithRetry,
  queryGuestPasses,
  createGuestPassWithRetry,
  deleteGuestPassWithRetry,
  updateWifiNetworkWithRetry,
  queryClients,
  getApPassword,
  createIdentityGroupWithRetry,
  queryIdentityGroups,
  deleteIdentityGroupWithRetry,
  createDpskServiceWithRetry,
  queryDpskServices,
  deleteDpskServiceWithRetry,
  getVenueWifiNetworkSettings,
  updateVenueWifiNetworkSettingsWithRetry,
  getSmsProvider,
  createSmsProviderWithRetry,
  deleteSmsProvider,
} from "./services/ruckusApiService";
import { tokenService } from "./services/tokenService";

dotenv.config();

function mergeTermsConditionFields(
  content: any,
  fields: {
    termsConditionConfig?: any | undefined;
    termsConditionUrl?: string | undefined;
    termsConditionsDisplay?: boolean | undefined;
  },
): any {
  const base: any = {};
  if (fields.termsConditionConfig !== undefined)
    base.termsConditionConfig = fields.termsConditionConfig;
  if (fields.termsConditionUrl !== undefined)
    base.termsConditionUrl = fields.termsConditionUrl;

  const callerComponentDisplay =
    content && typeof content === "object" ? content.componentDisplay : undefined;
  const mergedComponentDisplay =
    fields.termsConditionsDisplay !== undefined ||
    callerComponentDisplay !== undefined
      ? {
          ...(fields.termsConditionsDisplay !== undefined
            ? { termsConditions: fields.termsConditionsDisplay }
            : {}),
          ...(callerComponentDisplay || {}),
        }
      : undefined;

  return {
    ...base,
    ...(content || {}),
    ...(mergedComponentDisplay !== undefined
      ? { componentDisplay: mergedComponentDisplay }
      : {}),
  };
}

const server = new Server(
  {
    name: "ruckus1-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_ruckus_auth_token",
        description: "Get a JWT token for RUCKUS One authentication",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_ruckus_venues",
        description: "Get a list of venues from RUCKUS One",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_ruckus_activity_details",
        description:
          "Get activity details from RUCKUS One using activity ID (e.g., requestId from venue creation)",
        inputSchema: {
          type: "object",
          properties: {
            activityId: {
              type: "string",
              description: "Activity ID (requestId) to get details for",
            },
          },
          required: ["activityId"],
        },
      },
      {
        name: "create_ruckus_venue",
        description:
          "Create a new venue in RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the venue",
            },
            addressLine: {
              type: "string",
              description:
                'Street address of the venue. IMPORTANT: Use city name for reliability (e.g., "Paris" instead of "123 Rue de la Paix") to avoid RUCKUS API validation failures.',
            },
            city: {
              type: "string",
              description:
                "City where the venue is located. Must match the country location to pass RUCKUS validation.",
            },
            country: {
              type: "string",
              description:
                'Country where the venue is located. Must match the actual country where the city is located (e.g., city: "Paris", country: "France").',
            },
            latitude: {
              type: "number",
              description: "Latitude coordinate (optional)",
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate (optional)",
            },
            timezone: {
              type: "string",
              description: "Timezone for the venue (optional)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["name", "addressLine", "city", "country"],
        },
      },
      {
        name: "delete_ruckus_venue",
        description:
          "Delete a venue from RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue to delete",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId"],
        },
      },
      {
        name: "update_ruckus_venue",
        description:
          "Update a venue in RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue to update",
            },
            name: {
              type: "string",
              description: "Name of the venue",
            },
            description: {
              type: "string",
              description: "Optional description of the venue",
            },
            addressLine: {
              type: "string",
              description: "Street address of the venue",
            },
            city: {
              type: "string",
              description: "City where the venue is located",
            },
            country: {
              type: "string",
              description: "Country where the venue is located",
            },
            countryCode: {
              type: "string",
              description: 'Country code (optional, e.g., "US")',
            },
            latitude: {
              type: "number",
              description: "Latitude coordinate (optional)",
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate (optional)",
            },
            timezone: {
              type: "string",
              description: "Timezone for the venue (optional)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "name", "addressLine", "city", "country"],
        },
      },
      {
        name: "create_ruckus_ap_group",
        description:
          "Create a new AP group in a RUCKUS One venue with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue where the AP group will be created",
            },
            name: {
              type: "string",
              description:
                "Name of the AP group (2-64 characters, no special characters like backticks or dollar signs)",
            },
            description: {
              type: "string",
              description:
                "Optional description of the AP group (2-180 characters)",
            },
            apSerialNumbers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  serialNumber: {
                    type: "string",
                    description: "Serial number of the access point",
                  },
                },
                required: ["serialNumber"],
              },
              description:
                "Optional array of AP serial numbers to include in the group",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "name"],
        },
      },
      {
        name: "add_ap_to_group",
        description:
          "Add an access point to an AP group in a RUCKUS One venue with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description: "ID of the AP group to add the AP to",
            },
            name: {
              type: "string",
              description: "Display name for the access point",
            },
            serialNumber: {
              type: "string",
              description: "Serial number of the access point",
            },
            description: {
              type: "string",
              description: "Optional description of the access point",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of polling retries (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "apGroupId", "name", "serialNumber"],
        },
      },
      {
        name: "remove_ap",
        description:
          "Remove an access point from a RUCKUS One venue with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP",
            },
            apSerialNumber: {
              type: "string",
              description: "Serial number of the access point to remove",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of polling retries (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "apSerialNumber"],
        },
      },
      {
        name: "get_ruckus_ap_groups",
        description:
          "Query AP groups from RUCKUS One with filtering and pagination support",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description:
                'Optional filters to apply (e.g., {"isDefault": [false]})',
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description: 'Fields to return (default: ["id", "name"])',
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10000)",
            },
          },
          required: [],
        },
      },
      {
        name: "delete_ruckus_ap_group",
        description:
          "Delete an AP group from a RUCKUS One venue with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description: "ID of the AP group to delete",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "update_ruckus_ap_group",
        description:
          "Update an AP group in a RUCKUS One venue. By default, preserves existing APs in the group when updating (e.g., renaming). REQUIRED: venueId (use get_ruckus_venues) + apGroupId (use get_ruckus_ap_groups). To replace APs entirely, provide apSerialNumbers array. To clear all APs, set preserveExistingAps to false without providing apSerialNumbers.",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue containing the AP group (use get_ruckus_venues to get venue IDs)",
            },
            apGroupId: {
              type: "string",
              description:
                "ID of the AP group to update (use get_ruckus_ap_groups to get AP group IDs)",
            },
            name: {
              type: "string",
              description: "Name of the AP group",
            },
            description: {
              type: "string",
              description: "Optional description of the AP group",
            },
            apSerialNumbers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  serialNumber: {
                    type: "string",
                    description: "Serial number of the access point",
                  },
                },
                required: ["serialNumber"],
              },
              description:
                "Optional array of AP serial numbers to include in the group. If not provided and preserveExistingAps is true (default), existing APs will be preserved",
            },
            preserveExistingAps: {
              type: "boolean",
              description:
                "Preserve existing APs in the group when updating. When true (default), if apSerialNumbers is not provided, existing APs will be retrieved and preserved. Set to false to explicitly clear all APs from the group",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "apGroupId", "name"],
        },
      },
      {
        name: "get_venue_external_antenna_settings",
        description: "Get external antenna settings for a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue to get external antenna settings for",
            },
          },
          required: ["venueId"],
        },
      },
      {
        name: "get_venue_antenna_type_settings",
        description: "Get antenna type settings for a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue to get antenna type settings for",
            },
          },
          required: ["venueId"],
        },
      },
      {
        name: "get_ap_group_external_antenna_settings",
        description:
          "Get external antenna settings for a specific AP group in a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description:
                "ID of the AP group to get external antenna settings for",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "get_ap_group_antenna_type_settings",
        description:
          "Get antenna type settings for a specific AP group in a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description:
                "ID of the AP group to get antenna type settings for",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "get_venue_ap_model_band_mode_settings",
        description: "Get AP model band mode settings for a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue to get AP model band mode settings for",
            },
          },
          required: ["venueId"],
        },
      },
      {
        name: "get_venue_radio_settings",
        description: "Get radio settings for a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue to get radio settings for",
            },
          },
          required: ["venueId"],
        },
      },
      {
        name: "get_ap_group_ap_model_band_mode_settings",
        description:
          "Get AP model band mode settings for a specific AP group in a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description:
                "ID of the AP group to get AP model band mode settings for",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "get_ap_group_radio_settings",
        description: "Get radio settings for a specific AP group in a venue",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description: "ID of the AP group to get radio settings for",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "get_ap_radio_settings",
        description: "Get radio settings for a specific AP",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP",
            },
            apSerialNumber: {
              type: "string",
              description: "Serial number of the AP to get radio settings for",
            },
          },
          required: ["venueId", "apSerialNumber"],
        },
      },
      {
        name: "get_ap_client_admission_control_settings",
        description: "Get client admission control settings for a specific AP",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP",
            },
            apSerialNumber: {
              type: "string",
              description:
                "Serial number of the AP to get client admission control settings for",
            },
          },
          required: ["venueId", "apSerialNumber"],
        },
      },
      {
        name: "get_ap_group_client_admission_control_settings",
        description:
          "Get client admission control settings for a specific AP group",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue containing the AP group",
            },
            apGroupId: {
              type: "string",
              description:
                "ID of the AP group to get client admission control settings for",
            },
          },
          required: ["venueId", "apGroupId"],
        },
      },
      {
        name: "get_ruckus_aps",
        description:
          "Get parameters and operational data for a list of APs or mesh APs",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description: "ID of the venue to filter APs (optional)",
            },
            searchString: {
              type: "string",
              description: "Search string to filter APs (optional)",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description:
                "Fields to search in (default: name, model, networkStatus.ipAddress, macAddress, tags, serialNumber)",
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                "Fields to return in the response (default: comprehensive set of AP data)",
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            mesh: {
              type: "boolean",
              description: "Get mesh APs (default: false)",
            },
          },
          required: [],
        },
      },
      {
        name: "update_ruckus_ap",
        description:
          "Update AP properties (name, venue, group, etc.) with automatic property preservation using retrieve-then-update pattern",
        inputSchema: {
          type: "object",
          properties: {
            apSerialNumber: {
              type: "string",
              description: "Serial number of the AP to update",
            },
            apName: {
              type: "string",
              description: "New AP display name (optional)",
            },
            venueId: {
              type: "string",
              description:
                "Target venue ID (optional - for moving AP to different venue)",
            },
            apGroupId: {
              type: "string",
              description:
                "Target AP group ID (optional - for moving AP to different group)",
            },
            description: {
              type: "string",
              description: "Description for the update operation (optional)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of polling retries (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["apSerialNumber"],
        },
      },
      {
        name: "query_directory_server_profiles",
        description:
          "Query directory server profiles from RUCKUS One with filtering and pagination support",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description: "Optional filters to apply",
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to return (default: ["id", "name", "domainName", "host", "port", "type", "wifiNetworkIds"])',
            },
            searchString: {
              type: "string",
              description: "Search string to filter profiles",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description: 'Fields to search in (default: ["name"])',
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "get_directory_server_profile",
        description:
          "Get detailed information for a specific directory server profile",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description: "ID of the directory server profile to get",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "create_directory_server_profile",
        description:
          "Create a new directory server profile in RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the directory server profile",
            },
            type: {
              type: "string",
              description: 'Type of directory server (e.g., "LDAP")',
            },
            tlsEnabled: {
              type: "boolean",
              description: "Whether TLS is enabled",
            },
            host: {
              type: "string",
              description: "Directory server hostname",
            },
            port: {
              type: "number",
              description: "Directory server port number",
            },
            domainName: {
              type: "string",
              description: 'Domain name (e.g., "dc=example,dc=com")',
            },
            adminDomainName: {
              type: "string",
              description:
                'Admin domain name (e.g., "cn=admin,dc=example,dc=com")',
            },
            adminPassword: {
              type: "string",
              description: "Admin password",
            },
            identityName: {
              type: "string",
              description: "Identity name field",
            },
            identityEmail: {
              type: "string",
              description: "Identity email field",
            },
            identityPhone: {
              type: "string",
              description: "Identity phone field",
            },
            keyAttribute: {
              type: "string",
              description: 'Key attribute (e.g., "uid")',
            },
            searchFilter: {
              type: "string",
              description: "Optional search filter",
            },
            attributeMappings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Attribute name",
                  },
                  mappedByName: {
                    type: "string",
                    description: "Mapped attribute name",
                  },
                },
                required: ["name", "mappedByName"],
              },
              description: "Array of attribute mappings",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: [
            "name",
            "type",
            "tlsEnabled",
            "host",
            "port",
            "domainName",
            "adminDomainName",
            "adminPassword",
            "identityName",
            "identityEmail",
            "identityPhone",
            "keyAttribute",
            "attributeMappings",
          ],
        },
      },
      {
        name: "update_directory_server_profile",
        description:
          "Update a directory server profile in RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description: "ID of the directory server profile to update",
            },
            name: {
              type: "string",
              description: "Name of the directory server profile",
            },
            type: {
              type: "string",
              description: 'Type of directory server (e.g., "LDAP")',
            },
            tlsEnabled: {
              type: "boolean",
              description: "Whether TLS is enabled",
            },
            host: {
              type: "string",
              description: "Directory server hostname",
            },
            port: {
              type: "number",
              description: "Directory server port number",
            },
            domainName: {
              type: "string",
              description: 'Domain name (e.g., "dc=example,dc=com")',
            },
            adminDomainName: {
              type: "string",
              description:
                'Admin domain name (e.g., "cn=admin,dc=example,dc=com")',
            },
            adminPassword: {
              type: "string",
              description: "Admin password",
            },
            identityName: {
              type: "string",
              description: "Identity name field",
            },
            identityEmail: {
              type: "string",
              description: "Identity email field",
            },
            identityPhone: {
              type: "string",
              description: "Identity phone field",
            },
            keyAttribute: {
              type: "string",
              description: 'Key attribute (e.g., "uid")',
            },
            searchFilter: {
              type: "string",
              description: "Optional search filter",
            },
            attributeMappings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Attribute name",
                  },
                  mappedByName: {
                    type: "string",
                    description: "Mapped attribute name",
                  },
                },
                required: ["name", "mappedByName"],
              },
              description: "Array of attribute mappings",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: [
            "profileId",
            "name",
            "type",
            "tlsEnabled",
            "host",
            "port",
            "domainName",
            "adminDomainName",
            "adminPassword",
            "identityName",
            "identityEmail",
            "identityPhone",
            "keyAttribute",
            "attributeMappings",
          ],
        },
      },
      {
        name: "delete_directory_server_profile",
        description:
          "Delete a directory server profile from RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description: "ID of the directory server profile to delete",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "query_radius_server_profiles",
        description:
          "Query RADIUS server profiles from RUCKUS One with pagination support",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_radius_server_profile",
        description:
          "Get detailed information for a specific RADIUS server profile",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description:
                "ID of the RADIUS server profile to get (use query_radius_server_profiles to get profile ID)",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "create_radius_server_profile",
        description:
          'Create a new RADIUS server profile in RUCKUS One with automatic status checking for async operations. REQUIRED: name (string) + type ("AUTHENTICATION" or "ACCOUNTING") + enableSecondaryServer (boolean) + primary (object with port, sharedSecret, hostname). Optional: secondary (object with port, sharedSecret, hostname). Use query_radius_server_profiles to verify the profile was created.',
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the RADIUS server profile",
            },
            type: {
              type: "string",
              description:
                'Type of RADIUS server profile: "AUTHENTICATION" or "ACCOUNTING"',
            },
            enableSecondaryServer: {
              type: "boolean",
              description: "Whether to enable secondary server",
            },
            primary: {
              type: "object",
              description: "Primary RADIUS server configuration",
              properties: {
                port: {
                  type: "number",
                  description: "Port number for the primary server",
                },
                sharedSecret: {
                  type: "string",
                  description: "Shared secret for the primary server",
                },
                hostname: {
                  type: "string",
                  description:
                    "Hostname for the primary server (provide either hostname or ip, not both unless testing API validation)",
                },
                ip: {
                  type: "string",
                  description:
                    "IP address for the primary server (provide either hostname or ip, not both unless testing API validation)",
                },
              },
              required: ["port", "sharedSecret"],
            },
            secondary: {
              type: "object",
              description: "Secondary RADIUS server configuration (optional)",
              properties: {
                port: {
                  type: "number",
                  description: "Port number for the secondary server",
                },
                sharedSecret: {
                  type: "string",
                  description: "Shared secret for the secondary server",
                },
                hostname: {
                  type: "string",
                  description:
                    "Hostname for the secondary server (provide either hostname or ip, not both unless testing API validation)",
                },
                ip: {
                  type: "string",
                  description:
                    "IP address for the secondary server (provide either hostname or ip, not both unless testing API validation)",
                },
              },
              required: ["port", "sharedSecret"],
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["name", "type", "enableSecondaryServer", "primary"],
        },
      },
      {
        name: "delete_radius_server_profile",
        description:
          "Delete a RADIUS server profile from RUCKUS One with automatic status checking for async operations. Permanently removes the profile and cannot be undone. REQUIRED: profileId (use query_radius_server_profiles to get profile ID).",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description:
                "ID of the RADIUS server profile to delete (use query_radius_server_profiles to get profile ID)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "update_radius_server_profile",
        description:
          "Update a RADIUS server profile in RUCKUS One with automatic status checking for async operations. Updates profile name, type, and server configurations. REQUIRED: profileId (use query_radius_server_profiles to get profile ID) + name + type + enableSecondaryServer + primary server config.",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description:
                "ID of the RADIUS server profile to update (use query_radius_server_profiles to get profile ID)",
            },
            name: {
              type: "string",
              description: "Name of the RADIUS server profile",
            },
            type: {
              type: "string",
              description:
                'Type of RADIUS server profile: "AUTHENTICATION" or "ACCOUNTING"',
            },
            enableSecondaryServer: {
              type: "boolean",
              description: "Whether to enable secondary server",
            },
            primary: {
              type: "object",
              description: "Primary RADIUS server configuration",
              properties: {
                port: {
                  type: "number",
                  description: "Port number for the primary server",
                },
                sharedSecret: {
                  type: "string",
                  description: "Shared secret for the primary server",
                },
                hostname: {
                  type: "string",
                  description: "Hostname or IP address for the primary server",
                },
                ip: {
                  type: "string",
                  description:
                    "IP address for the primary server (provide either hostname or ip, not both unless testing API validation)",
                },
              },
              required: ["port", "sharedSecret"],
            },
            secondary: {
              type: "object",
              description: "Secondary RADIUS server configuration (optional)",
              properties: {
                port: {
                  type: "number",
                  description: "Port number for the secondary server",
                },
                sharedSecret: {
                  type: "string",
                  description: "Shared secret for the secondary server",
                },
                hostname: {
                  type: "string",
                  description:
                    "Hostname or IP address for the secondary server",
                },
                ip: {
                  type: "string",
                  description:
                    "IP address for the secondary server (provide either hostname or ip, not both unless testing API validation)",
                },
              },
              required: ["port", "sharedSecret"],
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: [
            "profileId",
            "name",
            "type",
            "enableSecondaryServer",
            "primary",
          ],
        },
      },
      {
        name: "query_portal_service_profiles",
        description:
          "Query portal service profiles from RUCKUS One with filtering and pagination support",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description: "Optional filters to apply",
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to return (default: ["id", "name", "displayLangCode", "wifiNetworkIds"])',
            },
            searchString: {
              type: "string",
              description: "Search string to filter profiles",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description: 'Fields to search in (default: ["name"])',
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "get_portal_service_profile",
        description:
          "Get detailed information for a specific portal service profile",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description: "ID of the portal service profile to get",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "create_portal_service_profile",
        description:
          "Create a new portal service profile in RUCKUS One with automatic status checking for async operations. REQUIRED: name + content (free-form portal content configuration object with styling/text/display settings). FOR TERMS & CONDITIONS: pass exactly one of three modes — (1) LEGACY PLAIN TEXT: set content.termsCondition to the plain string; (2) RICH DOC: pass termsConditionConfig as a Tiptap doc JSON (use build_terms_condition_config to construct it correctly with paragraph / hardBreak / link-mark support); (3) LINK TO URL: pass termsConditionUrl as a single http/https URL. The server enforces mutual exclusion via GUEST-422xxx codes. Also pass termsConditionsDisplay=true to show the T&C checkbox in the captive portal (the componentDisplay.termsConditions toggle). Top-level params merge into content first; caller's content fields win on collision.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the portal service profile",
            },
            content: {
              type: "object",
              description:
                "Portal content configuration object with styling, text, and display settings. Free-form pass-through. Fields set here override the merged top-level params (termsConditionConfig, termsConditionUrl, termsConditionsDisplay).",
            },
            termsConditionConfig: {
              type: "object",
              description:
                "Tiptap rich-doc JSON for Terms & Conditions (RICH DOC mode). Shape: {type:'doc', content:[{type:'paragraph', content:[{type:'text', text:'...'}, ...]}, ...]}. Allowed node types: doc, paragraph, text, hardBreak. Allowed marks on text: link (with attrs.href, http/https only). Server validates depth ≤10, ≤700 paragraphs, ≤100 text nodes/paragraph, ≤60k chars total. Use build_terms_condition_config to construct this object. Mutually exclusive with termsCondition (legacy) and termsConditionUrl.",
            },
            termsConditionUrl: {
              type: "string",
              description:
                "Single http/https URL for the LINK TO URL Terms & Conditions mode. Must include a host. Mutually exclusive with termsCondition (legacy) and termsConditionConfig.",
            },
            termsConditionsDisplay: {
              type: "boolean",
              description:
                "Whether the T&C checkbox component renders in the captive portal (sets content.componentDisplay.termsConditions). Default behavior follows the backend (typically false when omitted on create).",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["name", "content"],
        },
      },
      {
        name: "update_portal_service_profile",
        description:
          "Update a portal service profile in RUCKUS One with automatic status checking for async operations. REQUIRED: profileId (use query_portal_service_profiles to get ID) + name + content (full portal content configuration; PUT replaces the whole content blob). FOR TERMS & CONDITIONS: pass exactly one of three modes — (1) LEGACY PLAIN TEXT: set content.termsCondition; (2) RICH DOC: pass termsConditionConfig as a Tiptap doc JSON (use build_terms_condition_config to construct); (3) LINK TO URL: pass termsConditionUrl. The server enforces mutual exclusion via GUEST-422xxx codes. Also pass termsConditionsDisplay to toggle the T&C checkbox visibility (content.componentDisplay.termsConditions). Top-level params merge into content first; caller's content fields win on collision.",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description:
                "ID of the portal service profile to update (use query_portal_service_profiles to find profile ID)",
            },
            name: {
              type: "string",
              description: "Name of the portal service profile",
            },
            content: {
              type: "object",
              description:
                "Portal content configuration object with styling, text, and display settings. Free-form pass-through. Fields set here override the merged top-level params (termsConditionConfig, termsConditionUrl, termsConditionsDisplay).",
            },
            termsConditionConfig: {
              type: "object",
              description:
                "Tiptap rich-doc JSON for Terms & Conditions (RICH DOC mode). Use build_terms_condition_config to construct. Mutually exclusive with termsCondition (legacy) and termsConditionUrl.",
            },
            termsConditionUrl: {
              type: "string",
              description:
                "Single http/https URL for the LINK TO URL Terms & Conditions mode. Mutually exclusive with termsCondition (legacy) and termsConditionConfig.",
            },
            termsConditionsDisplay: {
              type: "boolean",
              description:
                "Whether the T&C checkbox component renders in the captive portal (sets content.componentDisplay.termsConditions).",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["profileId", "name", "content"],
        },
      },
      {
        name: "delete_portal_service_profile",
        description:
          "Delete a portal service profile from RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            profileId: {
              type: "string",
              description: "ID of the portal service profile to delete",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["profileId"],
        },
      },
      {
        name: "get_ruckus_user_groups",
        description:
          "Get user group assignments showing which roles are assigned to users with venue and customer scope information",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_ruckus_roles",
        description:
          "Get all roles from RUCKUS One including both system roles (ADMIN, READ_ONLY, etc.) and custom roles with their feature permissions",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "update_privilege_group",
        description:
          'Update a privilege group in RUCKUS One using simple parameters. Accepts group and venue names (auto-resolves to IDs) or IDs directly. Examples: {"privilegeGroupName": "example-group-1", "name": "example-group-1", "roleName": "example-role-1", "delegation": false, "allVenues": true} or {"privilegeGroupName": "example-group-1", "name": "example-group-1", "roleName": "example-role-1", "delegation": false, "allVenues": false, "venueNames": ["Example Venue 1", "Example Venue 2"]}',
        inputSchema: {
          type: "object",
          properties: {
            privilegeGroupName: {
              type: "string",
              description:
                "Name or ID of the privilege group to update (use query_privilege_groups to see available groups)",
            },
            name: {
              type: "string",
              description: "Display name of the privilege group",
            },
            roleName: {
              type: "string",
              description:
                "Name of the role to assign to the group (use get_ruckus_roles to find available roles)",
            },
            delegation: {
              type: "boolean",
              description: "Whether delegation is enabled for this group",
            },
            allVenues: {
              type: "boolean",
              description:
                "Grant access to all venues (true) or specific venues only (false). Default: true",
            },
            venueNames: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of venue names or IDs (only used when allVenues is false). Use get_ruckus_venues to see available venues",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of polling retries (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["privilegeGroupName", "name", "roleName", "delegation"],
        },
      },
      {
        name: "update_custom_role",
        description:
          "Update a custom role in RUCKUS One with specific features and permissions",
        inputSchema: {
          type: "object",
          properties: {
            roleId: {
              type: "string",
              description: "ID of the custom role to update",
            },
            name: {
              type: "string",
              description: "Name of the custom role",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of feature permissions (use query_role_features to see available options)",
            },
            preDefinedRole: {
              type: "string",
              description: "Base predefined role to inherit from (optional)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of polling retries (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["roleId", "name", "features"],
        },
      },
      {
        name: "query_role_features",
        description:
          'Search and filter role features for custom roles. Returns feature names to use in update_custom_role tool. Available categories: wifi, Wired, Gateways, AI, Admin. Search examples: "dhcp" for DHCP permissions, "access_points" for AP management, "venue" for venue features. Permission suffixes: -r (read), -c (create), -u (update), -d (delete)',
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Filter by category: wifi, Wired, Gateways, AI, or Admin",
            },
            searchString: {
              type: "string",
              description:
                'Search in feature names and descriptions (e.g., "dhcp", "access_points", "venue")',
            },
            page: {
              type: "number",
              description: "Page number for pagination (default: 1)",
            },
            pageSize: {
              type: "number",
              description:
                "Number of results per page (default: 100, max: 500)",
            },
            showScopes: {
              type: "boolean",
              description: "Whether to show scopes (default: false)",
            },
          },
          required: [],
        },
      },
      {
        name: "create_custom_role",
        description:
          'Create a new custom role in RUCKUS One with automatic parent permission injection. When you specify advanced permissions (e.g., wifi.venue-c), the tool automatically adds required parent permissions (e.g., wifi-r) for proper functionality. Use preDefinedRole="READ_ONLY" to include all base read permissions.',
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the custom role to create",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of permission features. Use query_role_features to find valid feature names. Parent permissions are automatically added when needed.",
            },
            preDefinedRole: {
              type: "string",
              description:
                'Optional base role template (e.g., "READ_ONLY", "ADMIN"). Defaults to "READ_ONLY" for base read permissions.',
            },
          },
          required: ["name", "features"],
        },
      },
      {
        name: "delete_custom_role",
        description:
          "Delete a custom role from RUCKUS One with automatic status checking for async operations",
        inputSchema: {
          type: "object",
          properties: {
            roleId: {
              type: "string",
              description: "ID of the custom role to delete",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["roleId"],
        },
      },
      {
        name: "query_wifi_networks",
        description:
          "Query WiFi networks from RUCKUS One with filtering and pagination support",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description: "Optional filters to apply",
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to return (default: ["name", "description", "nwSubType", "venueApGroups", "apSerialNumbers", "apCount", "clientCount", "vlan", "cog", "ssid", "vlanPool", "captiveType", "id", "securityProtocol", "dsaeOnboardNetwork", "isOweMaster", "owePairNetworkId", "tunnelWlanEnable", "isEnforced"])',
            },
            searchString: {
              type: "string",
              description: "Search string to filter WiFi networks",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description: 'Fields to search in (default: ["name"])',
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "get_wifi_network",
        description:
          "Get detailed information for a specific WiFi network. Returns the full configuration including nested objects like guestPortal (with temporaryConnectionEnabled / temporaryConnection for Self Sign-In networks), radiusOptions, etc. This tool is a pass-through; all fields the R1 API returns are preserved.",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description: "ID of the WiFi network to get",
            },
          },
          required: ["networkId"],
        },
      },
      {
        name: "create_wifi_network",
        description:
          "Create a new WiFi network (WLAN/SSID) in RUCKUS One without activating at any venue. The network is created globally and can later be activated at specific venues using activate_wifi_network_at_venues. FOR PSK: Requires passphrase + wlanSecurity=WPA2Personal. CAPTIVE PORTAL TYPES — pick the specific portal-type value, do NOT use a generic 'guest' value (no longer accepted). FOR GUEST PASS: type=guestPass + portalServiceProfileId (use query_portal_service_profiles to get ID) + wlanSecurity=None. End users sign in with a pre-issued password. FOR CLICK-THROUGH: type=clickThrough + portalServiceProfileId + wlanSecurity=None. End users see only a T&C checkbox + Connect button — no credential entry. FOR SELF SIGN-IN: type=selfSignIn + portalServiceProfileId + wlanSecurity=None. Pick at least one OTP channel via enableSmsLogin, enableEmailLogin, and/or enableWhatsappLogin (defaults to Email-only when none specified). FOR SELF SIGN-IN WITH EMAIL: also provide allowedEmailDomains. FOR SELF SIGN-IN WITH SMS: optionally provide smsPasswordDuration={duration,unit} where unit is MINUTE/HOUR/DAY (default {12, HOUR}). FOR SELF SIGN-IN WITH WHATSAPP: set enableWhatsappLogin=true. Optional temporaryConnectionEnabled + temporaryConnection to grant pre-OTP limited internet access (Self Sign-In only). FOR HOST APPROVAL: type=hostApproval + portalServiceProfileId + wlanSecurity=None. Companion fields (host contacts: domain or specific emails) not yet exposed as top-level params — pass them inside the guestPortal object until a dedicated parameter is added. FOR CLOUDPATH: type=cloudpath + wlanSecurity=None. Requires a Cloudpath enrollment URL and RADIUS authentication server; companion fields not yet exposed — pass via guestPortal until added. FOR WISPR (3rd party captive portal): type=wispr + wlanSecurity=None. Requires a 3rd-party AAA server reference; companion fields not yet exposed. FOR DIRECTORY (Active Directory / LDAP): type=directory + wlanSecurity=None. Requires a directory server profile (use create_directory_server_profile); companion fields not yet exposed. FOR SAML IDP: type=saml + wlanSecurity=None. Requires SAML IdP metadata; companion fields not yet exposed. FOR WORKFLOW: type=workflow + wlanSecurity=None. Companion fields not yet exposed. FOR ENTERPRISE 802.1X: Requires radiusServiceProfileId (use query_radius_server_profiles to get ID of AUTHENTICATION type profile) + wlanSecurity=WPA2Enterprise. Optional: accountingRadiusServiceProfileId, enableAuthProxy (required for FQDN-based RADIUS), enableAccountingProxy, radiusOptions (for NAS ID configuration - nasIdType can be AP_GROUP_NAME, BSSID, VENUE_NAME, AP_MAC, or USER with userDefinedNasId). FOR OWE TRANSITION: Requires type=open + wlanSecurity=Open + oweEnabled=true + oweTransitionEnabled=true. Creates a dual-network pair: OWE-encrypted primary + Open companion with '-owe-tr' suffix. FOR DSAE (DPSK WPA2/WPA3-Mixed): Requires type=dpsk + wlanSecurity=WPA23Mixed + dpskServiceId (use query_dpsk_services to get ID). Creates a dual-network pair: WPA2/WPA3-Mixed primary + WPA2 onboard companion with '-dpsk3-wpa2' suffix.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the WiFi network (internal identifier)",
            },
            ssid: {
              type: "string",
              description: "SSID (network name visible to clients)",
            },
            type: {
              type: "string",
              description:
                "Network type. Non-captive-portal: psk (WPA2 Personal), enterprise (802.1x with RADIUS), open (no security), dpsk (Dynamic PSK). Captive-portal sub-types (all use wlanSecurity=None and a portalServiceProfileId; previously bundled under 'guest' which is no longer accepted): guestPass (pre-issued password), clickThrough (T&C only, no credential), selfSignIn (Email/SMS/WhatsApp OTP), hostApproval (host approves request), cloudpath (Cloudpath enrollment), wispr (3rd-party captive portal), directory (AD/LDAP), saml (SAML IdP), workflow (Workflow captive portal).",
              enum: [
                "psk",
                "enterprise",
                "open",
                "dpsk",
                "guestPass",
                "clickThrough",
                "selfSignIn",
                "hostApproval",
                "cloudpath",
                "wispr",
                "directory",
                "saml",
                "workflow",
              ],
            },
            passphrase: {
              type: "string",
              description:
                "Network passphrase/password (REQUIRED for type=psk, minimum 8 characters)",
            },
            wlanSecurity: {
              type: "string",
              description:
                "WLAN security type (REQUIRED). Use WPA2Personal for PSK networks, WPA2Enterprise for enterprise/802.1x networks, None for guest pass and selfSignIn networks",
              enum: [
                "WPA2Personal",
                "WPA3Personal",
                "WPA2Enterprise",
                "WPA3Enterprise",
                "WPA23Mixed",
                "Open",
                "None",
              ],
            },
            guestPortal: {
              type: "object",
              description:
                "Captive-portal configuration object (optional for any captive-portal sub-type; uses sub-type-appropriate defaults if not provided). Escape hatch for companion fields that don't yet have dedicated top-level params — e.g. hostContacts for type=hostApproval, Cloudpath URL for type=cloudpath. Caller-provided fields here win over tool-generated defaults.",
            },
            portalServiceProfileId: {
              type: "string",
              description:
                "Portal service profile ID (REQUIRED for every captive-portal sub-type: guestPass, clickThrough, selfSignIn, hostApproval, cloudpath, wispr, directory, saml, workflow). Use query_portal_service_profiles to get available IDs. Portal service profiles are portal-type-agnostic — the same profile can back any captive-portal sub-type; the WLAN's type field is what drives the captive-portal rendering.",
            },
            radiusServiceProfileId: {
              type: "string",
              description:
                "RADIUS authentication service profile ID (REQUIRED for type=enterprise, use query_radius_server_profiles to get ID of profile with type=AUTHENTICATION)",
            },
            accountingRadiusServiceProfileId: {
              type: "string",
              description:
                "RADIUS accounting service profile ID (optional for type=enterprise, use query_radius_server_profiles to get ID of profile with type=ACCOUNTING)",
            },
            enableAuthProxy: {
              type: "boolean",
              description:
                "Enable authentication proxy (required for FQDN-based RADIUS profiles, default: false)",
            },
            enableAccountingProxy: {
              type: "boolean",
              description:
                "Enable accounting proxy (default: false)",
            },
            allowedEmailDomains: {
              type: "array",
              items: { type: "string" },
              description:
                'Allowed email domains for type=selfSignIn with Email enabled (e.g., ["company.com", "partner.com"]). Required when enableEmailLogin=true. Users can only sign in with emails from these domains.',
            },
            sessionDurationDays: {
              type: "number",
              description:
                "Session duration in days for type=selfSignIn Email path (default: 12). Ignored when SMS is enabled (SMS OTP uses smsPasswordDuration instead).",
            },
            enableSmsLogin: {
              type: "boolean",
              description:
                "Enable SMS-OTP sign-in for type=selfSignIn (default: false). At least one of enableSmsLogin/enableEmailLogin/enableWhatsappLogin must be true. When omitted entirely, the tool defaults to Email-only for backwards compatibility.",
            },
            enableEmailLogin: {
              type: "boolean",
              description:
                "Enable Email-OTP sign-in for type=selfSignIn (default: true when no channel flag is specified; otherwise false unless set explicitly). When true, provide allowedEmailDomains.",
            },
            enableWhatsappLogin: {
              type: "boolean",
              description:
                "Enable WhatsApp-OTP sign-in for type=selfSignIn (default: false). Requires the tenant to be provisioned for WhatsApp business messaging; the backend rejects if not.",
            },
            smsPasswordDuration: {
              type: "object",
              description:
                "How long an SMS OTP stays valid, for type=selfSignIn with enableSmsLogin=true (default: {duration:12, unit:HOUR}).",
              properties: {
                duration: {
                  type: "integer",
                  description: "Positive integer duration value.",
                  minimum: 1,
                },
                unit: {
                  type: "string",
                  enum: ["MINUTE", "HOUR", "DAY"],
                  description: "Time unit for duration.",
                },
              },
              required: ["duration", "unit"],
            },
            maxDevices: {
              type: "number",
              description:
                "Maximum number of devices per user for guest/selfSignIn networks (default: 1)",
            },
            vlanId: {
              type: "number",
              description: "VLAN ID for client traffic (default: 1)",
            },
            managementFrameProtection: {
              type: "string",
              description:
                "Management Frame Protection (802.11w) setting (default: Disabled)",
              enum: ["Disabled", "Capable", "Required"],
            },
            maxClientsOnWlanPerRadio: {
              type: "number",
              description: "Maximum clients per radio (default: 100)",
            },
            enableBandBalancing: {
              type: "boolean",
              description: "Enable band balancing (default: true)",
            },
            clientIsolation: {
              type: "boolean",
              description: "Enable client isolation (default: false)",
            },
            hideSsid: {
              type: "boolean",
              description: "Hide SSID from broadcast (default: false)",
            },
            enableFastRoaming: {
              type: "boolean",
              description: "Enable 802.11r fast roaming (default: false)",
            },
            mobilityDomainId: {
              type: "number",
              description: "Mobility domain ID for fast roaming (default: 1)",
            },
            wifi6Enabled: {
              type: "boolean",
              description: "Enable WiFi 6 (802.11ax) support (default: true)",
            },
            wifi7Enabled: {
              type: "boolean",
              description: "Enable WiFi 7 (802.11be) support (default: true)",
            },
            oweEnabled: {
              type: "boolean",
              description:
                "Enable OWE (Opportunistic Wireless Encryption) on Open networks. Requires type=open (default: false)",
            },
            oweTransitionEnabled: {
              type: "boolean",
              description:
                "Enable OWE Transition mode, which creates a dual-network pair (OWE primary + Open companion with '-owe-tr' suffix). Requires oweEnabled=true and type=open (default: false)",
            },
            dpskServiceId: {
              type: "string",
              description:
                "DPSK service ID (REQUIRED for type=dpsk/DSAE networks, use query_dpsk_services to get ID)",
            },
            temporaryConnectionEnabled: {
              type: "boolean",
              description:
                "Enable temporary internet access for Self Sign-In guests before OTP verification (only for type=selfSignIn, default: false). When true, temporaryConnection must also be provided.",
            },
            temporaryConnection: {
              type: "object",
              description:
                "Temporary connection settings for Self Sign-In guests (only for type=selfSignIn; required when temporaryConnectionEnabled=true). Lets visitors receive limited internet access before OTP verification.",
              properties: {
                duration: {
                  type: "integer",
                  description:
                    "Session duration in minutes. Valid range: 1-15 (default: 5).",
                  minimum: 1,
                  maximum: 15,
                },
                maxDownloadRate: {
                  type: "integer",
                  description:
                    "Max download rate in kbps. Valid: 1000, 2000, 5000, or -1 (Unlimited). Default: 1000.",
                  enum: [1000, 2000, 5000, -1],
                },
                maxUploadRate: {
                  type: "integer",
                  description:
                    "Max upload rate in kbps. Valid: 256, 512, 1000, or -1 (Unlimited). Default: 256.",
                  enum: [256, 512, 1000, -1],
                },
              },
            },
            radiusOptions: {
              type: "object",
              description:
                "RADIUS options for Enterprise 802.1x networks. Controls NAS ID configuration for RADIUS authentication.",
              properties: {
                nasIdType: {
                  type: "string",
                  enum: [
                    "AP_GROUP_NAME",
                    "BSSID",
                    "VENUE_NAME",
                    "AP_MAC",
                    "USER",
                  ],
                  description:
                    "NAS ID type sent to RADIUS server (default: AP_GROUP_NAME)",
                },
                userDefinedNasId: {
                  type: "string",
                  description:
                    "Custom NAS ID value. REQUIRED when nasIdType is USER",
                },
                nasRequestTimeoutSec: {
                  type: "number",
                  description:
                    "RADIUS request timeout in seconds (default: 3)",
                },
                nasMaxRetry: {
                  type: "number",
                  description: "Maximum RADIUS request retries (default: 2)",
                },
                nasReconnectPrimaryMin: {
                  type: "number",
                  description:
                    "Minutes before reconnecting to primary RADIUS server (default: 5)",
                },
                calledStationIdType: {
                  type: "string",
                  enum: ["BSSID"],
                  description: "Called Station ID type (default: BSSID)",
                },
              },
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["name", "ssid", "type", "wlanSecurity"],
        },
      },
      {
        name: "activate_wifi_network_at_venues",
        description:
          "Activate an existing WiFi network at one or more venues. This is a batch operation that activates the network at specified venues in a single call. The network must already be created using create_wifi_network. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueConfigs array (use get_ruckus_venues to get venue IDs). FOR GUEST PASS NETWORKS: Must provide portalServiceProfileId (use query_portal_service_profiles to get ID). FOR PSK NETWORKS: Do not provide portalServiceProfileId. Can activate at a single venue or multiple venues.",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network to activate (use query_wifi_networks to find network ID)",
            },
            venueConfigs: {
              type: "array",
              description:
                "Array of venue configurations where the network should be activated. Each venue config specifies venue ID, AP groups, radios, and schedule. Can contain one venue or multiple venues.",
              items: {
                type: "object",
                properties: {
                  venueId: {
                    type: "string",
                    description:
                      "ID of the venue (use get_ruckus_venues to get venue IDs)",
                  },
                  isAllApGroups: {
                    type: "boolean",
                    description:
                      "Broadcast on all AP groups in the venue (true) or specific groups only (false)",
                  },
                  apGroups: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Array of AP group IDs (use get_ruckus_ap_groups to get AP group IDs). Required only if isAllApGroups is false",
                  },
                  allApGroupsRadio: {
                    type: "string",
                    description:
                      'Which radios to use: Both (2.4GHz + 5GHz), 2.4GHz, 5GHz, or 6GHz. Use "Both" for most cases',
                    enum: ["Both", "2.4GHz", "5GHz", "6GHz"],
                  },
                  allApGroupsRadioTypes: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      'Radio types to enable. Use ["2.4-GHz", "5-GHz"] for dual-band or ["2.4-GHz", "5-GHz", "6-GHz"] for tri-band',
                  },
                  scheduler: {
                    type: "object",
                    description:
                      'Network schedule configuration. Recommended: call build_wifi_scheduler_config first and pass its returned JSON here verbatim — it produces the correct shape for every supported mode (ALWAYS_ON, LEGACY_CUSTOM bitmasks, BASIC, ADVANCED). The R1 API accepts four valid shapes under this field: (1) {type: "ALWAYS_ON"}. (2) Legacy CUSTOM: {type: "CUSTOM", mon..sun: 96-char 0/1 bitmasks}. (3) BASIC: {type: "CUSTOM", customType: "BASIC", repeatRule, startDate, optional endDate/allDay/fromTime/toTime/weeklyRepeatDays/monthlyRepeatRule}. (4) ADVANCED: {type: "CUSTOM", customType: "ADVANCED", repeatRule, startDate, optional endDate, mon..sun bitmasks}. Only "type" is required by this schema; additional fields pass through to R1.',
                    properties: {
                      type: {
                        type: "string",
                        description:
                          "Schedule type: ALWAYS_ON (24/7) or CUSTOM (any custom schedule — legacy bitmask, BASIC, or ADVANCED). Use build_wifi_scheduler_config to form the full object.",
                        enum: ["ALWAYS_ON", "CUSTOM"],
                      },
                    },
                    required: ["type"],
                  },
                },
                required: [
                  "venueId",
                  "isAllApGroups",
                  "allApGroupsRadio",
                  "allApGroupsRadioTypes",
                  "scheduler",
                ],
              },
            },
            portalServiceProfileId: {
              type: "string",
              description:
                "Portal service profile ID (REQUIRED for guest pass networks - use query_portal_service_profiles to get ID, do not provide for PSK networks)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["networkId", "venueConfigs"],
        },
      },
      {
        name: "update_wifi_network",
        description:
          "Update an existing WiFi network by passing only the fields you want to change. REQUIRED: networkId (use query_wifi_networks to get network ID) + networkConfig (a PARTIAL config — unspecified fields are preserved via retrieve-then-merge, JSON Merge Patch semantics; arrays are replaced wholesale, a null value deletes a key). IN-CONFIG ATTRIBUTES: any WLAN config field, e.g. `guestPortal.walledGardens` (string[] of permitted destinations), `wlan.vlanId`, `guestPortal.temporaryConnectionEnabled`/`guestPortal.temporaryConnection` (Self Sign-In). SUB-RESOURCE ASSOCIATIONS (include these keys in networkConfig and they are routed to their own endpoints, NOT merged into the config body): `portalServiceProfileId` (use query_portal_service_profiles), `radiusServiceProfileId` + `accountingRadiusServiceProfileId` (use query_radius_server_profiles) to switch the network's RADIUS profiles, and `enableAuthProxy`/`enableAccountingProxy` for RADIUS proxy settings. FOR FQDN/HOSTNAME RADIUS PROFILES: set enableAuthProxy=true (proxy settings are applied before the profile association, per WIFI-20049). At least one change is required.",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network to update (use query_wifi_networks to get network ID)",
            },
            networkConfig: {
              type: "object",
              description:
                "Partial network configuration — only the fields to change. Merged onto the current config (retrieve-then-merge). May also include sub-resource association keys (portalServiceProfileId, radiusServiceProfileId, accountingRadiusServiceProfileId, enableAuthProxy, enableAccountingProxy) which are routed to their own endpoints rather than merged into the config body.",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["networkId", "networkConfig"],
        },
      },
      {
        name: "deactivate_wifi_network_at_venues",
        description:
          "Deactivate a WiFi network from one or more venues. This is a batch operation that removes the network from specified venues in a single call. The network remains globally available but is no longer broadcast at these venues. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueIds array (use get_ruckus_venues to get venue IDs). Can deactivate from a single venue or multiple venues.",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network to deactivate (use query_wifi_networks to find network ID)",
            },
            venueIds: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of venue IDs where the network should be deactivated (use get_ruckus_venues to get venue IDs). Can contain one venue or multiple venues.",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["networkId", "venueIds"],
        },
      },
      {
        name: "delete_wifi_network",
        description:
          "Permanently delete a WiFi network from RUCKUS One. This removes the network globally and cannot be undone. PREREQUISITE: Network must be deactivated from all venues first (use deactivate_wifi_network_at_venues). REQUIRED: networkId (use query_wifi_networks to get network ID).",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network to delete (use query_wifi_networks to find network ID)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["networkId"],
        },
      },
      {
        name: "query_guest_passes",
        description:
          'Query guest passes from RUCKUS One with filtering and pagination support. Use filters like {"includeExpired": ["true"]} to include expired passes. Search by name, mobilePhoneNumber, or emailAddress.',
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description:
                'Optional filters to apply (e.g., {"includeExpired": ["true"]})',
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to return (default: ["creationDate", "name", "passDurationHours", "id", "wifiNetworkId", "maxNumberOfClients", "notes", "clients", "guestStatus", "emailAddress", "mobilePhoneNumber", "guestType", "ssid", "socialLogin", "expiryDate", "cog", "hostApprovalEmail", "devicesMac"])',
            },
            searchString: {
              type: "string",
              description: "Search string to filter guest passes",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description:
                'Fields to search in (default: ["name", "mobilePhoneNumber", "emailAddress"])',
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "create_guest_pass",
        description:
          'Create a guest pass credential for a WiFi network in RUCKUS One. This generates a temporary access credential with configurable expiration and device limits. Returns the generated password in the response. REQUIRED: networkId (use query_wifi_networks to get network ID) + name + expiration (duration, unit, activationType) + maxDevices + deliveryMethods. Use deliveryMethods: ["PRINT"] for manual distribution.',
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network to create guest pass for (use query_wifi_networks to find network ID)",
            },
            name: {
              type: "string",
              description: "Name/identifier for the guest pass",
            },
            expiration: {
              type: "object",
              description: "Expiration configuration for the guest pass",
              properties: {
                duration: {
                  type: "number",
                  description: "Duration value (e.g., 7 for 7 days)",
                },
                unit: {
                  type: "string",
                  description: "Time unit for duration",
                  enum: ["Hour", "Day", "Week", "Month"],
                },
                activationType: {
                  type: "string",
                  description:
                    "When expiration starts: Creation (from creation time) or FirstUse (from first connection)",
                  enum: ["Creation", "FirstUse"],
                },
              },
              required: ["duration", "unit", "activationType"],
            },
            maxDevices: {
              type: "number",
              description:
                "Maximum number of devices that can use this guest pass simultaneously",
            },
            deliveryMethods: {
              type: "array",
              items: {
                type: "string",
                enum: ["PRINT", "EMAIL", "SMS"],
              },
              description:
                'How the guest pass will be delivered. Use ["PRINT"] for manual distribution',
            },
            mobilePhoneNumber: {
              type: "string",
              description:
                "Mobile phone number for SMS delivery (required if SMS in deliveryMethods)",
            },
            email: {
              type: "string",
              description:
                "Email address for email delivery (required if EMAIL in deliveryMethods)",
            },
            notes: {
              type: "string",
              description: "Optional notes about this guest pass",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: [
            "networkId",
            "name",
            "expiration",
            "maxDevices",
            "deliveryMethods",
          ],
        },
      },
      {
        name: "delete_guest_pass",
        description:
          "Delete a guest pass from a WiFi network in RUCKUS One with automatic status checking for async operations. This permanently removes the guest pass credential and cannot be undone. REQUIRED: networkId (use query_wifi_networks to get network ID) + guestPassId (use query_guest_passes to get guest pass ID).",
        inputSchema: {
          type: "object",
          properties: {
            networkId: {
              type: "string",
              description:
                "ID of the WiFi network containing the guest pass (use query_wifi_networks to find network ID)",
            },
            guestPassId: {
              type: "string",
              description:
                "ID of the guest pass to delete (use query_guest_passes to find guest pass ID)",
            },
            maxRetries: {
              type: "number",
              description: "Maximum number of retry attempts (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["networkId", "guestPassId"],
        },
      },
      {
        name: "query_clients",
        description:
          'Query wireless clients connected to RUCKUS One managed APs with filtering and pagination support. Returns client details including device info, connection status, AP info, and traffic statistics. Use filters like {"venueId": ["venue-id"]} to filter by venue, or {"networkInformation.ssid": ["ssid-name"]} to filter by SSID.',
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              description:
                'Optional filters to apply (e.g., {"venueId": ["venue-id"]} or {"networkInformation.ssid": ["ssid-name"]})',
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description:
                "Fields to return (default: comprehensive set including modelName, deviceType, osType, username, hostname, macAddress, ipAddress, ipv6Address, connectedTime, venueInformation, apInformation, networkInformation, trafficStatus, etc.)",
            },
            searchString: {
              type: "string",
              description: "Search string to filter clients",
            },
            searchTargetFields: {
              type: "array",
              items: { type: "string" },
              description:
                "Fields to search in (default: macAddress, mldMacAddress, ipAddress, username, hostname, osType, networkInformation.ssid, networkInformation.vni, networkInformation.vlan)",
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "get_ap_password",
        description:
          "Get AP admin password from RUCKUS One. The password rotates daily. REQUIRED: venueId (use get_ruckus_venues to get venue ID) + apSerial (use get_ruckus_aps to get AP serial number).",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue where the AP is located (use get_ruckus_venues to get venue ID)",
            },
            apSerial: {
              type: "string",
              description:
                "Serial number of the AP (use get_ruckus_aps to get AP serial number)",
            },
          },
          required: ["venueId", "apSerial"],
        },
      },
      {
        name: "create_identity_group",
        description:
          "Create a new identity group in RUCKUS One. Identity groups are required for creating DPSK services. REQUIRED: name (unique identity group name). Optional: autoCleanupEnabled (default: true).",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the identity group (must be unique)",
            },
            autoCleanupEnabled: {
              type: "boolean",
              description:
                "Enable automatic identity cleanup (default: true)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description:
                "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "query_identity_groups",
        description:
          "Query identity groups from RUCKUS One with keyword search and pagination support. Use this to find identity group IDs needed for creating DPSK services.",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description:
                "Keyword to search identity groups by name (optional)",
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10000)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description:
                'Sort order - ASC or DESC (default: "ASC")',
            },
          },
          required: [],
        },
      },
      {
        name: "delete_identity_group",
        description:
          "Permanently delete an identity group from RUCKUS One. This cannot be undone. PREREQUISITE: Identity group must not be in use by any DPSK service. REQUIRED: identityGroupId (use query_identity_groups to get ID).",
        inputSchema: {
          type: "object",
          properties: {
            identityGroupId: {
              type: "string",
              description:
                "ID of the identity group to delete (use query_identity_groups to find ID)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description:
                "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["identityGroupId"],
        },
      },
      {
        name: "create_dpsk_service",
        description:
          "Create a new DPSK service under an identity group in RUCKUS One. DPSK services are required for creating DPSK/DSAE WiFi networks. REQUIRED: identityGroupId (use query_identity_groups to get ID) + name (unique service name). Optional: passphraseFormat (default: MOST_SECURED), passphraseLength (default: 18).",
        inputSchema: {
          type: "object",
          properties: {
            identityGroupId: {
              type: "string",
              description:
                "ID of the identity group to create the DPSK service under (use query_identity_groups to find ID)",
            },
            name: {
              type: "string",
              description: "Name of the DPSK service (must be unique)",
            },
            passphraseFormat: {
              type: "string",
              description:
                "Passphrase format: MOST_SECURED (letters, numbers, symbols), SECURED (letters and numbers), or NUMBERS_ONLY (default: MOST_SECURED)",
              enum: ["MOST_SECURED", "SECURED", "NUMBERS_ONLY"],
            },
            passphraseLength: {
              type: "number",
              description: "Passphrase length in characters (default: 18)",
            },
            autoNotificationsEnabled: {
              type: "boolean",
              description:
                "Enable auto-send DPSK info notifications (default: false)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description:
                "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["identityGroupId", "name"],
        },
      },
      {
        name: "query_dpsk_services",
        description:
          "Query DPSK services from RUCKUS One with pagination support. Use this to find DPSK service IDs needed for creating DPSK/DSAE WiFi networks.",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "Page number, zero-based (default: 0)",
            },
            pageSize: {
              type: "number",
              description: "Number of results per page (default: 10000)",
            },
            sortField: {
              type: "string",
              description: 'Field to sort by (default: "name")',
            },
            sortOrder: {
              type: "string",
              description: 'Sort order - asc or desc (default: "asc")',
            },
          },
          required: [],
        },
      },
      {
        name: "delete_dpsk_service",
        description:
          "Permanently delete a DPSK service from RUCKUS One. This cannot be undone. PREREQUISITE: DPSK service must not be in use by any WiFi network. REQUIRED: dpskServiceId (use query_dpsk_services to get ID).",
        inputSchema: {
          type: "object",
          properties: {
            dpskServiceId: {
              type: "string",
              description:
                "ID of the DPSK service to delete (use query_dpsk_services to find ID)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description:
                "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["dpskServiceId"],
        },
      },
      {
        name: "get_venue_wifi_network_settings",
        description:
          "Get venue-level WiFi network settings including scheduler configuration. REQUIRED: venueId (use get_ruckus_venues to get venue ID) + wifiNetworkId (use query_wifi_networks to get network ID). The network must be activated at the venue.",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue (use get_ruckus_venues to get venue ID)",
            },
            wifiNetworkId: {
              type: "string",
              description:
                "ID of the WiFi network (use query_wifi_networks to get network ID)",
            },
          },
          required: ["venueId", "wifiNetworkId"],
        },
      },
      {
        name: "update_venue_wifi_network_settings",
        description:
          "Update venue-level WiFi network settings including scheduler configuration. The settings object is passed directly as the request body. REQUIRED: venueId (use get_ruckus_venues to get venue ID) + wifiNetworkId (use query_wifi_networks to get network ID) + settings (JSON object). FOR ALWAYS_ON: Use scheduler {type: 'ALWAYS_ON'}. FOR CUSTOM SCHEDULE: Use scheduler {type: 'CUSTOM', mon: '96-char string', tue: '...', ...} where each char is 1 (on) or 0 (off) per 15-min slot. FOR BASIC SCHEDULE: Use scheduler {type: 'CUSTOM', customType: 'BASIC', repeatRule: 'NO_REPEAT', startDate: 'YYYY-MM-DD', allDay: true}.",
        inputSchema: {
          type: "object",
          properties: {
            venueId: {
              type: "string",
              description:
                "ID of the venue (use get_ruckus_venues to get venue ID)",
            },
            wifiNetworkId: {
              type: "string",
              description:
                "ID of the WiFi network (use query_wifi_networks to get network ID)",
            },
            settings: {
              type: "object",
              description:
                "Settings object passed directly as the request body. Must include scheduler configuration and may include other venue-level network settings (apGroups, radios, etc.)",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of retry attempts for async polling (default: 20)",
            },
            pollIntervalMs: {
              type: "number",
              description:
                "Polling interval in milliseconds (default: 5000)",
            },
          },
          required: ["venueId", "wifiNetworkId", "settings"],
        },
      },
      {
        name: "get_sms_provider",
        description:
          "Get the tenant's SMS Brand and Provider Setup — the singleton configuration used by Self Sign-In networks to deliver SMS / WhatsApp OTPs. Returns a combined { brand, twilio } object from GET /notifications/sms (brandName, provider, threshold, ruckusOneUsed) and GET /notifications/sms/providers/twilios (accountSid, authToken, fromNumber, enableWhatsapp, authTemplateSid). All Twilio fields are null when no provider is configured.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "create_sms_provider",
        description:
          "Configure the tenant's Twilio SMS provider for Self Sign-In OTP delivery. This is an UPSERT — calling it on a tenant that already has a provider overwrites the existing config. The tool issues two async POSTs (to /notifications/sms for the brand record and /notifications/sms/providers/twilios for the credentials) and polls both until SUCCESS. OVERWRITE BEHAVIOR: any brand fields you omit (brandName, threshold) are replaced with this tool's defaults ('' and 80 respectively) — read the current state with get_sms_provider first and re-pass the values you want to preserve. PREREQUISITE: Twilio account exists with (a) an Account SID and Auth Token and (b) either a Messaging Service or a phone number provisioned on that account. REQUIRED: accountSid (Twilio AC<32hex>) + authToken (Twilio 32hex) + fromNumber. FOR MESSAGING SERVICE MODE: fromNumber is the full '<Service Name> [MG<32hex>]' string as shown in the RUCKUS One UI dropdown. FOR PHONE NUMBER MODE: fromNumber is a '+E.164' phone number (e.g. '+19388887785'). FOR WHATSAPP: set enableWhatsapp=true and supply authTemplateSid (the HX<32hex> SID of an approved WhatsApp authentication template — Twilio Console → Content Template Builder). Once configured, Self Sign-In networks created via create_wifi_network with enableSmsLogin or enableWhatsappLogin=true will deliver OTPs through this provider.",
        inputSchema: {
          type: "object",
          properties: {
            accountSid: {
              type: "string",
              description:
                "Twilio Account SID (AC followed by 32 hex chars). Obtain from the Twilio Console account dashboard.",
            },
            authToken: {
              type: "string",
              description:
                "Twilio Auth Token (32 hex chars). Obtain from the Twilio Console account dashboard. This is a secret — handle accordingly.",
            },
            fromNumber: {
              type: "string",
              description:
                "Sender identity. Either a '+E.164' phone number for phone-number mode (e.g. '+19388887785'), or a full '<Service Name> [MG<32hex>]' string for messaging-service mode (e.g. 'Default Messaging Service for Conversations [MG0f8800a56d2c69aca152c5b593802952]'). The RUCKUS One backend inspects the prefix to pick the mode.",
            },
            brandName: {
              type: "string",
              description:
                "Optional display name prefix used on outbound SMS messages (e.g. 'Acme Guest Wi-Fi'). Stored on the /notifications/sms brand record. Empty string by default.",
            },
            threshold: {
              type: "number",
              description:
                "Utilization alert threshold for the free-tier RUCKUS SMS pool (percent, 0-100; default: 80). Fires a notification when usage crosses this percentage.",
            },
            provider: {
              type: "string",
              enum: ["TWILIO"],
              description:
                "SMS provider type. Only TWILIO is supported today (default). Esendex / Other are tracked as future work and will be rejected.",
            },
            enableWhatsapp: {
              type: "boolean",
              description:
                "Enable WhatsApp OTP delivery via Twilio (default: false). When true, authTemplateSid is required and must point to an approved WhatsApp authentication template on the same Twilio account.",
            },
            authTemplateSid: {
              type: "string",
              description:
                "Twilio WhatsApp authentication template SID (HX followed by 32 hex chars). REQUIRED when enableWhatsapp=true. Must be an approved 'AUTHENTICATION' category template from Twilio Content Template Builder.",
            },
            maxRetries: {
              type: "number",
              description:
                "Maximum number of polling retries for the two async activities (default: 20).",
            },
            pollIntervalMs: {
              type: "number",
              description: "Polling interval in milliseconds (default: 5000).",
            },
          },
          required: ["accountSid", "authToken", "fromNumber"],
        },
      },
      {
        name: "delete_sms_provider",
        description:
          "Permanently delete the tenant's Twilio SMS provider credentials. This clears accountSid / authToken / fromNumber / enableWhatsapp / authTemplateSid on /notifications/sms/providers/twilios; after deletion Self Sign-In SMS and WhatsApp channels will stop delivering OTPs. The brand record on /notifications/sms (brandName, threshold) is a separate singleton and is NOT removed by this call. Synchronous operation — no polling. Cannot be undone; use create_sms_provider to restore.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "build_wifi_scheduler_config",
        description:
          "Build a correctly-shaped scheduler config object. PURE BUILDER — does NOT call the RUCKUS API. Pass the returned JSON as the 'scheduler' field of each entry in activate_wifi_network_at_venues.venueConfigs, or as 'settings.scheduler' in update_venue_wifi_network_settings. REQUIRED: mode. Pick ONE mode and fill the matching nested object; the other mode objects are ignored. MODE REFERENCE: ALWAYS_ON (24/7, no options). LEGACY_CUSTOM (per-day 96-char bitmasks only, no dates or recurrence). BASIC (new format, user-friendly recurring schedule with time windows). ADVANCED (new format, per-day bitmasks with start/end dates and repeatRule).",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["ALWAYS_ON", "LEGACY_CUSTOM", "BASIC", "ADVANCED"],
              description:
                "Which scheduler shape to build. Only the matching nested object (legacyCustom / basic / advanced) is read; others are ignored. ALWAYS_ON needs no nested object.",
            },
            legacyCustom: {
              type: "object",
              description:
                "Used only when mode=LEGACY_CUSTOM. Each day is a 96-character string of 0s and 1s — one character per 15-minute slot across 24 hours (1=on, 0=off). Omitted days default to the R1 backend behavior.",
              properties: {
                mon: {
                  type: "string",
                  description: "Monday 96-char bitmask",
                },
                tue: {
                  type: "string",
                  description: "Tuesday 96-char bitmask",
                },
                wed: {
                  type: "string",
                  description: "Wednesday 96-char bitmask",
                },
                thu: {
                  type: "string",
                  description: "Thursday 96-char bitmask",
                },
                fri: {
                  type: "string",
                  description: "Friday 96-char bitmask",
                },
                sat: {
                  type: "string",
                  description: "Saturday 96-char bitmask",
                },
                sun: {
                  type: "string",
                  description: "Sunday 96-char bitmask",
                },
              },
            },
            basic: {
              type: "object",
              description:
                "Used only when mode=BASIC. Human-friendly recurring schedule with optional time window. REQUIRED inside: repeatRule, startDate. allDay=true and fromTime/toTime are mutually exclusive — set one or the other. weeklyRepeatDays is only meaningful when repeatRule=WEEKLY; monthlyRepeatRule only when repeatRule=MONTHLY.",
              properties: {
                repeatRule: {
                  type: "string",
                  enum: ["NO_REPEAT", "WEEKLY", "MONTHLY"],
                  description: "How the schedule repeats.",
                },
                startDate: {
                  type: "string",
                  description:
                    "First active date. Format: YYYY-MM-DD (e.g., 2026-04-20).",
                },
                endDate: {
                  type: "string",
                  description:
                    "Last active date (optional). Format: YYYY-MM-DD.",
                },
                allDay: {
                  type: "boolean",
                  description:
                    "If true, schedule applies 24 hours on active days. Do NOT also set fromTime/toTime.",
                },
                fromTime: {
                  type: "string",
                  description:
                    "Start-of-window time in HH:mm (24h). Required when allDay is false or omitted. Do NOT set when allDay=true.",
                },
                toTime: {
                  type: "string",
                  description:
                    "End-of-window time in HH:mm (24h). Required when allDay is false or omitted. Do NOT set when allDay=true.",
                },
                weeklyRepeatDays: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ],
                  },
                  description:
                    "Only with repeatRule=WEEKLY. Days of the week the schedule is active. Values follow java.time.DayOfWeek (MONDAY..SUNDAY, uppercase).",
                },
                monthlyRepeatRule: {
                  type: "string",
                  description:
                    "Only with repeatRule=MONTHLY. Monthly recurrence descriptor as defined by R1 (e.g., day-of-month or ordinal-weekday rule).",
                },
              },
              required: ["repeatRule", "startDate"],
            },
            advanced: {
              type: "object",
              description:
                "Used only when mode=ADVANCED. Per-day 96-char bitmasks with recurrence metadata. REQUIRED inside: repeatRule, startDate. Any of mon..sun can be omitted; omitted days default to the R1 backend behavior.",
              properties: {
                repeatRule: {
                  type: "string",
                  enum: ["NO_REPEAT", "WEEKLY"],
                  description:
                    "How the schedule repeats. ADVANCED typically supports NO_REPEAT or WEEKLY.",
                },
                startDate: {
                  type: "string",
                  description: "First active date. Format: YYYY-MM-DD.",
                },
                endDate: {
                  type: "string",
                  description:
                    "Last active date (optional). Format: YYYY-MM-DD.",
                },
                mon: {
                  type: "string",
                  description: "Monday 96-char bitmask",
                },
                tue: {
                  type: "string",
                  description: "Tuesday 96-char bitmask",
                },
                wed: {
                  type: "string",
                  description: "Wednesday 96-char bitmask",
                },
                thu: {
                  type: "string",
                  description: "Thursday 96-char bitmask",
                },
                fri: {
                  type: "string",
                  description: "Friday 96-char bitmask",
                },
                sat: {
                  type: "string",
                  description: "Saturday 96-char bitmask",
                },
                sun: {
                  type: "string",
                  description: "Sunday 96-char bitmask",
                },
              },
              required: ["repeatRule", "startDate"],
            },
          },
          required: ["mode"],
        },
      },
      {
        name: "build_terms_condition_config",
        description:
          "Build a correctly-shaped Tiptap doc JSON for the Terms & Conditions RICH DOC mode on a portal service profile. PURE BUILDER — does NOT call the RUCKUS API. Pass the returned JSON as the 'termsConditionConfig' field of create_portal_service_profile or update_portal_service_profile. REQUIRED: mode. MODE REFERENCE: PLAIN (one paragraph, one text run). HYPERLINK (one paragraph with multiple text segments; segments that include href become Tiptap link marks). MULTILINE (one paragraph with text lines joined by hardBreak nodes). Server validates depth ≤10, ≤700 paragraphs, ≤100 text nodes/paragraph, ≤60k chars; only http/https hrefs are accepted.",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["PLAIN", "HYPERLINK", "MULTILINE"],
              description:
                "Which Tiptap doc shape to build. Only the matching nested object (plain / hyperlink / multiline) is read; others are ignored.",
            },
            plain: {
              type: "object",
              description:
                "Used only when mode=PLAIN. REQUIRED inside: text.",
              properties: {
                text: {
                  type: "string",
                  description: "Single text run rendered as one paragraph.",
                },
              },
              required: ["text"],
            },
            hyperlink: {
              type: "object",
              description:
                "Used only when mode=HYPERLINK. REQUIRED inside: segments (1+ entries). Each segment becomes a text node; if href is set, a Tiptap link mark with attrs.href is attached. Use multiple segments to interleave plain text with hyperlinked text in one paragraph.",
              properties: {
                segments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description: "Visible text for this segment.",
                      },
                      href: {
                        type: "string",
                        description:
                          "Optional http/https URL. When set, this segment becomes a hyperlink (Tiptap link mark).",
                      },
                    },
                    required: ["text"],
                  },
                  description: "Ordered segments to render in one paragraph.",
                },
              },
              required: ["segments"],
            },
            multiline: {
              type: "object",
              description:
                "Used only when mode=MULTILINE. REQUIRED inside: lines (1+ entries). Lines are placed in a single paragraph separated by hardBreak nodes (visual line breaks, not new paragraphs).",
              properties: {
                lines: {
                  type: "array",
                  items: { type: "string" },
                  description: "Text lines joined by hardBreak nodes.",
                },
              },
              required: ["lines"],
            },
          },
          required: ["mode"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  switch (name) {
    case "get_ruckus_auth_token": {
      try {
        const tokenResponse = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION,
        );
        return {
          content: [
            {
              type: "text",
              text: tokenResponse.access_token,
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting auth token:", error);
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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ruckus_venues": {
      try {
        const token = await tokenService.getValidToken();
        const region = process.env.RUCKUS_REGION;
        const apiUrl =
          region && region.trim() !== ""
            ? `https://api.${region}.ruckus.cloud/venues/query`
            : "https://api.ruckus.cloud/venues/query";
        const payload = {
          fields: ["id", "name"],
          searchTargetFields: ["name", "addressLine", "description", "tagList"],
          filters: {},
          sortField: "name",
          sortOrder: "ASC",
          page: 1,
          pageSize: 10000,
          defaultPageSize: 10,
          total: 0,
        };
        const response = await axios.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting venues:", error);
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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ruckus_activity_details": {
      try {
        const { activityId } = request.params.arguments as {
          activityId: string;
        };

        const token = await tokenService.getValidToken();

        const activityDetails = await getRuckusActivityDetails(
          token,
          activityId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(activityDetails, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting activity details:", error);
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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "create_ruckus_venue": {
      try {
        const {
          name,
          addressLine,
          city,
          country,
          latitude,
          longitude,
          timezone,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating venue:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "create_venue",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "delete_ruckus_venue": {
      try {
        const {
          venueId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting venue:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "delete_venue",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "update_ruckus_venue": {
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
          maxRetries = 20,
          pollIntervalMs = 5000,
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
            ...(timezone !== undefined && { timezone }),
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating venue:", error);

        let errorMessage = `Error updating venue: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "create_ruckus_ap_group": {
      try {
        const {
          venueId,
          name,
          description,
          apSerialNumbers,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
        if (apSerialNumbers !== undefined)
          apGroupData.apSerialNumbers = apSerialNumbers;

        const result = await createApGroupWithRetry(
          token,
          venueId,
          apGroupData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating AP group:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "create_ap_group",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "add_ap_to_group": {
      try {
        const {
          venueId,
          apGroupId,
          name,
          serialNumber,
          description,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          serialNumber,
        };
        if (description !== undefined) apData.description = description;

        const result = await addApToGroupWithRetry(
          token,
          venueId,
          apGroupId,
          apData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error adding AP to group:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "add_ap_to_group",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors) &&
              error.response.data.errors.length > 0
            ) {
              errorResponse.error.apiErrors = error.response.data.errors;
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = "No response received from server";
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "remove_ap": {
      try {
        const {
          venueId,
          apSerialNumber,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error removing AP:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "remove_ap",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors) &&
              error.response.data.errors.length > 0
            ) {
              errorResponse.error.apiErrors = error.response.data.errors;
            }
            if (error.response.data.message) {
              errorResponse.error.apiMessage = error.response.data.message;
            }
          }
        } else if (error.request) {
          errorResponse.error.networkError = "No response received from server";
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ruckus_ap_groups": {
      try {
        const {
          filters = {},
          fields = ["id", "name"],
          page = 1,
          pageSize = 10000,
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
          pageSize,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying AP groups:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "delete_ruckus_ap_group": {
      try {
        const {
          venueId,
          apGroupId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting AP group:", error);

        // Create a structured error response
        const errorResponse: any = {
          operation: "delete_ap_group",
          success: false,
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "update_ruckus_ap_group": {
      try {
        const {
          venueId,
          apGroupId,
          name,
          description,
          apSerialNumbers,
          preserveExistingAps = true,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
          name: string;
          description?: string;
          apSerialNumbers?: Array<{ serialNumber: string }>;
          preserveExistingAps?: boolean;
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
            ...(apSerialNumbers !== undefined && { apSerialNumbers }),
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
          preserveExistingAps,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating AP group:", error);

        let errorMessage = `Error updating AP group: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "get_venue_external_antenna_settings": {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };

        const token = await tokenService.getValidToken();

        const antennaSettings = await getVenueExternalAntennaSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(antennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting venue external antenna settings:",
          error,
        );
        let errorMessage = `Error getting venue external antenna settings: ${error}`;

        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_venue_antenna_type_settings": {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };

        const token = await tokenService.getValidToken();

        const antennaTypeSettings = await getVenueAntennaTypeSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(antennaTypeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting venue antenna type settings:",
          error,
        );
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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_group_external_antenna_settings": {
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
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apGroupAntennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting AP group external antenna settings:",
          error,
        );
        let errorMessage = `Error getting AP group external antenna settings: ${error}`;

        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_group_antenna_type_settings": {
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
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apGroupAntennaTypeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting AP group antenna type settings:",
          error,
        );
        let errorMessage = `Error getting AP group antenna type settings: ${error}`;

        // If it's an axios error, provide more detailed information
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_venue_ap_model_band_mode_settings": {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };

        const token = await tokenService.getValidToken();

        const venueApModelBandModeSettings =
          await getVenueApModelBandModeSettings(
            token,
            venueId,
            process.env.RUCKUS_REGION,
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(venueApModelBandModeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting venue AP model band mode settings:",
          error,
        );
        let errorMessage = `Error getting venue AP model band mode settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_venue_radio_settings": {
      try {
        const { venueId } = request.params.arguments as {
          venueId: string;
        };

        const token = await tokenService.getValidToken();

        const venueRadioSettings = await getVenueRadioSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(venueRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting venue radio settings:", error);
        let errorMessage = `Error getting venue radio settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_group_ap_model_band_mode_settings": {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };

        const token = await tokenService.getValidToken();

        const apGroupApModelBandModeSettings =
          await getApGroupApModelBandModeSettings(
            token,
            venueId,
            apGroupId,
            process.env.RUCKUS_REGION,
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apGroupApModelBandModeSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting AP group AP model band mode settings:",
          error,
        );
        let errorMessage = `Error getting AP group AP model band mode settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_group_radio_settings": {
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
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apGroupRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting AP group radio settings:", error);
        let errorMessage = `Error getting AP group radio settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_radio_settings": {
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
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apRadioSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting AP radio settings:", error);
        let errorMessage = `Error getting AP radio settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_client_admission_control_settings": {
      try {
        const { venueId, apSerialNumber } = request.params.arguments as {
          venueId: string;
          apSerialNumber: string;
        };

        const token = await tokenService.getValidToken();

        const apClientAdmissionControlSettings =
          await getApClientAdmissionControlSettings(
            token,
            venueId,
            apSerialNumber,
            process.env.RUCKUS_REGION,
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apClientAdmissionControlSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting AP client admission control settings:",
          error,
        );
        let errorMessage = `Error getting AP client admission control settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ap_group_client_admission_control_settings": {
      try {
        const { venueId, apGroupId } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
        };

        const token = await tokenService.getValidToken();

        const apGroupClientAdmissionControlSettings =
          await getApGroupClientAdmissionControlSettings(
            token,
            venueId,
            apGroupId,
            process.env.RUCKUS_REGION,
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                apGroupClientAdmissionControlSettings,
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting AP group client admission control settings:",
          error,
        );
        let errorMessage = `Error getting AP group client admission control settings: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ruckus_aps": {
      try {
        const {
          venueId,
          searchString = "",
          searchTargetFields,
          fields,
          page = 1,
          pageSize = 10,
          mesh = false,
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
          mesh,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(apsData, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying APs:", error);

        // Build structured error response
        const errorResponse: any = {
          message: "Failed to query APs",
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
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
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "update_ruckus_ap": {
      try {
        const {
          apSerialNumber,
          apName,
          venueId,
          apGroupId,
          description,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          apSerialNumber: string;
          apName?: string;
          venueId?: string;
          apGroupId?: string;
          description?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating AP:", error);

        const errorResponse: any = {
          message: "Failed to update AP",
          error: {
            message: error.message || "Unknown error",
            type: error.name || "Error",
          },
        };

        if (error.response) {
          errorResponse.httpStatus = error.response.status;
          errorResponse.httpStatusText = error.response.statusText;

          if (error.response.data) {
            if (
              error.response.data.errors &&
              Array.isArray(error.response.data.errors)
            ) {
              const firstError = error.response.data.errors[0];
              if (firstError) {
                errorResponse.error.primaryErrorCode = firstError.code;
                errorResponse.error.primaryErrorMessage =
                  firstError.message || firstError.value;
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
          errorResponse.error.networkError = "No response received from server";
          errorResponse.error.request = error.request;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
    case "query_directory_server_profiles": {
      try {
        const {
          filters = {},
          fields = [
            "id",
            "name",
            "domainName",
            "host",
            "port",
            "type",
            "wifiNetworkIds",
          ],
          searchString = "",
          searchTargetFields = ["name"],
          page = 1,
          pageSize = 10,
          sortField = "name",
          sortOrder = "ASC",
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
          sortOrder,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying directory server profiles:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_directory_server_profile": {
      try {
        const { profileId } = request.params.arguments as {
          profileId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getDirectoryServerProfile(
          token,
          profileId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting directory server profile:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "create_directory_server_profile": {
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
          maxRetries = 20,
          pollIntervalMs = 5000,
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
            attributeMappings,
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating directory server profile:", error);

        let errorMessage = `Error creating directory server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "update_directory_server_profile": {
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
          maxRetries = 20,
          pollIntervalMs = 5000,
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
            attributeMappings,
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating directory server profile:", error);

        let errorMessage = `Error updating directory server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "delete_directory_server_profile": {
      try {
        const {
          profileId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting directory server profile:", error);

        let errorMessage = `Error deleting directory server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "query_radius_server_profiles": {
      try {
        const { page = 1, pageSize = 10 } = request.params.arguments as {
          page?: number;
          pageSize?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await queryRadiusServerProfiles(
          token,
          process.env.RUCKUS_REGION,
          page,
          pageSize,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying RADIUS server profiles:", error);

        let errorMessage = `Error querying RADIUS server profiles: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_radius_server_profile": {
      try {
        const { profileId } = request.params.arguments as {
          profileId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getRadiusServerProfile(
          token,
          profileId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting RADIUS server profile:", error);

        let errorMessage = `Error getting RADIUS server profile: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "create_radius_server_profile": {
      try {
        const {
          name,
          type,
          enableSecondaryServer,
          primary,
          secondary,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          name: string;
          type: string;
          enableSecondaryServer: boolean;
          primary: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
          secondary?: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await createRadiusServerProfileWithRetry(
          token,
          {
            name,
            type: type as "AUTHENTICATION" | "ACCOUNTING",
            enableSecondaryServer,
            primary,
            ...(secondary !== undefined && { secondary }),
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating RADIUS server profile:", error);

        let errorMessage = `Error creating RADIUS server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "delete_radius_server_profile": {
      try {
        const {
          profileId,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          profileId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deleteRadiusServerProfileWithRetry(
          token,
          profileId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting RADIUS server profile:", error);

        let errorMessage = `Error deleting RADIUS server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "update_radius_server_profile": {
      try {
        const {
          profileId,
          name,
          type,
          enableSecondaryServer,
          primary,
          secondary,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          profileId: string;
          name: string;
          type: "AUTHENTICATION" | "ACCOUNTING";
          enableSecondaryServer: boolean;
          primary: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
          secondary?: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const profileData: {
          name: string;
          type: "AUTHENTICATION" | "ACCOUNTING";
          enableSecondaryServer: boolean;
          primary: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
          secondary?: {
            port: number;
            sharedSecret: string;
            hostname?: string;
            ip?: string;
          };
        } = {
          name,
          type,
          enableSecondaryServer,
          primary,
        };

        if (secondary) {
          profileData.secondary = secondary;
        }

        const result = await updateRadiusServerProfileWithRetry(
          token,
          profileId,
          profileData,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating RADIUS server profile:", error);

        let errorMessage = `Error updating RADIUS server profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "query_portal_service_profiles": {
      try {
        const {
          filters = {},
          searchString = "",
          searchTargetFields = ["name"],
          page = 1,
          pageSize = 10,
          sortField = "name",
          sortOrder = "ASC",
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
          sortOrder,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying portal service profiles:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_portal_service_profile": {
      try {
        const { profileId } = request.params.arguments as {
          profileId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getPortalServiceProfile(
          token,
          profileId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting portal service profile:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "create_portal_service_profile": {
      try {
        const {
          name,
          content,
          termsConditionConfig,
          termsConditionUrl,
          termsConditionsDisplay,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          name: string;
          content: any;
          termsConditionConfig?: any;
          termsConditionUrl?: string;
          termsConditionsDisplay?: boolean;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const mergedContent = mergeTermsConditionFields(content, {
          termsConditionConfig,
          termsConditionUrl,
          termsConditionsDisplay,
        });

        const result = await createPortalServiceProfileWithRetry(
          token,
          {
            name,
            content: mergedContent,
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating portal service profile:", error);

        let errorMessage = `Error creating portal service profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "update_portal_service_profile": {
      try {
        const {
          profileId,
          name,
          content,
          termsConditionConfig,
          termsConditionUrl,
          termsConditionsDisplay,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          profileId: string;
          name: string;
          content: any;
          termsConditionConfig?: any;
          termsConditionUrl?: string;
          termsConditionsDisplay?: boolean;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const mergedContent = mergeTermsConditionFields(content, {
          termsConditionConfig,
          termsConditionUrl,
          termsConditionsDisplay,
        });

        const result = await updatePortalServiceProfileWithRetry(
          token,
          profileId,
          {
            name,
            content: mergedContent,
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating portal service profile:", error);

        let errorMessage = `Error updating portal service profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "delete_portal_service_profile": {
      try {
        const {
          profileId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting portal service profile:", error);

        let errorMessage = `Error deleting portal service profile: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
    case "get_ruckus_user_groups": {
      try {
        const token = await tokenService.getValidToken();

        const result = await queryPrivilegeGroups(
          token,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting user groups:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_ruckus_roles": {
      try {
        const token = await tokenService.getValidToken();

        const result = await queryCustomRoles(token, process.env.RUCKUS_REGION);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting roles:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "update_privilege_group": {
      try {
        const {
          privilegeGroupName,
          name,
          roleName,
          delegation,
          allVenues = true,
          venueNames = [],
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating privilege group:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "update_custom_role": {
      try {
        const {
          roleId,
          name,
          features,
          preDefinedRole,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating custom role:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "query_role_features": {
      try {
        const {
          showScopes = false,
          category = "",
          searchString = "",
          page = 1,
          pageSize = 100,
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
          pageSize,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying role features:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "create_custom_role": {
      try {
        const {
          name,
          features,
          preDefinedRole = "READ_ONLY",
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
          preDefinedRole,
        );

        // Build user-friendly response with auto-added permissions info
        let responseText: string;

        if (result._mcp_metadata?.autoAddedPermissions?.length > 0) {
          responseText =
            `Custom role created successfully!\n\n` +
            `Auto-added parent permissions for proper functionality:\n` +
            `${result._mcp_metadata.autoAddedPermissions.map((p: string) => `  - ${p}`).join("\n")}\n\n` +
            `Role Details:\n` +
            JSON.stringify(
              {
                id: result.id,
                name: result.name,
                features: result.features,
                type: result.type,
                preDefinedRole: result.preDefinedRole,
              },
              null,
              2,
            );
        } else {
          responseText =
            `Custom role created successfully!\n\n` +
            `No additional permissions were needed.\n\n` +
            `Role Details:\n` +
            JSON.stringify(
              {
                id: result.id,
                name: result.name,
                features: result.features,
                type: result.type,
                preDefinedRole: result.preDefinedRole,
              },
              null,
              2,
            );
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating custom role:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
    case "delete_custom_role": {
      try {
        const {
          roleId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting custom role:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "query_wifi_networks": {
      try {
        const {
          filters = {},
          fields = [
            "name",
            "description",
            "nwSubType",
            "venueApGroups",
            "apSerialNumbers",
            "apCount",
            "clientCount",
            "vlan",
            "cog",
            "ssid",
            "vlanPool",
            "captiveType",
            "id",
            "securityProtocol",
            "dsaeOnboardNetwork",
            "isOweMaster",
            "owePairNetworkId",
            "tunnelWlanEnable",
            "isEnforced",
          ],
          searchString = "",
          searchTargetFields = ["name"],
          page = 1,
          pageSize = 10,
          sortField = "name",
          sortOrder = "ASC",
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
          sortOrder,
        );

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying WiFi networks:", error);

        let errorMessage = `Error querying WiFi networks: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "get_wifi_network": {
      try {
        const { networkId } = request.params.arguments as {
          networkId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getWifiNetwork(
          token,
          networkId,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting WiFi network:", error);

        let errorMessage = `Error getting WiFi network: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "create_wifi_network": {
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
          oweEnabled,
          oweTransitionEnabled,
          dpskServiceId,
          temporaryConnectionEnabled,
          temporaryConnection,
          guestPortal,
          portalServiceProfileId,
          radiusServiceProfileId,
          accountingRadiusServiceProfileId,
          enableAuthProxy,
          enableAccountingProxy,
          allowedEmailDomains,
          sessionDurationDays,
          enableSmsLogin,
          enableEmailLogin,
          enableWhatsappLogin,
          smsPasswordDuration,
          maxDevices,
          radiusOptions,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          name: string;
          ssid: string;
          type:
            | "psk"
            | "enterprise"
            | "open"
            | "dpsk"
            | "guestPass"
            | "clickThrough"
            | "selfSignIn"
            | "hostApproval"
            | "cloudpath"
            | "wispr"
            | "directory"
            | "saml"
            | "workflow";
          passphrase?: string;
          wlanSecurity:
            | "WPA2Personal"
            | "WPA3Personal"
            | "WPA2Enterprise"
            | "WPA3Enterprise"
            | "WPA23Mixed"
            | "Open"
            | "None";
          vlanId?: number;
          managementFrameProtection?: "Disabled" | "Capable" | "Required";
          maxClientsOnWlanPerRadio?: number;
          enableBandBalancing?: boolean;
          clientIsolation?: boolean;
          hideSsid?: boolean;
          enableFastRoaming?: boolean;
          mobilityDomainId?: number;
          wifi6Enabled?: boolean;
          wifi7Enabled?: boolean;
          oweEnabled?: boolean;
          oweTransitionEnabled?: boolean;
          dpskServiceId?: string;
          temporaryConnectionEnabled?: boolean;
          temporaryConnection?: {
            duration?: number;
            maxDownloadRate?: number;
            maxUploadRate?: number;
          };
          guestPortal?: any;
          portalServiceProfileId?: string;
          radiusServiceProfileId?: string;
          accountingRadiusServiceProfileId?: string;
          enableAuthProxy?: boolean;
          enableAccountingProxy?: boolean;
          allowedEmailDomains?: string[];
          sessionDurationDays?: number;
          enableSmsLogin?: boolean;
          enableEmailLogin?: boolean;
          enableWhatsappLogin?: boolean;
          smsPasswordDuration?: {
            duration: number;
            unit: "MINUTE" | "HOUR" | "DAY";
          };
          maxDevices?: number;
          radiusOptions?: {
            nasIdType?:
              | "AP_GROUP_NAME"
              | "BSSID"
              | "VENUE_NAME"
              | "AP_MAC"
              | "USER";
            userDefinedNasId?: string;
            nasRequestTimeoutSec?: number;
            nasMaxRetry?: number;
            nasReconnectPrimaryMin?: number;
            calledStationIdType?: "BSSID";
          };
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
        if (managementFrameProtection !== undefined)
          networkConfig.managementFrameProtection = managementFrameProtection;
        if (maxClientsOnWlanPerRadio !== undefined)
          networkConfig.maxClientsOnWlanPerRadio = maxClientsOnWlanPerRadio;
        if (enableBandBalancing !== undefined)
          networkConfig.enableBandBalancing = enableBandBalancing;
        if (clientIsolation !== undefined)
          networkConfig.clientIsolation = clientIsolation;
        if (hideSsid !== undefined) networkConfig.hideSsid = hideSsid;
        if (enableFastRoaming !== undefined)
          networkConfig.enableFastRoaming = enableFastRoaming;
        if (mobilityDomainId !== undefined)
          networkConfig.mobilityDomainId = mobilityDomainId;
        if (wifi6Enabled !== undefined)
          networkConfig.wifi6Enabled = wifi6Enabled;
        if (wifi7Enabled !== undefined)
          networkConfig.wifi7Enabled = wifi7Enabled;
        if (oweEnabled !== undefined) networkConfig.oweEnabled = oweEnabled;
        if (oweTransitionEnabled !== undefined)
          networkConfig.oweTransitionEnabled = oweTransitionEnabled;
        if (dpskServiceId !== undefined)
          networkConfig.dpskServiceId = dpskServiceId;
        if (temporaryConnectionEnabled !== undefined)
          networkConfig.temporaryConnectionEnabled = temporaryConnectionEnabled;
        if (temporaryConnection !== undefined)
          networkConfig.temporaryConnection = temporaryConnection;
        if (guestPortal !== undefined) networkConfig.guestPortal = guestPortal;
        if (portalServiceProfileId !== undefined)
          networkConfig.portalServiceProfileId = portalServiceProfileId;
        if (radiusServiceProfileId !== undefined)
          networkConfig.radiusServiceProfileId = radiusServiceProfileId;
        if (accountingRadiusServiceProfileId !== undefined)
          networkConfig.accountingRadiusServiceProfileId =
            accountingRadiusServiceProfileId;
        if (enableAuthProxy !== undefined)
          networkConfig.enableAuthProxy = enableAuthProxy;
        if (enableAccountingProxy !== undefined)
          networkConfig.enableAccountingProxy = enableAccountingProxy;
        if (allowedEmailDomains !== undefined)
          networkConfig.allowedEmailDomains = allowedEmailDomains;
        if (sessionDurationDays !== undefined)
          networkConfig.sessionDurationDays = sessionDurationDays;
        if (enableSmsLogin !== undefined)
          networkConfig.enableSmsLogin = enableSmsLogin;
        if (enableEmailLogin !== undefined)
          networkConfig.enableEmailLogin = enableEmailLogin;
        if (enableWhatsappLogin !== undefined)
          networkConfig.enableWhatsappLogin = enableWhatsappLogin;
        if (smsPasswordDuration !== undefined)
          networkConfig.smsPasswordDuration = smsPasswordDuration;
        if (maxDevices !== undefined) networkConfig.maxDevices = maxDevices;
        if (radiusOptions !== undefined)
          networkConfig.radiusOptions = radiusOptions;

        const result = await createWifiNetworkWithRetry(
          token,
          networkConfig,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating WiFi network:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "activate_wifi_network_at_venues": {
      try {
        const {
          networkId,
          venueConfigs,
          portalServiceProfileId,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          networkId: string;
          venueConfigs: Array<{
            venueId: string;
            isAllApGroups: boolean;
            apGroups?: string[];
            allApGroupsRadio: "Both" | "2.4GHz" | "5GHz" | "6GHz";
            allApGroupsRadioTypes: string[];
            scheduler: {
              type: "ALWAYS_ON" | "CUSTOM";
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
          portalServiceProfileId,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error activating WiFi network at venues:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "deactivate_wifi_network_at_venues": {
      try {
        const {
          networkId,
          venueIds,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error deactivating WiFi network at venues:",
          error,
        );

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "delete_wifi_network": {
      try {
        const {
          networkId,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting WiFi network:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "query_guest_passes": {
      try {
        const {
          filters = {},
          fields = [
            "creationDate",
            "name",
            "passDurationHours",
            "id",
            "wifiNetworkId",
            "maxNumberOfClients",
            "notes",
            "clients",
            "guestStatus",
            "emailAddress",
            "mobilePhoneNumber",
            "guestType",
            "ssid",
            "socialLogin",
            "expiryDate",
            "cog",
            "hostApprovalEmail",
            "devicesMac",
          ],
          searchString = "",
          searchTargetFields = ["name", "mobilePhoneNumber", "emailAddress"],
          page = 1,
          pageSize = 10,
          sortField = "name",
          sortOrder = "ASC",
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

        const result = await queryGuestPasses(
          token,
          process.env.RUCKUS_REGION,
          filters,
          fields,
          searchString,
          searchTargetFields,
          page,
          pageSize,
          sortField,
          sortOrder,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying guest passes:", error);

        let errorMessage = `Error querying guest passes: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "create_guest_pass": {
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
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          networkId: string;
          name: string;
          expiration: {
            duration: number;
            unit: "Hour" | "Day" | "Week" | "Month";
            activationType: "Creation" | "FirstUse";
          };
          maxDevices: number;
          deliveryMethods: ("PRINT" | "EMAIL" | "SMS")[];
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
            ...(notes !== undefined && { notes }),
          },
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating guest pass:", error);

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "delete_guest_pass": {
      try {
        const {
          networkId,
          guestPassId,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          networkId: string;
          guestPassId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deleteGuestPassWithRetry(
          token,
          networkId,
          guestPassId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting guest pass:", error);

        let errorMessage = `Error deleting guest pass: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "update_wifi_network": {
      try {
        const {
          networkId,
          networkConfig,
          maxRetries = 20,
          pollIntervalMs = 5000,
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
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error updating WiFi network:", error);

        let errorMessage = `Error updating WiFi network: ${error}`;

        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "query_clients": {
      try {
        const {
          filters = {},
          fields,
          searchString = "",
          searchTargetFields,
          page = 1,
          pageSize = 10,
          sortField = "name",
          sortOrder = "ASC",
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

        const result = await queryClients(
          token,
          process.env.RUCKUS_REGION,
          filters,
          fields,
          searchString,
          searchTargetFields,
          page,
          pageSize,
          sortField,
          sortOrder,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying clients:", error);

        let errorMessage = `Error querying clients: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_ap_password": {
      try {
        const { venueId, apSerial } = request.params.arguments as {
          venueId: string;
          apSerial: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getApPassword(
          token,
          venueId,
          apSerial,
          process.env.RUCKUS_REGION,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting AP password:", error);
        let errorMessage = `Error getting AP password: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "create_identity_group": {
      try {
        const {
          name: groupName,
          autoCleanupEnabled = true,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          name: string;
          autoCleanupEnabled?: boolean;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await createIdentityGroupWithRetry(
          token,
          groupName,
          autoCleanupEnabled,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating identity group:", error);

        let errorMessage = `Error creating identity group: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "query_identity_groups": {
      try {
        const {
          keyword = "",
          page = 1,
          pageSize = 10000,
          sortField = "name",
          sortOrder = "ASC",
        } = request.params.arguments as {
          keyword?: string;
          page?: number;
          pageSize?: number;
          sortField?: string;
          sortOrder?: string;
        };

        const token = await tokenService.getValidToken();

        const result = await queryIdentityGroups(
          token,
          process.env.RUCKUS_REGION,
          keyword,
          page,
          pageSize,
          sortField,
          sortOrder,
        );

        console.log("[MCP] Query identity groups response:", result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying identity groups:", error);

        let errorMessage = `Error querying identity groups: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "delete_identity_group": {
      try {
        const {
          identityGroupId,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          identityGroupId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deleteIdentityGroupWithRetry(
          token,
          identityGroupId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting identity group:", error);

        let errorMessage = `Error deleting identity group: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "create_dpsk_service": {
      try {
        const {
          identityGroupId,
          name: serviceName,
          passphraseFormat = "MOST_SECURED",
          passphraseLength = 18,
          autoNotificationsEnabled = false,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          identityGroupId: string;
          name: string;
          passphraseFormat?: string;
          passphraseLength?: number;
          autoNotificationsEnabled?: boolean;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await createDpskServiceWithRetry(
          token,
          identityGroupId,
          serviceName,
          passphraseFormat,
          passphraseLength,
          autoNotificationsEnabled,
          null,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating DPSK service:", error);

        let errorMessage = `Error creating DPSK service: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "query_dpsk_services": {
      try {
        const {
          page = 0,
          pageSize = 10000,
          sortField = "name",
          sortOrder = "asc",
        } = request.params.arguments as {
          page?: number;
          pageSize?: number;
          sortField?: string;
          sortOrder?: string;
        };

        const token = await tokenService.getValidToken();

        const result = await queryDpskServices(
          token,
          process.env.RUCKUS_REGION,
          page,
          pageSize,
          sortField,
          sortOrder,
        );

        console.log("[MCP] Query DPSK services response:", result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error querying DPSK services:", error);

        let errorMessage = `Error querying DPSK services: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "delete_dpsk_service": {
      try {
        const {
          dpskServiceId,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          dpskServiceId: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await deleteDpskServiceWithRetry(
          token,
          dpskServiceId,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting DPSK service:", error);

        let errorMessage = `Error deleting DPSK service: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_venue_wifi_network_settings": {
      try {
        const { venueId, wifiNetworkId } = request.params.arguments as {
          venueId: string;
          wifiNetworkId: string;
        };

        const token = await tokenService.getValidToken();

        const result = await getVenueWifiNetworkSettings(
          token,
          venueId,
          wifiNetworkId,
          process.env.RUCKUS_REGION,
        );

        console.log("[MCP] Get venue WiFi network settings response:", result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error getting venue WiFi network settings:",
          error,
        );

        let errorMessage = `Error getting venue WiFi network settings: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "update_venue_wifi_network_settings": {
      try {
        const {
          venueId,
          wifiNetworkId,
          settings,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          venueId: string;
          wifiNetworkId: string;
          settings: any;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const result = await updateVenueWifiNetworkSettingsWithRetry(
          token,
          venueId,
          wifiNetworkId,
          settings,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(
          "[MCP] Error updating venue WiFi network settings:",
          error,
        );

        let errorMessage = `Error updating venue WiFi network settings: ${error}`;

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
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_sms_provider": {
      try {
        const token = await tokenService.getValidToken();
        const result = await getSmsProvider(token, process.env.RUCKUS_REGION);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        console.error("[MCP] Error getting SMS provider:", error);
        let errorMessage = `Error getting SMS provider: ${error}`;
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "create_sms_provider": {
      try {
        const {
          accountSid,
          authToken: twilioAuthToken,
          fromNumber,
          brandName,
          threshold,
          provider,
          enableWhatsapp,
          authTemplateSid,
          maxRetries = 20,
          pollIntervalMs = 5000,
        } = request.params.arguments as {
          accountSid: string;
          authToken: string;
          fromNumber: string;
          brandName?: string;
          threshold?: number;
          provider?: "TWILIO";
          enableWhatsapp?: boolean;
          authTemplateSid?: string;
          maxRetries?: number;
          pollIntervalMs?: number;
        };

        const token = await tokenService.getValidToken();

        const smsConfig: {
          provider?: "TWILIO";
          brandName?: string;
          threshold?: number;
          accountSid: string;
          authToken: string;
          fromNumber: string;
          enableWhatsapp?: boolean;
          authTemplateSid?: string;
        } = {
          accountSid,
          authToken: twilioAuthToken,
          fromNumber,
        };
        if (brandName !== undefined) smsConfig.brandName = brandName;
        if (threshold !== undefined) smsConfig.threshold = threshold;
        if (provider !== undefined) smsConfig.provider = provider;
        if (enableWhatsapp !== undefined)
          smsConfig.enableWhatsapp = enableWhatsapp;
        if (authTemplateSid !== undefined)
          smsConfig.authTemplateSid = authTemplateSid;

        const result = await createSmsProviderWithRetry(
          token,
          smsConfig,
          process.env.RUCKUS_REGION,
          maxRetries,
          pollIntervalMs,
        );

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        console.error("[MCP] Error creating SMS provider:", error);
        let errorMessage = `Error creating SMS provider: ${error}`;
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "delete_sms_provider": {
      try {
        const token = await tokenService.getValidToken();
        const result = await deleteSmsProvider(
          token,
          process.env.RUCKUS_REGION,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        console.error("[MCP] Error deleting SMS provider:", error);
        let errorMessage = `Error deleting SMS provider: ${error}`;
        if (error.response) {
          errorMessage += `\nHTTP Status: ${error.response.status}`;
          errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
          errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
        } else if (error.request) {
          errorMessage += `\nNo response received: ${error.request}`;
        }
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }

    case "build_wifi_scheduler_config": {
      try {
        const { mode, legacyCustom, basic, advanced } = request.params
          .arguments as {
          mode: "ALWAYS_ON" | "LEGACY_CUSTOM" | "BASIC" | "ADVANCED";
          legacyCustom?: {
            mon?: string;
            tue?: string;
            wed?: string;
            thu?: string;
            fri?: string;
            sat?: string;
            sun?: string;
          };
          basic?: {
            repeatRule?: string;
            startDate?: string;
            endDate?: string;
            allDay?: boolean;
            fromTime?: string;
            toTime?: string;
            weeklyRepeatDays?: string[];
            monthlyRepeatRule?: string;
          };
          advanced?: {
            repeatRule?: string;
            startDate?: string;
            endDate?: string;
            mon?: string;
            tue?: string;
            wed?: string;
            thu?: string;
            fri?: string;
            sat?: string;
            sun?: string;
          };
        };

        const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
        let scheduler: Record<string, any>;

        switch (mode) {
          case "ALWAYS_ON": {
            scheduler = { type: "ALWAYS_ON" };
            break;
          }
          case "LEGACY_CUSTOM": {
            scheduler = { type: "CUSTOM" };
            if (legacyCustom) {
              for (const day of dayKeys) {
                if (legacyCustom[day] !== undefined) {
                  scheduler[day] = legacyCustom[day];
                }
              }
            }
            break;
          }
          case "BASIC": {
            if (!basic || !basic.repeatRule || !basic.startDate) {
              throw new Error(
                "mode=BASIC requires basic.repeatRule and basic.startDate",
              );
            }
            scheduler = {
              type: "CUSTOM",
              customType: "BASIC",
              repeatRule: basic.repeatRule,
              startDate: basic.startDate,
            };
            if (basic.endDate !== undefined) scheduler.endDate = basic.endDate;
            if (basic.allDay !== undefined) scheduler.allDay = basic.allDay;
            if (basic.fromTime !== undefined) scheduler.fromTime = basic.fromTime;
            if (basic.toTime !== undefined) scheduler.toTime = basic.toTime;
            if (basic.weeklyRepeatDays !== undefined)
              scheduler.weeklyRepeatDays = basic.weeklyRepeatDays;
            if (basic.monthlyRepeatRule !== undefined)
              scheduler.monthlyRepeatRule = basic.monthlyRepeatRule;
            break;
          }
          case "ADVANCED": {
            if (!advanced || !advanced.repeatRule || !advanced.startDate) {
              throw new Error(
                "mode=ADVANCED requires advanced.repeatRule and advanced.startDate",
              );
            }
            scheduler = {
              type: "CUSTOM",
              customType: "ADVANCED",
              repeatRule: advanced.repeatRule,
              startDate: advanced.startDate,
            };
            if (advanced.endDate !== undefined)
              scheduler.endDate = advanced.endDate;
            for (const day of dayKeys) {
              if (advanced[day] !== undefined) {
                scheduler[day] = advanced[day];
              }
            }
            break;
          }
          default: {
            const _exhaustive: never = mode;
            throw new Error(
              `Unknown mode: ${_exhaustive}. Expected ALWAYS_ON, LEGACY_CUSTOM, BASIC, or ADVANCED.`,
            );
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(scheduler, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error building scheduler config: ${error.message || error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "build_terms_condition_config": {
      try {
        const { mode, plain, hyperlink, multiline } = request.params
          .arguments as {
          mode: "PLAIN" | "HYPERLINK" | "MULTILINE";
          plain?: { text?: string };
          hyperlink?: { segments?: Array<{ text?: string; href?: string }> };
          multiline?: { lines?: string[] };
        };

        let paragraphContent: any[];

        switch (mode) {
          case "PLAIN": {
            if (!plain || typeof plain.text !== "string") {
              throw new Error("mode=PLAIN requires plain.text (string)");
            }
            paragraphContent = [{ type: "text", text: plain.text }];
            break;
          }
          case "HYPERLINK": {
            if (
              !hyperlink ||
              !Array.isArray(hyperlink.segments) ||
              hyperlink.segments.length === 0
            ) {
              throw new Error(
                "mode=HYPERLINK requires hyperlink.segments (non-empty array)",
              );
            }
            paragraphContent = hyperlink.segments.map((segment, idx) => {
              if (!segment || typeof segment.text !== "string") {
                throw new Error(
                  `hyperlink.segments[${idx}].text is required (string)`,
                );
              }
              const node: any = { type: "text", text: segment.text };
              if (segment.href !== undefined) {
                node.marks = [
                  { type: "link", attrs: { href: segment.href } },
                ];
              }
              return node;
            });
            break;
          }
          case "MULTILINE": {
            if (
              !multiline ||
              !Array.isArray(multiline.lines) ||
              multiline.lines.length === 0
            ) {
              throw new Error(
                "mode=MULTILINE requires multiline.lines (non-empty array)",
              );
            }
            paragraphContent = [];
            multiline.lines.forEach((line, idx) => {
              if (typeof line !== "string") {
                throw new Error(
                  `multiline.lines[${idx}] must be a string`,
                );
              }
              if (idx > 0) {
                paragraphContent.push({ type: "hardBreak" });
              }
              paragraphContent.push({ type: "text", text: line });
            });
            break;
          }
          default: {
            const _exhaustive: never = mode;
            throw new Error(
              `Unknown mode: ${_exhaustive}. Expected PLAIN, HYPERLINK, or MULTILINE.`,
            );
          }
        }

        const doc = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: paragraphContent,
            },
          ],
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(doc, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error building terms condition config: ${error.message || error}`,
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
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

const transport = new StdioServerTransport();
console.log("RUCKUS1 MCP server is running and ready for connections.");
server.connect(transport);
