import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Initialize the server
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

// Tool: Get Ruckus Auth Token
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
    ],
  };
});

// Tool: Get Ruckus Auth Token Implementation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_ruckus_auth_token':
      try {
        // This would typically call your existing ruckusAuthService
        // For now, we'll make a direct API call
        const response = await axios.get('http://localhost:3000/ruckus-auth/token');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting Ruckus auth token: ${error}`,
            },
          ],
          isError: true,
        };
      }

    case 'get_ruckus_venues':
      try {
        // This would typically call your existing ruckusVenuesService
        const response = await axios.get('http://localhost:3000/venues');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting Ruckus venues: ${error}`,
            },
          ],
          isError: true,
        };
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

// Resources: List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ruckus://auth/token',
        name: 'Ruckus Auth Token',
        description: 'Current RUCKUS One JWT token',
        mimeType: 'application/json',
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

// Resources: Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    let response;
    switch (uri) {
      case 'ruckus://auth/token':
        response = await axios.get('http://localhost:3000/ruckus-auth/token');
        break;
      case 'ruckus://venues/list':
        response = await axios.get('http://localhost:3000/venues');
        break;
      default:
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

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
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

// Start the server
const transport = new StdioServerTransport();
server.connect(transport); 