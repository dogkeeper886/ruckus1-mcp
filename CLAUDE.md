# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Run MCP Server**: `npm run mcp` - Starts the MCP server using ts-node
- **Development**: `npm run dev` - Runs development server with ts-node (main focus is MCP)
- **Production**: `npm start` - Runs the built MCP server from `dist/`

## Architecture Overview

This is a **Model Context Protocol (MCP) server** for RUCKUS One network management. The codebase follows a service-oriented architecture:

### Core Components
- **`src/mcpServer.ts`**: Main MCP server implementation using `@modelcontextprotocol/sdk`
  - Implements MCP tools: `get_ruckus_auth_token`, `get_ruckus_venues`, `get_ruckus_activity_details`, `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, `get_ruckus_ap_groups`, `delete_ruckus_ap_group`, `get_ap_model_antenna_settings`, `get_ap_model_antenna_type_settings`, `get_ruckus_aps`, `move_ruckus_ap` (with status checking and retry logic for async operations)
  - Implements MCP resources: `ruckus://auth/token`, `ruckus://venues/list`
  - Uses stdio transport for MCP communication
- **`src/services/ruckusApiService.ts`**: Comprehensive RUCKUS One API service layer
  - Handles OAuth2 authentication with client credentials grant flow
  - Supports multi-region RUCKUS cloud endpoints
  - Provides venue CRUD operations, AP group creation/deletion/querying, AP querying, and AP movement with retry mechanisms and polling
  - Manages async operation tracking via activity details
  - Implements structured error handling and timeout management

### Configuration
Environment variables required:
- `RUCKUS_TENANT_ID`: RUCKUS One tenant identifier
- `RUCKUS_CLIENT_ID`: OAuth2 client ID
- `RUCKUS_CLIENT_SECRET`: OAuth2 client secret  
- `RUCKUS_REGION`: RUCKUS cloud region (optional, defaults to global)

### MCP Integration
This server is designed to be used with MCP clients (like Claude Desktop). Configuration goes in the client's `mcp.json` file, not in this repository. The server runs as a subprocess and communicates via stdio.

### API Patterns
- All RUCKUS API calls require JWT token authentication
- Venues API supports pagination and filtering (configured for 10,000 max results)
- Error handling returns structured MCP error responses
- Regional API endpoints are dynamically constructed based on configuration
- Async operations (venue create/delete, AP group creation/deletion, AP movement) use polling with configurable retry logic
- Activity tracking system monitors long-running operations via requestId

## Better Process for Adding New MCP Tools

**CRITICAL**: Follow this exact process to avoid inconsistent implementations:

### Step 1: Pattern Analysis (REQUIRED)
Before writing ANY code:
1. **Find the most similar existing tool** in `src/services/ruckusApiService.ts`
2. **Copy its exact structure** (parameter order, defaults, error handling)
3. **Check existing tool in `src/mcpServer.ts`** for registration and handler patterns

### Step 2: Service Function Template (MANDATORY)
```typescript
// src/services/ruckusApiService.ts
export async function yourNewToolWithRetry(
  token: string,               // ALWAYS first parameter
  requiredParam1: string,      // Required business parameters
  requiredParam2: string,      
  region: string = '',         // ALWAYS this default
  maxRetries: number = 5,      // ALWAYS 5 (not 10, not 3)
  pollIntervalMs: number = 2000 // ALWAYS 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/endpoint`
    : `https://api.ruckus.cloud/your/endpoint`;

  const response = await makeRuckusApiCall({
    method: 'post', // or put/get/delete
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Operation Name');

  const operationResponse = response.data;
  
  // Standard async polling pattern - COPY EXACTLY from existing tool
  const activityId = operationResponse.requestId;
  
  if (!activityId) {
    return {
      ...operationResponse,
      status: 'completed',
      message: 'Operation completed successfully (synchronous operation)'
    };
  }

  // COPY polling loop exactly from createApGroupWithRetry or similar
  // Do not modify the polling logic
}
```

### Step 3: MCP Registration Template (MANDATORY)
```typescript
// src/mcpServer.ts - Add to tools array
{
  name: 'your_new_tool',
  description: 'Clear description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      requiredParam1: { type: 'string', description: 'Description' },
      requiredParam2: { type: 'string', description: 'Description' },
      maxRetries: { type: 'number', description: 'Maximum number of polling retries (default: 5)' },
      pollIntervalMs: { type: 'number', description: 'Polling interval in milliseconds (default: 2000)' }
    },
    required: ['requiredParam1', 'requiredParam2']
  }
}
```

### Step 4: MCP Handler Template (MANDATORY)
```typescript
// src/mcpServer.ts - Add case handler
case 'your_new_tool': {
  try {
    const { 
      requiredParam1,
      requiredParam2,
      maxRetries = 5,
      pollIntervalMs = 2000
    } = request.params.arguments as {
      requiredParam1: string;
      requiredParam2: string;
      maxRetries?: number;
      pollIntervalMs?: number;
    };
    
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );
    
    const result = await yourNewToolWithRetry(
      token,
      requiredParam1,
      requiredParam2,
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
    // COPY error handling exactly from existing tool - do not modify
  }
}
```

### Enforcement Rules
- **NO custom defaults**: Always use `maxRetries = 5`, `pollIntervalMs = 2000`
- **NO custom error handling**: Copy existing error handling exactly
- **NO custom polling logic**: Copy polling loop from existing tool exactly
- **NO additional response fields**: Don't add extra metadata to responses

### Pre-Implementation Checklist
- [ ] Identified similar existing tool to copy from
- [ ] Confirmed parameter order matches pattern
- [ ] Confirmed defaults match (5, 2000)
- [ ] Confirmed error handling structure matches
- [ ] Ready to implement following exact template

**VIOLATION OF THIS PROCESS WILL REQUIRE COMPLETE REWRITE**