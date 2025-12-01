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
  - Implements MCP tools: `get_ruckus_auth_token`, `get_ruckus_venues`, `get_ruckus_activity_details`, `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, `get_ruckus_ap_groups`, `delete_ruckus_ap_group`, `add_ap_to_group`, `remove_ap`, `get_ruckus_aps`, `update_ruckus_ap`, `get_ap_model_antenna_settings`, `get_ap_model_antenna_type_settings`, `query_privilege_groups`, `update_custom_role`, `query_role_features` (with status checking and retry logic for async operations)
  - Implements MCP resources: `ruckus://auth/token`, `ruckus://venues/list`
  - Uses stdio transport for MCP communication
  - **Note**: `update_ruckus_ap` is a consolidated tool that handles AP name changes, venue moves, and AP group changes through optional parameters
- **`src/services/ruckusApiService.ts`**: Comprehensive RUCKUS One API service layer
  - Handles OAuth2 authentication with client credentials grant flow
  - Supports multi-region RUCKUS cloud endpoints
  - Provides venue CRUD operations, AP group creation/deletion/querying, AP addition/removal/querying/movement with retry mechanisms and polling, comprehensive AP management with retrieve-then-update pattern, and role/permission management operations
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
- Async operations (venue create/delete, AP group creation/deletion, AP addition/removal, AP movement) use polling with configurable retry logic
- Activity tracking system monitors long-running operations via requestId
- **Retrieve-Then-Update Pattern (AP Updates)**: AP update operations retrieve current state to preserve specific fields (name, venueId, apGroupId, description) while updating only provided values
- **Retrieve-Then-Update Pattern (Full Config)**: Some operations retrieve full resource configuration to preserve ALL existing fields when updating (see Advanced Patterns section)

### Activity Status Values

The RUCKUS API returns these status values for async operations:
- `'SUCCESS'` - Operation completed successfully
- `'COMPLETED'` - Operation completed (alias for SUCCESS in some endpoints)
- `'FAIL'` - Operation failed
- `'INPROGRESS'` - Operation still running

**Recommended check:**
```typescript
if (activityDetails.status === 'COMPLETED' || activityDetails.status === 'SUCCESS') {
  // Success
} else if (activityDetails.status === 'FAIL') {
  // Failed
}
// Otherwise: still in progress, continue polling
```

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

**Note:** For multi-step operations or complex scenarios, see "Advanced Async Operation Patterns" section below.

### Polling Pattern Flexibility

Two polling patterns exist in the codebase. Both are acceptable:

**Pattern A (while loop):** Used in older functions
```typescript
let retryCount = 0;
while (retryCount < maxRetries) {
  const activityDetails = await getRuckusActivityDetails(token, activityId, region);
  const isCompleted = activityDetails.endDatetime !== undefined;
  if (isCompleted && activityDetails.status === 'SUCCESS') { return { status: 'completed', ... }; }
  if (activityDetails.status === 'FAIL') { return { status: 'failed', ... }; }
  retryCount++;
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}
return { status: 'timeout', ... };
```

**Pattern B (for loop):** Preferred for new code (clearer logging)
```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  console.log(`[RUCKUS] Polling attempt ${attempt}/${maxRetries}...`);
  const activityDetails = await getRuckusActivityDetails(token, activityId, region);
  if (activityDetails.status === 'COMPLETED' || activityDetails.status === 'SUCCESS') { return { status: 'completed', ... }; }
  if (activityDetails.status === 'FAIL') { return { status: 'failed', ... }; }
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}
return { status: 'timeout', ... };
```

**Guideline:** Use Pattern B for new code. Either pattern is acceptable when modifying existing functions.

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

### Step 3C: Tool Description Guidelines for AI Agent Clarity

**CRITICAL**: Tool descriptions must be clear and actionable for AI agents to use tools correctly.

**Description Structure (All Operations):**
1. **Action and Purpose**: Clear statement of what the tool does
2. **PREREQUISITE** (if applicable): Required state/condition with tool reference
3. **REQUIRED**: List all required parameters with tool references for obtaining values
4. **Special Conditions**: Type-specific requirements, warnings, scope clarification

