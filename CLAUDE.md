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
  - Implements MCP tools: `get_ruckus_auth_token`, `get_ruckus_venues`, `get_ruckus_activity_details`, `create_ruckus_venue`, `delete_ruckus_venue`, `create_ruckus_ap_group`, `get_ruckus_ap_groups`, `delete_ruckus_ap_group` (with status checking and retry logic)
  - Implements MCP resources: `ruckus://auth/token`, `ruckus://venues/list`
  - Uses stdio transport for MCP communication
- **`src/services/ruckusApiService.ts`**: Comprehensive RUCKUS One API service layer
  - Handles OAuth2 authentication with client credentials grant flow
  - Supports multi-region RUCKUS cloud endpoints
  - Provides venue CRUD operations and AP group creation/deletion/querying with retry mechanisms and polling
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

**Current Status**: 8 MCP tools implemented (auth, venues, activities, AP groups)
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

### Additional Documentation
- **`docs/ruckus-api-behavior.md`**: Detailed RUCKUS API behavior documentation
- **`docs/venue-creation-flow.md`**: Step-by-step venue creation process flow
- **`scripts/api-reference/`**: Complete API reference documentation (1,267 endpoints)

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