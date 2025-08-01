# ruckus1-mcp

A Model Context Protocol (MCP) server for RUCKUS One, enabling AI assistants and MCP clients to access RUCKUS venues and authentication via standardized tools and resources.

---

## Features
- **MCP-only**: No REST API, no Express, no HTTP endpoints
- **Tools**: Fetch RUCKUS One venues, get authentication tokens, create venues, manage AP groups
- **Resources**: Expose venues and tokens as MCP resources
- **Simple configuration**: All credentials and settings in `mcp.json`

---

## Installation

### Prerequisites
- Docker (recommended) or Node.js 18+
- RUCKUS One API credentials

### Quick Start (Docker - Recommended)
**Configure your MCP client to use the pre-built Docker image:**
**Option A: Using environment file**
Create a `.env` file:
```bash
# RUCKUS One API credentials
RUCKUS_TENANT_ID=your-tenant-id
RUCKUS_CLIENT_ID=your-client-id
RUCKUS_CLIENT_SECRET=your-client-secret
# e.g. us, eu, ap; leave blank if not needed
RUCKUS_REGION=your-region
```

Add this to your `mcp.json`:
```json
{
  "mcpServers": {
    "ruckus1": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/your/.env",
        "dogkeeper886/ruckus1-mcp"
      ]
    }
  }
}
```

**Option B: Using inline environment variables**
Add this to your `mcp.json`:
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

- Replace `/path/to/your/.env` with the actual path to your environment file (Option A)
- Replace the credential values with your actual RUCKUS One credentials
- The `--rm` flag automatically removes the container when it exits
- The `-i` flag keeps stdin open for MCP communication

### Alternative: From Source
If you prefer to run from source code:

1. **Clone and install:**
   ```bash
   git clone https://github.com/your-username/ruckus1-mcp.git
   cd ruckus1-mcp
   npm install
   ```

2. **Configure your MCP server in `mcp.json`:**
   ```json
   {
     "mcpServers": {
       "ruckus1": {
         "command": "npx",
         "args": [
           "ts-node",
           "YOUR_PATH_TO/ruckus1-mcp/src/mcpServer.ts"
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

## Using with MCP Inspector

### 1. Launch Inspector
Run this command in your project directory:
```bash
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

### 2. Configure Inspector (after browser opens)
- **Command:** `npx`
- **Arguments:** `ts-node src/mcpServer.ts`
- **Environment variables:**
  - `RUCKUS_TENANT_ID`
  - `RUCKUS_CLIENT_ID`
  - `RUCKUS_CLIENT_SECRET`
  - `RUCKUS_REGION`
- Click **Connect**

### 3. Use Inspector
1. Use the **Tools** tab to run `get_ruckus_venues`, `get_ruckus_auth_token`, or `create_ruckus_venue`.
2. Use the **Resources** tab to view `ruckus://venues/list` or `ruckus://auth/token`.

---

## Project Structure
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