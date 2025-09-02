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
  - Implements MCP tools: `get_ruckus_auth_token`, `get_ruckus_venues`, `get_ruckus_activity_details`, `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, `get_ruckus_ap_groups`, `delete_ruckus_ap_group`, `get_ap_model_antenna_settings`, `get_ap_model_antenna_type_settings`, `get_ruckus_aps`, `move_ruckus_ap`, `update_ruckus_ap`, `move_ap_to_group`, `move_ap_to_venue`, `rename_ap`, `query_privilege_groups`, `update_custom_role`, `query_role_features` (with status checking and retry logic for async operations)
  - Implements MCP resources: `ruckus://auth/token`, `ruckus://venues/list`
  - Uses stdio transport for MCP communication
- **`src/services/ruckusApiService.ts`**: Comprehensive RUCKUS One API service layer
  - Handles OAuth2 authentication with client credentials grant flow
  - Supports multi-region RUCKUS cloud endpoints
  - Provides venue CRUD operations, AP group creation/deletion/querying, AP querying, AP movement with retry mechanisms and polling, comprehensive AP management with retrieve-then-update pattern, and role/permission management operations
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
- **Retrieve-Then-Update Pattern**: All AP update operations first retrieve current state to preserve existing properties, preventing data loss during property changes

## Better Process for Adding New MCP Tools

**CRITICAL**: Follow this exact process to avoid inconsistent implementations:

### Step 1: Pattern Analysis (REQUIRED)
Before writing ANY code:
1. **Find the most similar existing tool** in `src/services/ruckusApiService.ts`
2. **Copy its exact structure** (parameter order, defaults, error handling)
3. **Check existing tool in `src/mcpServer.ts`** for registration and handler patterns

### Step 2: Determine Operation Type (CRITICAL)

**READ-ONLY Operations** (GET, Query): Use existing read-only patterns
**ASYNC Operations** (Create, Delete, Update): Use retry pattern with polling

### Step 2A: Read-Only Operations Template (Query/GET operations)
For operations like directory server profiles, AP queries, activity details:

**Special Case - Client-Side Filtering (ONLY for token limit issues):**
When API responses exceed MCP's 25,000 token limit AND the API doesn't support filtering:
```typescript
// ONLY use when: 1) Response > 25k tokens, 2) No server-side filtering available
export async function queryLargeResource(
  token: string,
  region: string = '',
  // API parameters first
  apiParam1: boolean = false,   
  // Client-side filters last
  filterField: string = '',     // Client-side filter
  searchString: string = '',    // Client-side search
  page: number = 1,             // Client-side pagination
  pageSize: number = 100        // Default 100 to limit response
): Promise<any> {
  // Get all data from API (no server-side filtering available)
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/your/endpoint`;
  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, 'Query operation');

  let data = response.data;

  // Apply simple client-side filtering
  if (filterField && filterField.trim() !== '') {
    data = data.filter((item: any) => 
      item.fieldName?.toLowerCase() === filterField.toLowerCase()
    );
  }
  
  if (searchString && searchString.trim() !== '') {
    const search = searchString.toLowerCase();
    data = data.filter((item: any) => 
      item.name?.toLowerCase().includes(search) || 
      item.description?.toLowerCase().includes(search)
    );
  }

  // Paginate to control response size
  const startIndex = (page - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    pagination: { page, pageSize, total: data.length, totalPages: Math.ceil(data.length / pageSize) }
  };
}
```
**Warning:** This is an exception pattern. Always prefer server-side filtering when available.

**Standard Query Pattern:**

```typescript
// src/services/ruckusApiService.ts - Query Pattern
export async function queryYourResource(
  token: string,               // ALWAYS first parameter
  region: string = '',         // ALWAYS this default
  filters: any = {},          // Query-specific parameters
  fields: string[] = ['id', 'name'], // Default fields
  searchString: string = '',
  searchTargetFields: string[] = ['name'],
  page: number = 1,
  pageSize: number = 10,      // Or 10000 for internal tools
  sortField: string = 'name',
  sortOrder: string = 'ASC'
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/query/endpoint`
    : 'https://api.ruckus.cloud/your/query/endpoint';

  const payload = {
    fields,
    searchString,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField,
    sortOrder,
    searchTargetFields
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query operation name');

  return response.data;
}

// src/services/ruckusApiService.ts - Simple GET Pattern
export async function getYourResource(
  token: string,               // ALWAYS first parameter
  resourceId: string,          // Resource identifier
  region: string = ''          // ALWAYS this default
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/resource/${resourceId}`
    : `https://api.ruckus.cloud/your/resource/${resourceId}`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get operation name');

  return response.data;
}
```

### Step 2B: Async Operations Template (Create/Delete/Update operations)
For operations that return `requestId` and need polling:

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

### Step 3A: MCP Registration Template - Read-Only Operations
```typescript
// src/mcpServer.ts - Query operations (like query_directory_server_profiles)
{
  name: 'query_your_resource',
  description: 'Query your resource from RUCKUS One with filtering and pagination support',
  inputSchema: {
    type: 'object',
    properties: {
      filters: { type: 'object', description: 'Optional filters to apply' },
      fields: { type: 'array', items: { type: 'string' }, description: 'Fields to return (default: ["id", "name"])' },
      searchString: { type: 'string', description: 'Search string to filter resources' },
      searchTargetFields: { type: 'array', items: { type: 'string' }, description: 'Fields to search in (default: ["name"])' },
      page: { type: 'number', description: 'Page number (default: 1)' },
      pageSize: { type: 'number', description: 'Number of results per page (default: 10)' },
      sortField: { type: 'string', description: 'Field to sort by (default: "name")' },
      sortOrder: { type: 'string', description: 'Sort order - ASC or DESC (default: "ASC")' }
    },
    required: []
  }
}

