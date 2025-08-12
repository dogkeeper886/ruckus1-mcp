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
  - Implements MCP tools: `get_ruckus_auth_token`, `get_ruckus_venues`, `get_ruckus_activity_details`, `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, `get_ruckus_ap_groups`, `delete_ruckus_ap_group`, `get_ap_model_antenna_settings`, `get_ruckus_aps` (with status checking and retry logic for async operations)
  - Implements MCP resources: `ruckus://auth/token`, `ruckus://venues/list`
  - Uses stdio transport for MCP communication
- **`src/services/ruckusApiService.ts`**: Comprehensive RUCKUS One API service layer
  - Handles OAuth2 authentication with client credentials grant flow
  - Supports multi-region RUCKUS cloud endpoints
  - Provides venue CRUD operations, AP group creation/deletion/querying, and AP querying with retry mechanisms and polling
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
- Async operations (venue create/delete, AP group creation/deletion) use polling with configurable retry logic
- Activity tracking system monitors long-running operations via requestId

### MCP Tool Development Rules
**IMPORTANT**: When adding new MCP tools for operations that create, edit/update, or delete resources:
- **ALWAYS implement activity detail checking** for async operations
- **Use polling mechanism** with configurable retry logic (see existing `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, and `delete_ruckus_ap_group` implementations)
- **Include `get_ruckus_activity_details` functionality** to track operation status
- **Follow the established pattern** of returning requestId and monitoring completion status
- **Implement proper error handling** for failed operations during polling
- **UPDATE DOCUMENTATION**: When adding new tools, ensure all MCP server-related documentation is updated:
  - Update tool list in `src/mcpServer.ts` comments
  - Update this CLAUDE.md file's Core Components section
  - Announce new tools in relevant documentation files

### API Integration Plan

**Current Status**: 10 MCP tools implemented (auth, venues, activities, AP groups, AP antenna settings, APs query)
**API Scope**: 1,267 endpoints across 112 categories available for integration

#### Phase 1: Core Infrastructure & High-Priority APIs (Immediate)
**Priority Categories**:
1. **APS** (4 endpoints) - Access Point management
2. **CLIENTS** (2 endpoints) - Client device management  
3. **WIFINETWORKS** (43 endpoints) - WiFi network configuration
4. **ALARMS** (3 endpoints) - System monitoring
5. **EVENTS** (6 endpoints) - Event management

**Rationale**: Core network management functions used most frequently.

#### Phase 2: Network Operations & Security (Short-term)
**Priority Categories**:
1. **SWITCHES** (68 endpoints) - Network switch management
2. **NETWORKS** (8 endpoints) - Network configuration
3. **RADIUSPROFILES** (2 endpoints) - Authentication
4. **ACCESSCONTROLPROFILES** (15 endpoints) - Security policies
5. **DEVICEPOLICIES** (7 endpoints) - Device security

#### Phase 3: Advanced Features & Management (Medium-term)
**Priority Categories**:
1. **TEMPLATES** (35 endpoints) - Configuration templates
2. **ADMINS** (6 endpoints) - Admin management
3. **IDENTITIES** (3 endpoints) - User identity management
4. **CERTIFICATES** (7 endpoints) - Certificate management
5. **WORKFLOWS** (23 endpoints) - Automation workflows

#### Phase 4: Specialized & MSP Features (Long-term)
**Lower Priority Categories**:
- MSP-related APIs (MSPS, MSPCUSTOMERS, etc.)
- Specialized profiles (HOTSPOT20, WIFICALLINGSERVICEPROFILES)
- Advanced configuration profiles

#### Implementation Strategy
1. **Start with read-only operations** (GET endpoints) for each category
2. **Add create/update/delete operations** with proper async handling
3. **Implement in small batches** (5-10 endpoints at a time)
4. **Test thoroughly** before moving to next batch

**Recommended Starting Point**: Begin with **APS** category (4 endpoints) as it's essential and manageable.

## MCP Tool Development Guidelines

### Adding New MCP Tools - Step-by-Step Process

When adding new MCP tools to this server, follow this standardized process to ensure consistency and reliability:

#### Step 1: Service Function Implementation
1. **Add to `src/services/ruckusApiService.ts`**:
   ```typescript
   export async function yourNewFunction(
     token: string,        // Always first parameter
     ...requiredParams,    // Required business parameters
     region: string = '',  // Region parameter
     maxRetries = 5,      // Configurable retry count
     pollIntervalMs = 2000 // Configurable polling interval
   ): Promise<any> {
     // Implementation
   }
   ```

2. **Use consistent URL construction**:
   ```typescript
   const apiUrl = region && region.trim() !== ''
     ? `https://api.${region}.ruckus.cloud/your/endpoint`
     : `https://api.ruckus.cloud/your/endpoint`;
   ```

3. **Use `makeRuckusApiCall` helper**:
   ```typescript
   const response = await makeRuckusApiCall({
     method: 'post', // or 'get', 'put', 'delete'
     url: apiUrl,
     data: payload,
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   }, 'Operation Name');
   ```

#### Step 2: MCP Tool Registration
1. **Add tool definition to `src/mcpServer.ts`** in the `tools` array:
   ```typescript
   {
     name: 'your_new_tool',
     description: 'Clear description of what this tool does',
     inputSchema: {
       type: 'object',
       properties: {
         // Define all parameters with proper types and descriptions
       },
       required: ['required_param1', 'required_param2']
     }
   }
   ```

2. **Add tool handler** in the switch statement:
   ```typescript
   case 'your_new_tool': {
     try {
       const { param1, param2, ...options } = request.params.arguments;
       
       const token = await getRuckusJwtToken(
         process.env.RUCKUS_TENANT_ID!,
         process.env.RUCKUS_CLIENT_ID!,
         process.env.RUCKUS_CLIENT_SECRET!,
         process.env.RUCKUS_REGION
       );
       
       const result = await yourNewFunction(
         token,
         param1,
         param2,
         process.env.RUCKUS_REGION,
         maxRetries,
         pollIntervalMs
       );
       
       return {
         content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
       };
     } catch (error: any) {
       // Standard error handling
       return {
         content: [{ type: 'text', text: `Error: ${error.message}` }],
         isError: true
       };
     }
   }
   ```

#### Step 3: Testing and Validation
1. **Test with different regions** (especially `dev` region for development)
2. **Verify async operations** use proper polling mechanisms
3. **Test error scenarios** (404, authentication failures, etc.)
4. **Update documentation** - add tool to list in this file

### Common Issues and Solutions

#### Issue: 404 "Resource not found" errors
**Symptoms**: Tool fails with 404 even when resources exist
**Root Causes**:
1. **Wrong API endpoint structure** - Compare with working tools like `createApGroupWithRetry`
2. **Missing region configuration** - Ensure `RUCKUS_REGION` environment variable is set
3. **Incorrect URL construction** - Some endpoints don't use `/api/v1` prefix
4. **Authentication token issues** - Verify token is passed correctly

**Solution Process**:
1. Compare API URL structure with working tools
2. Check network inspector in RUCKUS One web console to see actual working API calls
3. Ensure region parameter is properly passed and used
4. Use `makeRuckusApiCall` helper instead of direct axios calls

#### Issue: Async operations not completing
**Symptoms**: Operations timeout or return incomplete status
**Root Cause**: Incorrect activity polling logic
**Solution**: Follow established patterns in `createVenueWithRetry` and `createApGroupWithRetry`

### Additional Documentation
- **`scripts/api-reference/`**: Complete API reference documentation (1,267 endpoints)

## RUCKUS One API Behavior and Implementation Details

### Authentication
- **Endpoint**: `https://{region}.ruckus.cloud/oauth2/token/{tenantId}`
- **Method**: POST
- **Grant Type**: `client_credentials`
- **Response**: JWT token in `access_token` field
- **Regional Support**: Token endpoint supports regional subdomains

### API Endpoint Patterns
- **Global**: `https://api.ruckus.cloud/`
- **Regional**: `https://api.{region}.ruckus.cloud/`
- **Common regions**: `dev`, `us`, `eu`, `ap`
- **URL Structure Variations**: 
  - Most endpoints: `/venues/{venueId}/...`
  - Some endpoints: `/api/v1/venues/{venueId}/...`
  - Query endpoints: `/venues/aps/query`

### Async Operation Handling

#### Key Principles
1. **Always Async**: Create, update, delete operations are asynchronous
2. **RequestId Always Present**: Both successful and failed operations return `requestId`
3. **Activity Tracking**: Use `get_ruckus_activity_details` to monitor progress
4. **Completion Detection**: Check `endDatetime` field presence, not just status

#### Standard Async Flow
```typescript
// 1. Make initial API call
const response = await makeRuckusApiCall(...);
const activityId = response.data.requestId;

// 2. Poll for completion
while (retryCount < maxRetries) {
  const activityDetails = await getRuckusActivityDetails(activityId, token, region);
  
  // 3. Check completion (key: use endDatetime field)
  const isCompleted = activityDetails.endDatetime !== undefined;
  
  if (isCompleted) {
    if (activityDetails.status === 'SUCCESS') {
      return { status: 'completed', ... };
    } else {
      return { status: 'failed', ... };
    }
  }
  
  // 4. Wait and retry
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  retryCount++;
}
```

#### Activity Status Values
- **`INPROGRESS`**: Operation still running
- **`SUCCESS`**: Operation completed successfully  
- **`FAILED`**: Operation failed
- **Other values**: Various failure states

#### Polling Strategy
- **Initial Delay**: Start polling immediately
- **Poll Interval**: 2 seconds (2000ms)
- **Max Retries**: 5-10 attempts
- **Timeout**: Operations typically complete within 10-20 seconds

### Error Handling Patterns

#### HTTP Status Codes
- **202 Accepted**: Operation initiated successfully
- **400 Bad Request**: Validation errors (still returns requestId)
- **401/403**: Authentication/authorization errors
- **404 Not Found**: Resource or endpoint doesn't exist
- **409 Conflict**: Resource conflict (e.g., AP already in target group)
- **429**: Rate limiting (not tested)
- **5xx**: Server errors

#### Error Response Structure
```json
{
  "timestamp": "2025-08-12T11:11:42.622+00:00",
  "path": "/api/v1/venues/...",
  "status": 404,
  "error": "Not Found", 
  "message": null,
  "requestId": "b760d632-136996",
  "errors": [
    {
      "code": "RCG-10016",
      "message": "The requested endpoint was not found."
    }
  ]
}
```

### Venue Creation Implementation Details

#### Request Payload Structure
```json
{
  "name": "Venue Name",
  "address": {
    "addressLine": "Street Address or City Name",
    "city": "City",
    "country": "Country Code",
    "latitude": 37.4220094,      // Optional
    "longitude": -122.0847516,   // Optional
    "timezone": "America/Los_Angeles"  // Optional
  }
}
```

#### Response Examples

**Success Response (HTTP 202)**:
```json
{
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "response": {
    "id": "45ae93a7e9034e4388681eeaf58fe831",
    "name": "Test Venue",
    "address": { ... },
    "isTemplate": false,
    "isEnforced": false
  }
}
```

**Error Response (HTTP 400)**:
```json
{
  "requestId": "2efb45d4-cbc6-4185-a178-9f1f377f5de7",
  "errors": [
    {
      "object": "VENUE-10001.message",
      "value": "Country code is not supported by AP firmware!",
      "code": "VENUE-10001.message", 
      "message": "Country code is not supported by AP firmware!",
      "reason": "Provide a valid attribute"
    }
  ]
}
```

### Activity Details API Structure

#### Endpoint
- **URL**: `https://api.{region}.ruckus.cloud/activities/{activityId}`
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`

#### Response Examples

**In Progress Activity**:
```json
{
  "tenantId": "1a504b89c85f4dbc8a485e7498240510",
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "status": "INPROGRESS",
  "useCase": "AddVenue",
  "startDatetime": "2025-07-17T08:51:57Z",
  "steps": [
    {
      "id": "AddVenue",
      "description": "AddVenue", 
      "status": "SUCCESS",
      "progressType": "REQUEST",
      "startDatetime": "2025-07-17T08:51:57Z",
      "endDatetime": "2025-07-17T08:51:57Z"
    }
  ]
}
```

**Completed Activity**:
```json
{
  "tenantId": "1a504b89c85f4dbc8a485e7498240510",
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456", 
  "status": "SUCCESS",
  "useCase": "AddVenue",
  "startDatetime": "2025-07-17T08:51:57Z",
  "endDatetime": "2025-07-17T08:51:57Z",  // Key completion indicator
  "steps": [ ... ]
}
```

### Venue Creation Validation Rules
**IMPORTANT**: Country and address are validated by the RUCKUS One API. Invalid combinations will cause venue creation to fail.

**Best Practices**:
- **Use city name as address** for reliability (e.g., `"addressLine": "Paris"` instead of `"addressLine": "123 Rue de la Paix"`)
- **Use the country where the city is actually located** (e.g., `"city": "Paris", "country": "France"`)
- Always test with simple, well-known city/country combinations
- Use major cities to avoid validation issues

**Example Valid Venue Creation**:
```json
{
  "name": "Test Venue",
  "addressLine": "Tokyo",
  "city": "Tokyo", 
  "country": "Japan"
}
```

## Removed Tools

The following tools were removed due to API endpoint compatibility issues:

### move_ap_to_group (Removed 2025-08-12)
- **Issue**: HTTP 404 "Resource not found" errors despite correct implementation pattern
- **Root Cause**: API endpoint `/venues/{venueId}/apGroups/{apGroupId}/aps/{serialNumber}` not accessible via OAuth2 client credentials
- **Alternative**: Manual AP movement via RUCKUS One web console remains functional
- **Future**: May be reimplemented when correct API pattern is identified

### get_ap_external_antenna_settings (Removed 2025-08-12) 
- **Issue**: HTTP 404 "The requested endpoint was not found" (RCG-10016)
- **Root Cause**: API endpoint `/venues/{venueId}/aps/{serialNumber}/externalAntennaSettings` does not exist
- **Alternative**: Use `get_ap_model_antenna_settings` for venue-level antenna configuration
- **Future**: Requires verification of correct AP-specific antenna settings endpoint