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

### Additional Documentation
- **`docs/ruckus-api-behavior.md`**: Detailed RUCKUS API behavior documentation
- **`docs/venue-creation-flow.md`**: Step-by-step venue creation process flow

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