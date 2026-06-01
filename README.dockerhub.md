# ruckus1-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for **RUCKUS One**. It lets MCP-compatible AI assistants (Claude Desktop, Claude Code, Cline, …) manage a RUCKUS One tenant — venues, Wi-Fi networks, access points, and the supporting profiles — through standardized tools.

It is a **stdio** server: there is no long-running daemon and no network port. Your MCP client launches it on demand with `docker run --rm -i`, talks to it over stdin/stdout, and the container exits when the session ends.

## Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release |
| `1.5`, `1.4`, … | Specific release versions |

```bash
docker pull dogkeeper886/ruckus1-mcp:latest
```

## Quick start

You need a RUCKUS One **tenant ID**, **client ID**, and **client secret** (from the RUCKUS One admin console).

### Claude Code (CLI)

```bash
claude mcp add ruckus1 -- docker run --rm -i \
  -e RUCKUS_TENANT_ID=your-tenant-id \
  -e RUCKUS_CLIENT_ID=your-client-id \
  -e RUCKUS_CLIENT_SECRET=your-client-secret \
  -e RUCKUS_REGION=your-region \
  dogkeeper886/ruckus1-mcp:latest
```

### Other MCP clients (`mcp.json`)

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
        "dogkeeper886/ruckus1-mcp:latest"
      ]
    }
  }
}
```

`--rm` removes the container on exit; `-i` keeps stdin open for the MCP stream.

## Configuration

All configuration is via environment variables (`-e`):

| Variable | Required | Description |
|----------|----------|-------------|
| `RUCKUS_TENANT_ID` | yes | RUCKUS One tenant ID |
| `RUCKUS_CLIENT_ID` | yes | OAuth2 client ID |
| `RUCKUS_CLIENT_SECRET` | yes | OAuth2 client secret |
| `RUCKUS_REGION` | no | Regional endpoint (e.g. a region code); leave unset for the global endpoint |

The server uses the OAuth2 client-credentials flow and caches the JWT across calls.

## Capabilities

~70 tools following a uniform `query` / `get` / `create` / `update` / `delete` shape per resource, plus consolidated polling for asynchronous operations. Highlights:

- **Wi-Fi networks (WLANs)** — create/activate/deactivate/delete, including every captive-portal type: Click-Through, Self Sign-In (Email/SMS/WhatsApp OTP), Guest Pass, Host Approval, Cloudpath, WISPr, Directory (AD/LDAP), **SAML IdP**, and Workflow — plus PSK, DPSK, Enterprise 802.1X, and OWE.
- **Service profiles** — RADIUS, Directory (AD/LDAP), Portal, and SAML IdP profiles.
- **Venues & access points** — venues, AP groups, access points, and their radio / band-mode / antenna / client-admission settings.
- **Identity & access** — identity groups, DPSK services, guest passes, SMS provider (Twilio), roles, and privilege groups.
- **Clients & monitoring** — query connected clients; check async activity status.

## Build from source / development

This page covers the published image. To build locally, run from source, contribute, or see the full tool reference and tests, visit the GitHub repository:

➡️ **https://github.com/dogkeeper886/ruckus1-mcp**

## License

MIT
