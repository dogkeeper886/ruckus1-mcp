# ruckus1-mcp

A dual-server architecture providing both REST API and MCP (Model Context Protocol) access to RUCKUS One services.

## Architecture Overview

This project consists of two servers:

1. **Express API Server** (`src/server.ts`) - Traditional REST API on port 3000
2. **MCP Server** (`src/mcpServer.ts`) - Model Context Protocol server for AI assistant integration

The MCP server wraps the Express API functionality, providing tools and resources that AI assistants can use.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file (see `.env.example` for example).
3. Build the project:
   ```
   npm run build
   ```

## Usage

### Express API Server (REST API)

**Start the Express server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

**Available Endpoints:**

| Endpoint                | Method | Description                        |
|-------------------------|--------|------------------------------------|
| `/`                     | GET    | Health check                       |
| `/ruckus-auth/token`    | GET    | Get RUCKUS One JWT token           |
| `/venues`               | GET    | Get list of venues from RUCKUS One |

**Example Requests:**
```bash
# Health Check
curl http://localhost:3000/

# Get RUCKUS One Auth Token
curl http://localhost:3000/ruckus-auth/token

# Get Venues
curl http://localhost:3000/venues
```

### MCP Server (AI Assistant Integration)

**Start the MCP server:**
```bash
npm run mcp
```

**Available Tools:**
- `get_ruckus_auth_token` - Get a JWT token for RUCKUS One authentication
- `get_ruckus_venues` - Get a list of venues from RUCKUS One

**Available Resources:**
- `ruckus://auth/token` - Current RUCKUS One JWT token
- `ruckus://venues/list` - List of venues from RUCKUS One

## Testing with MCP Inspector

1. **Start the Express API server:**
   ```bash
   npm run dev
   ```

2. **Launch MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector node dist/mcpServer.js
   ```

3. **Configure Inspector:**
   - Transport Type: `stdio`
   - Command: `node`
   - Arguments: `dist/mcpServer.js`

4. **Test your MCP server:**
   - Use the **Tools** tab to test `get_ruckus_auth_token` and `get_ruckus_venues`
   - Use the **Resources** tab to view `ruckus://auth/token` and `ruckus://venues/list`
   - Monitor the **Notifications** pane for logs and errors

## Development Workflow

### For Express API Development:
1. Make changes to routes in `src/routes/`
2. Add service logic in `src/services/`
3. Test with `curl` or Postman
4. Restart server: `npm run dev`

### For MCP Server Development:
1. Make changes to `src/mcpServer.ts`
2. Build: `npm run build`
3. Test with MCP Inspector
4. Restart MCP server in Inspector

### For Shared Logic:
- Add business logic to `src/services/`
- Both servers can import and use the same services
- Ensures consistency between REST API and MCP tools

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Express server entry point
├── mcpServer.ts        # MCP server implementation
├── routes/             # Express API routes
│   ├── ruckusAuth.ts
│   └── ruckusVenues.ts
└── services/           # Shared business logic
    ├── ruckusAuthService.ts
    └── ruckusVenuesService.ts
```

## Environment Variables

Create a `.env` file with your RUCKUS One credentials:
```
RUCKUS_CLIENT_ID=your_client_id
RUCKUS_CLIENT_SECRET=your_client_secret
RUCKUS_BASE_URL=https://api.ruckuswireless.com
```

## Extending

### Adding New Express API Endpoints:
1. Create route file in `src/routes/`
2. Add service logic in `src/services/`
3. Register route in `src/app.ts`

### Adding New MCP Tools:
1. Add tool definition in `ListToolsRequestSchema` handler
2. Add tool implementation in `CallToolRequestSchema` handler
3. Optionally add corresponding resource in `ListResourcesRequestSchema`

### Adding New MCP Resources:
1. Add resource definition in `ListResourcesRequestSchema` handler
2. Add resource implementation in `ReadResourceRequestSchema` handler

## Notes

- The Express server handles all RUCKUS One authentication and API calls
- The MCP server provides a standardized interface for AI assistants
- Both servers can be deployed independently
- No authentication is required to call your endpoints (unless you add it) 