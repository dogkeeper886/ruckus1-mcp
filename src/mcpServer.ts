import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { getRuckusJwtToken, getRuckusActivityDetails, createVenueWithRetry, deleteVenueWithRetry, createApGroupWithRetry, queryApGroups, deleteApGroupWithRetry, getApModelAntennaSettings, queryAPs, moveApToGroup, getApExternalAntennaSettings } from './services/ruckusApiService';

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
        name: 'get_ap_model_antenna_settings',
        description: 'Get AP model external antenna settings for a venue',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue to get antenna settings for',
            },
          },
          required: ['venueId'],
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
        name: 'move_ap_to_group',
        description: 'Move an AP to an AP group with automatic status checking for async operations',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP and AP group',
            },
            apGroupId: {
              type: 'string',
              description: 'ID of the AP group to move the AP into',
            },
            serialNumber: {
              type: 'string',
              description: 'Serial number of the AP to move',
            },
            pollIntervalMs: {
              type: 'number',
              description: 'Polling interval in milliseconds (default: 2000)',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts (default: 5)',
            },
          },
          required: ['venueId', 'apGroupId', 'serialNumber'],
        },
      },
      {
        name: 'get_ap_external_antenna_settings',
        description: 'Get external antenna settings for a specific AP by serial number',
        inputSchema: {
          type: 'object',
          properties: {
            venueId: {
              type: 'string',
              description: 'ID of the venue containing the AP',
            },
            serialNumber: {
              type: 'string',
              description: 'Serial number of the AP to get antenna settings for',
            },
          },
          required: ['venueId', 'serialNumber'],
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
    case 'get_ap_model_antenna_settings': {
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
        
        const antennaSettings = await getApModelAntennaSettings(
          token,
          venueId,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP model antenna settings response:', antennaSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(antennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP model antenna settings:', error);
        let errorMessage = `Error getting AP model antenna settings: ${error}`;
        
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
    case 'move_ap_to_group': {
      try {
        const { 
          venueId,
          apGroupId,
          serialNumber,
          pollIntervalMs = 2000,
          maxRetries = 5
        } = request.params.arguments as {
          venueId: string;
          apGroupId: string;
          serialNumber: string;
          pollIntervalMs?: number;
          maxRetries?: number;
        };
        
        const result = await moveApToGroup(
          venueId,
          apGroupId,
          serialNumber,
          pollIntervalMs,
          maxRetries,
          process.env.RUCKUS_REGION
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
        
        // Build structured error response
        const errorResponse: any = {
          message: 'Failed to move AP to group',
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
    case 'get_ap_external_antenna_settings': {
      try {
        const { venueId, serialNumber } = request.params.arguments as {
          venueId: string;
          serialNumber: string;
        };
        
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        
        const antennaSettings = await getApExternalAntennaSettings(
          token,
          venueId,
          serialNumber,
          process.env.RUCKUS_REGION
        );
        
        console.log('[MCP] AP external antenna settings response:', antennaSettings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(antennaSettings, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error('[MCP] Error getting AP external antenna settings:', error);
        
        // Build structured error response
        const errorResponse: any = {
          message: 'Failed to get AP external antenna settings',
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