**Template Pattern:**
```
[Action verb] [what it does]. [Additional context]. PREREQUISITE: [condition] (use [tool_name]). REQUIRED: [param1] (use [tool_name] to get [param1]) + [param2] (use [tool_name] to get [param2]). [Special notes].
```

**Examples:**

**Delete Operation:**
```typescript
{
  name: 'delete_wifi_network',
  description: 'Permanently delete a WiFi network from RUCKUS One. This removes the network globally and cannot be undone. PREREQUISITE: Network must be deactivated from all venues first (use deactivate_wifi_network_at_venues). REQUIRED: networkId (use query_wifi_networks to get network ID).',
  // ...
}
```

**Batch Operation:**
```typescript
{
  name: 'activate_wifi_network_at_venues',
  description: 'Activate an existing WiFi network at one or more venues. This is a batch operation that activates the network at specified venues in a single call. The network must already be created using create_wifi_network. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueConfigs array (use get_ruckus_venues to get venue IDs). FOR GUEST PASS NETWORKS: Must provide portalServiceProfileId (use query_portal_service_profiles to get ID). FOR PSK NETWORKS: Do not provide portalServiceProfileId. Can activate at a single venue or multiple venues.',
  // ...
}
```

**Create Operation:**
```typescript
{
  name: 'create_wifi_network',
  description: 'Create a new WiFi network (WLAN/SSID) in RUCKUS One without activating at any venue. The network is created globally and can later be activated at specific venues using activate_wifi_network_at_venues. FOR PSK: Requires passphrase + wlanSecurity=WPA2Personal. FOR GUEST PASS: Requires portalServiceProfileId (use query_portal_service_profiles to get ID) + wlanSecurity=None.',
  // ...
}
```

**Parameter Description Guidelines:**
Every parameter description should include tool references when IDs are required:

```typescript
properties: {
  networkId: {
    type: 'string',
    description: 'ID of the WiFi network to delete (use query_wifi_networks to find network ID)'
  },
  venueIds: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of venue IDs (use get_ruckus_venues to get venue IDs). Can contain one venue or multiple venues.'
  },
  portalServiceProfileId: {
    type: 'string',
    description: 'Portal service profile ID (use query_portal_service_profiles to get ID)'
  },
  apGroups: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of AP group IDs (use get_ruckus_ap_groups to get AP group IDs). Required only if isAllApGroups is false'
  }
}
```

**Common Patterns to Include:**

1. **Destructive Operations**: Add "Permanently" and "cannot be undone" warnings
2. **Prerequisites**: Use "PREREQUISITE:" followed by condition and tool reference
3. **Required Parameters**: Use "REQUIRED:" followed by parameter list with tool references
4. **Type-Specific Logic**: Use "FOR [TYPE]:" to clarify different requirements
5. **Batch vs Single**: Clarify "Can [operation] at a single [item] or multiple [items]"
6. **Usage Hints**: Include common values like "Use 'Both' for most cases"

**Issues to Avoid:**
- ❌ Generic descriptions without tool references: "ID of the network"
- ❌ Missing prerequisites for destructive operations
- ❌ Vague warnings: "should be deactivated" vs "must be deactivated from all venues first"
- ❌ Not mentioning which tools provide required IDs
- ❌ Unclear scope: Not stating if operation is permanent, reversible, single, or batch

**Checklist for Every Tool Description:**
- [ ] Clear action verb and purpose statement
- [ ] PREREQUISITE section if applicable (with tool reference)
- [ ] REQUIRED section with all parameters (with tool references)
- [ ] Type-specific requirements clearly stated (FOR X: / FOR Y:)
- [ ] Scope clarified (single/batch, permanent/reversible, global/venue-specific)
- [ ] All parameter descriptions include tool references for IDs
- [ ] Warnings included for destructive/permanent operations

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
- **Use Advanced Patterns when appropriate**: If operation requires multi-step, conditional steps, type-based logic, or full config preservation, follow patterns in "Advanced Async Operation Patterns" section

### Advanced Async Operation Patterns

These patterns have been identified from real implementations and should be used when appropriate:

