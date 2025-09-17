# ruckus1-mcp

A Model Context Protocol (MCP) server for RUCKUS One, enabling AI assistants and MCP clients to access RUCKUS venues and authentication via standardized tools and resources.

---

## Features
- **MCP-only**: No REST API, no Express, no HTTP endpoints
- **Tools**: Fetch RUCKUS One venues, get authentication tokens, create venues, manage AP groups
- **Simple configuration**: All credentials and settings in `mcp.json`

---

## Quick Start

### Prerequisites
- RUCKUS One API credentials (tenant ID, client ID, client secret)
- An MCP client (e.g., Claude Desktop, Cline, or other MCP-compatible client)
- Docker (recommended) or Node.js 18+

### Option 1: Using Docker (Recommended)

1. **Pull or build the Docker image:**
   ```bash
   # Clone and build locally
   git clone https://github.com/your-username/ruckus1-mcp.git
   cd ruckus1-mcp
   docker build -t ruckus1-mcp .
   ```

2. **Configure your MCP client:**

   **For Claude Code CLI:**
   ```bash
   claude mcp add ruckus1 -- docker run --rm -i \
     -e RUCKUS_TENANT_ID=your-tenant-id \
     -e RUCKUS_CLIENT_ID=your-client-id \
     -e RUCKUS_CLIENT_SECRET=your-client-secret \
     -e RUCKUS_REGION=your-region \
     dogkeeper886/ruckus1-mcp
   ```

   **For other MCP clients (mcp.json):**
   ```json
   {
     "mcpServers": {
       "ruckus1": {
         "command": "docker",
         "args": [
           "run", "--rm", "-i",
           "-e", "RUCKUS_TENANT_ID=your-tenant-id",
           "-e", "RUCKUS_CLIENT_ID=your-client-id",
           "-e", "RUCKUS_CLIENT_SECRET=your-client-secret",
           "-e", "RUCKUS_REGION=your-region",
           "dogkeeper886/ruckus1-mcp"
         ]
       }
     }
   }
   ```

   - Replace the credential values with your actual RUCKUS One credentials
   - The `--rm` flag automatically removes the container when it exits
   - The `-i` flag keeps stdin open for MCP communication

### Option 2: Running from Source

1. **Clone and install:**
   ```bash
   git clone https://github.com/your-username/ruckus1-mcp.git
   cd ruckus1-mcp
   npm install
   ```

2. **Configure your MCP client:**

   **For Claude Code CLI:**
   ```bash
   claude mcp add ruckus1 \
     -e RUCKUS_TENANT_ID=your-tenant-id \
     -e RUCKUS_CLIENT_ID=your-client-id \
     -e RUCKUS_CLIENT_SECRET=your-client-secret \
     -e RUCKUS_REGION=your-region \
     -- npx ts-node /absolute/path/to/ruckus1-mcp/src/mcpServer.ts
   ```

   **For other MCP clients:**
   Add this to your MCP client's `mcp.json`:
   ```json
   {
     "mcpServers": {
       "ruckus1": {
         "command": "npx",
         "args": [
           "ts-node",
           "/absolute/path/to/ruckus1-mcp/src/mcpServer.ts"
         ],
         "env": {
           "RUCKUS_TENANT_ID": "your-tenant-id",
           "RUCKUS_CLIENT_ID": "your-client-id",
           "RUCKUS_CLIENT_SECRET": "your-client-secret",
           "RUCKUS_REGION": "your-region"
         }
       }
     }
   }
   ```

---

## Available MCP Tools

Once configured, your MCP client will have access to these tools:

- `get_ruckus_auth_token` - Get JWT authentication token
- `get_ruckus_venues` - List all venues
- `get_ruckus_activity_details` - Check status of async operations
- `create_ruckus_venue` - Create a new venue with automatic status checking
- `delete_ruckus_venue` - Delete a venue with automatic status checking
- `create_ruckus_ap_group` - Create AP groups in venues
- `get_ruckus_ap_groups` - Query AP groups with filtering
- `delete_ruckus_ap_group` - Delete AP groups from venues
- `get_ap_model_antenna_settings` - Get AP model external antenna settings for a venue
- `get_ap_model_antenna_type_settings` - Get AP model antenna type settings for a venue
- `get_ruckus_aps` - Query access points with filtering, search, and pagination

---

## Development

### Testing with MCP Inspector

For development and testing, you can use the MCP Inspector:

```bash
# From the project directory
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

Then configure the Inspector with your RUCKUS credentials and test the tools.

### Project Structure
```
src/
  mcpServer.ts         # Main MCP server implementation
  services/
    ruckusApiService.ts # RUCKUS One API service layer
    tokenService.ts     # Token management service
  types/
    ruckusApi.ts        # TypeScript type definitions
  utils/
    config.ts           # Configuration utilities
    errorHandler.ts     # Error handling utilities
    tokenCache.ts       # Token caching utilities
    validation.ts       # Input validation utilities

scripts/
  chunk-api-docs.js     # Script to chunk large API documentation files
  scrape-ruckus-api-docs.js # Script to scrape RUCKUS API documentation
```

---

## Extending
- Add new tools/resources in `src/mcpServer.ts`.
- Add or update business logic in `src/services/`.

---

## License
MIT 