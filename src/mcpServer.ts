import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { getRuckusJwtToken } from './services/ruckusAuthService';

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
      } catch (error) {
        console.error('[MCP] Error getting auth token:', error);
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
      } catch (error) {
        console.error('[MCP] Error getting venues:', error);
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