#### 1. Conditional Async Steps in Multi-Step Operations

**When to use:** When a multi-step async operation has steps that are conditional based on input parameters or resource type.

**Pattern:**
```typescript
// Step 1: Always execute
const step1Response = await makeRuckusApiCall({...}, 'Step 1');
const step1RequestId = step1Response.data.requestId;

// Step 2: Conditionally execute
let step2RequestId: string | undefined;
if (condition) {
  const step2Response = await makeRuckusApiCall({...}, 'Step 2');
  step2RequestId = step2Response.data.requestId;
}

// Collect all requestIds (conditional step included only if executed)
const requestIds = [
  { id: step1RequestId, name: 'Step 1' },
  ...(step2RequestId ? [{ id: step2RequestId, name: 'Step 2' }] : []),
  { id: step3RequestId, name: 'Step 3' }
];

// Poll all operations (conditional ones included automatically)
```

**Example:** `createWifiNetworkWithRetry` conditionally associates portal service profile for guest networks.

**Key points:**
- Use spread operator with conditional: `...(condition ? [{ id, name }] : [])`
- All conditional requestIds are included in polling array
- Return values should include all requestIds (even undefined ones)

#### 2. Retrieve-Then-Update for Full Config Preservation

**When to use:** When updating a resource requires preserving all existing fields, not just updating specific ones. 

**Difference from AP Update Pattern:**
- **AP Update Pattern** (`updateApWithRetrieval`): Retrieves current state, updates only specific fields (name, venueId, apGroupId, description), preserves other fields implicitly
- **Full Config Pattern**: Retrieves full config, merges with updates using spread operator, preserves ALL fields explicitly

**Pattern:**
```typescript
// Step 0: Retrieve full resource configuration if not provided
let resourceConfig: any;
if (fullConfigProvided) {
  resourceConfig = fullConfigProvided;
} else {
  console.log('[RUCKUS] Retrieving full resource configuration...');
  resourceConfig = await getResource(token, resourceId, region);
}

// Step 1: Merge full config with updates
const updatePayload = {
  ...resourceConfig,
  // Override with new values
  fieldToUpdate: newValue,
  // Preserve all other fields
  id: resourceId
};

const updateResponse = await makeRuckusApiCall({
  method: 'put',
  url: updateUrl,
  data: updatePayload,
  ...
}, 'Update resource');
```

**Example:** `activateWifiNetworkAtVenuesWithRetry` retrieves full network config before updating with venues.

**Key points:**
- Accept optional `fullConfig` parameter for advanced use cases
- Use spread operator to merge: `{ ...resourceConfig, updates }`
- Always include `id` field in update payload
- This preserves ALL existing fields, not just specific ones

#### 3. Optional Payload Pattern (Empty Body Support)

**When to use:** When an API endpoint accepts both empty body (undefined payload) and payload with specific values, and the behavior differs.

**Pattern:**
```typescript
// Use empty payload if both parameters are false (default), otherwise use provided values
const payload = (param1 === false && param2 === false) 
  ? undefined  // Empty body
  : {
      param1,
      param2
    };

const response = await makeRuckusApiCall({
  method: 'put',
  url: apiUrl,
  data: payload,  // undefined = empty body
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}, 'Operation name');
```

**Example:** `updateWifiNetworkRadiusServerProfileSettingsWithRetry` uses empty payload when both `enableAccountingProxy` and `enableAuthProxy` are false.

**Key points:**
- Use `undefined` for empty body (not empty object `{}`)
- Check default values to determine if payload should be empty
- Document when empty body vs payload is used

#### 4. Type-Based Conditional Logic

**When to use:** When different resource types require different API payloads, endpoints, or processing logic.

**Pattern:**
```typescript
// Detect resource type
const resourceType = resourceConfig.type || resourceConfig.nwSubType;
const isSpecialType = resourceType === 'special';

// Build payload conditionally
const payload: any = {
  // Common fields
  name: config.name,
  type: config.type,
  // Type-specific fields
  ...(isSpecialType ? {
    specialField: config.specialField,
    specialConfig: config.specialConfig
  } : {
    standardField: config.standardField
  })
};

// Use different payloads for different types
const apiPayload = isSpecialType 
  ? { enableAuthProxy: true }   // Special type
  : { enableAuthProxy: false }; // Standard type
```

