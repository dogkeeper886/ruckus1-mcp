# ruckus1-mcp

A Model Context Protocol (MCP) server for RUCKUS One, enabling AI assistants and MCP clients to access RUCKUS venues and authentication via standardized tools and resources.

---

## Features
- **MCP-only**: No REST API, no Express, no HTTP endpoints
- **Tools**: Fetch RUCKUS One venues, get authentication tokens
- **Resources**: Expose venues and tokens as MCP resources
- **Simple configuration**: All credentials and settings in `mcp.json`

---

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- RUCKUS One API credentials

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ruckus1-mcp.git
   cd ruckus1-mcp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your MCP server in `mcp.json`:**
   ```json
   {
     "mcpServers": {
       "ruckus1": {
         "command": "npx",
         "args": [
           "ts-node",
           "YOUR_PATH_TO/src/ruckus1-mcp/src/mcpServer.ts"
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
   - Replace the values with your actual RUCKUS One credentials and adjust the path if needed.

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
1. Use the **Tools** tab to run `get_ruckus_venues` or `get_ruckus_auth_token`.
2. Use the **Resources** tab to view `ruckus://venues/list` or `ruckus://auth/token`.

---

## Project Structure
```
src/
  mcpServer.ts         # Main MCP server implementation
  services/
    ruckusAuthService.ts # RUCKUS One authentication logic
```

---

## Extending
- Add new tools/resources in `src/mcpServer.ts`.
- Add or update business logic in `src/services/`.

---

## License
MIT 