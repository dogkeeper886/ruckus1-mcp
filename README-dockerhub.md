# RUCKUS One MCP Server

A Model Context Protocol (MCP) server for RUCKUS One network management, enabling AI assistants and MCP clients to access RUCKUS venues, authentication, and AP groups via standardized tools and resources.

## Quick Start

### Prerequisites
- Docker
- RUCKUS One API credentials (tenant ID, client ID, client secret)
- MCP client (like Claude Desktop)

### Configuration

**Option A: Using environment file**

Create a `.env` file with your RUCKUS credentials:
```bash
RUCKUS_TENANT_ID=your-tenant-id
RUCKUS_CLIENT_ID=your-client-id
RUCKUS_CLIENT_SECRET=your-client-secret
RUCKUS_REGION=your-region
```

Add to your MCP client's `mcp.json`:
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

**Option B: Inline environment variables**

Add to your MCP client's `mcp.json`:
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

## Available Tools

- `get_ruckus_auth_token` - Get OAuth2 authentication token
- `get_ruckus_venues` - List all venues with pagination support
- `get_ruckus_activity_details` - Track async operation status
- `create_ruckus_venue` - Create new venues with validation
- `delete_ruckus_venue` - Delete existing venues
- `create_ruckus_ap_group` - Create AP groups
- `get_ruckus_ap_groups` - List AP groups
- `delete_ruckus_ap_group` - Delete AP groups

## Available Resources

- `ruckus://venues/list` - Venue listing resource
- `ruckus://auth/token` - Authentication token resource

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RUCKUS_TENANT_ID` | Yes | Your RUCKUS One tenant ID | `12345678-1234-1234-1234-123456789012` |
| `RUCKUS_CLIENT_ID` | Yes | OAuth2 client ID | `your-client-id` |
| `RUCKUS_CLIENT_SECRET` | Yes | OAuth2 client secret | `your-client-secret` |
| `RUCKUS_REGION` | No | RUCKUS cloud region | `us`, `eu`, `ap` (default: global) |

## Features

- **Pure MCP Implementation** - No REST API, designed specifically for MCP clients
- **OAuth2 Authentication** - Secure token-based authentication with automatic refresh
- **Multi-Region Support** - Works with US, EU, AP, and global RUCKUS cloud endpoints
- **Async Operation Tracking** - Polls and monitors long-running operations
- **Comprehensive Error Handling** - Structured error responses with detailed messages
- **Venue Management** - Full CRUD operations for RUCKUS venues
- **AP Group Management** - Create, list, and delete AP groups

## Support

- **GitHub Repository**: [ruckus1-mcp](https://github.com/dogkeeper886/ruckus1-mcp)
- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Full API documentation available in the repository

## License

MIT License - see repository for details.