// src/mcpServer.ts - Simple GET operations (like get_directory_server_profile)
{
  name: 'get_your_resource',
  description: 'Get detailed information for a specific resource',
  inputSchema: {
    type: 'object',
    properties: {
      resourceId: { type: 'string', description: 'ID of the resource to get' }
    },
    required: ['resourceId']
  }
}
```

### Step 3B: MCP Registration Template - Async Operations
```typescript
// src/mcpServer.ts - Add to tools array (async operations only)
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

### Step 4A: MCP Handler Template - Read-Only Operations
```typescript
// src/mcpServer.ts - Query operations handler
case 'query_your_resource': {
  try {
    const { 
      filters = {},
      fields = ['id', 'name'],
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
    
    const result = await queryYourResource(
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
    
    console.log('[MCP] Query response:', result);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    console.error('[MCP] Error querying resource:', error);
    
    let errorMessage = `Error querying resource: ${error}`;
    
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

// src/mcpServer.ts - Simple GET operations handler
case 'get_your_resource': {
  try {
    const { resourceId } = request.params.arguments as {
      resourceId: string;
    };
    
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );
    
    const result = await getYourResource(
      token,
      resourceId,
      process.env.RUCKUS_REGION
    );
    
    console.log('[MCP] Get response:', result);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    console.error('[MCP] Error getting resource:', error);
    
    let errorMessage = `Error getting resource: ${error}`;
    
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
```

### Step 4B: MCP Handler Template - Async Operations
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

**For Read-Only Operations (Query/GET):**
- **COPY existing read-only patterns**: Use `queryApGroups`, `getRuckusActivityDetails`, `queryAPs` patterns exactly
- **NO retry parameters**: Do not add `maxRetries` or `pollIntervalMs` to read-only operations
- **NO polling logic**: Read-only operations are synchronous and return immediately
- **COPY error handling exactly**: Use existing error handling from similar read-only tools
- **NO additional response fields**: Don't add extra metadata to responses

**For Async Operations (Create/Delete/Update):**
- **NO custom defaults**: Always use `maxRetries = 5`, `pollIntervalMs = 2000`
- **NO custom error handling**: Copy existing error handling exactly
- **NO custom polling logic**: Copy polling loop from existing tool exactly
- **NO additional response fields**: Don't add extra metadata to responses

### Pre-Implementation Checklist
- [ ] **CRITICAL**: Determined operation type (read-only vs async)
- [ ] Identified similar existing tool to copy from (read-only: `queryApGroups`/`getRuckusActivityDetails`, async: `createVenueWithRetry`)
- [ ] Confirmed parameter order matches pattern
- [ ] Confirmed defaults match pattern (read-only: no retry params, async: 5, 2000)
- [ ] Confirmed error handling structure matches
- [ ] Ready to implement following exact template for operation type

**VIOLATION OF THIS PROCESS WILL REQUIRE COMPLETE REWRITE**