**Example:** Guest pass networks vs PSK networks use different RADIUS payloads (`enableAuthProxy: true` vs `false`).

**Key points:**
- Detect type early in function
- Use conditional spread operators for type-specific fields
- Apply type-specific logic consistently throughout function
- Handle type detection with fallback: `type || nwSubType`

#### 5. Multi-Step Operations with Conditional Steps

**When to use:** When an operation requires multiple async steps, some of which are conditional based on type or parameters.

**Pattern:**
```typescript
// Step 1: Always execute
const step1Response = await makeRuckusApiCall({...}, 'Step 1');
const step1RequestId = step1Response.data.requestId;

// Step 2: Conditionally execute based on type
let step2RequestId: string | undefined;
if (isSpecialType && optionalParam) {
  const step2Response = await makeRuckusApiCall({...}, 'Step 2');
  step2RequestId = step2Response.data.requestId;
}

// Step 3: Always execute
const step3Response = await makeRuckusApiCall({...}, 'Step 3');
const step3RequestId = step3Response.data.requestId;

// Collect all requestIds (conditional steps included only if executed)
const requestIds = [
  { id: step1RequestId, name: 'Step 1' },
  ...(step2RequestId ? [{ id: step2RequestId, name: 'Step 2' }] : []),
  { id: step3RequestId, name: 'Step 3' }
];

// Poll all operations (same polling logic for all)
let retryCount = 0;
const completedActivities: any[] = [];

while (retryCount < maxRetries) {
  const pendingActivities = requestIds.filter(req =>
    !completedActivities.find(c => c.activityId === req.id)
  );
  // ... standard polling logic
}
```

**Example:** `createWifiNetworkWithRetry` does: create + (conditionally) portal association + RADIUS.

**Key points:**
- Combine patterns 1 and 4 (conditional steps + type-based logic)
- Use consistent polling logic for all steps
- Track all requestIds in single array
- Return all requestIds in response (even undefined ones)

#### 6. Type-Based Early Return (Different Flows)

**When to use:** When different resource types require completely different API flows, not just different payloads.

**Pattern:**
```typescript
// Detect resource type
const networkType = networkConfig.type || networkConfig.nwSubType;
const isEnterpriseType = networkType === 'aaa';

// For special type: completely different flow with early return
if (isEnterpriseType) {
  console.log('[RUCKUS] Enterprise type - using simple flow');
  const requestIds: Array<{ id: string; name: string }> = [];

  for (const item of items) {
    const response = await makeRuckusApiCall({...});
    if (response.data.requestId) {
      requestIds.push({ id: response.data.requestId, name: `Operation for ${item}` });
    }
  }

  // Poll and return early
  // ... polling logic ...
  return { status: 'completed', ... };
}

// For standard types: existing multi-step flow (unchanged)
// ... original code ...
```

**Example:** 802.1x activation/deactivation uses 1 API call per venue, while PSK/guest use multi-step flows.

**Key points:**
- Use early return to keep flows separate
- Reuse or duplicate polling logic as needed
- Maintains clean separation of concerns

### Pre-Implementation Checklist
- [ ] **CRITICAL**: Determined operation type (read-only vs async)
- [ ] Identified similar existing tool to copy from (read-only: `queryApGroups`/`getRuckusActivityDetails`, async: `createVenueWithRetry`)
- [ ] Confirmed parameter order matches pattern
- [ ] Confirmed defaults match pattern (read-only: no retry params, async: 5, 2000)
- [ ] Confirmed error handling structure matches
- [ ] **For async operations**: Checked if advanced patterns are needed:
  - [ ] Multi-step operations with conditional steps?
  - [ ] Type-based conditional logic?
  - [ ] Full config preservation required?
  - [ ] Optional payload (empty body) support needed?
  - [ ] Type-based early return (completely different flows)?
- [ ] Ready to implement following exact template for operation type

**VIOLATION OF THIS PROCESS WILL REQUIRE COMPLETE REWRITE**