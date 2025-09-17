# RUCKUS1-MCP Deployment Guide

## Overview

This guide covers deployment options, configuration, and setup for the RUCKUS1-MCP server. The server is designed to run as a Model Context Protocol (MCP) server and can be deployed using Docker or directly from source.

## Prerequisites

### Required Credentials

Before deploying, ensure you have the following RUCKUS One API credentials:

- **RUCKUS_TENANT_ID**: Your RUCKUS One tenant identifier
- **RUCKUS_CLIENT_ID**: OAuth2 client ID for API access
- **RUCKUS_CLIENT_SECRET**: OAuth2 client secret for API access
- **RUCKUS_REGION**: RUCKUS cloud region (optional, defaults to global)

### MCP Client Requirements

- An MCP-compatible client (Claude Desktop, Cline, or other MCP clients)
- Node.js 18+ (if running from source)
- Docker (if using containerized deployment)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

Docker deployment is the recommended approach for production use due to its consistency, security, and ease of management.

#### Using Pre-built Image

```bash
# Pull and run the pre-built image
docker run --rm -i \
  -e RUCKUS_TENANT_ID=your-tenant-id \
  -e RUCKUS_CLIENT_ID=your-client-id \
  -e RUCKUS_CLIENT_SECRET=your-client-secret \
  -e RUCKUS_REGION=your-region \
  dogkeeper886/ruckus1-mcp
```

#### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/ruckus1-mcp.git
cd ruckus1-mcp

# Build the Docker image
docker build -t ruckus1-mcp .

# Run the container
docker run --rm -i \
  -e RUCKUS_TENANT_ID=your-tenant-id \
  -e RUCKUS_CLIENT_ID=your-client-id \
  -e RUCKUS_CLIENT_SECRET=your-client-secret \
  -e RUCKUS_REGION=your-region \
  ruckus1-mcp
```

#### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  ruckus1-mcp:
    image: dogkeeper886/ruckus1-mcp
    environment:
      - RUCKUS_TENANT_ID=${RUCKUS_TENANT_ID}
      - RUCKUS_CLIENT_ID=${RUCKUS_CLIENT_ID}
      - RUCKUS_CLIENT_SECRET=${RUCKUS_CLIENT_SECRET}
      - RUCKUS_REGION=${RUCKUS_REGION:-global}
    stdin_open: true
    tty: true
```

Run with:
```bash
docker-compose up
```

### Option 2: Source Deployment

#### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

#### Installation Steps

```bash
# Clone the repository
git clone https://github.com/your-username/ruckus1-mcp.git
cd ruckus1-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Set environment variables
export RUCKUS_TENANT_ID=your-tenant-id
export RUCKUS_CLIENT_ID=your-client-id
export RUCKUS_CLIENT_SECRET=your-client-secret
export RUCKUS_REGION=your-region

# Run the server
npm start
```

#### Development Mode

For development and testing:

```bash
# Install dependencies
npm install

# Run in development mode with ts-node
npm run dev
```

## MCP Client Configuration

### Claude Desktop Configuration

Add the following to your Claude Desktop `mcp.json` configuration file:

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

### Cline Configuration

For Cline or other MCP clients, use similar configuration:

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

### Claude Code CLI Configuration

```bash
# Add MCP server to Claude Code CLI
claude mcp add ruckus1 -- docker run --rm -i \
  -e RUCKUS_TENANT_ID=your-tenant-id \
  -e RUCKUS_CLIENT_ID=your-client-id \
  -e RUCKUS_CLIENT_SECRET=your-client-secret \
  -e RUCKUS_REGION=your-region \
  dogkeeper886/ruckus1-mcp
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RUCKUS_TENANT_ID` | RUCKUS One tenant identifier | `abc123-def456-ghi789` |
| `RUCKUS_CLIENT_ID` | OAuth2 client ID | `client_123456789` |
| `RUCKUS_CLIENT_SECRET` | OAuth2 client secret | `secret_abcdef123456` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `RUCKUS_REGION` | RUCKUS cloud region | `global` | `dev`, `us`, `eu` |

### Environment File

Create a `.env` file for local development:

```bash
# .env
RUCKUS_TENANT_ID=your-tenant-id
RUCKUS_CLIENT_ID=your-client-id
RUCKUS_CLIENT_SECRET=your-client-secret
RUCKUS_REGION=global
```

## Security Considerations

### Credential Management

- **Never commit credentials to version control**
- Use environment variables or secure secret management systems
- Rotate credentials regularly
- Use least-privilege access principles

### Docker Security

The Docker image includes security best practices:

- Non-root user execution (`nodejs` user)
- Minimal Alpine Linux base image
- No unnecessary packages or services
- Read-only filesystem where possible

### Network Security

- The MCP server communicates via stdio (no network ports)
- All API communication uses HTTPS
- JWT tokens are handled securely in memory

## Monitoring and Logging

### Logging Configuration

The server logs to stderr to avoid interfering with MCP stdio communication:

```bash
# View logs in Docker
docker logs <container-id>

# View logs in development
npm run dev 2> logs/error.log
```

### Health Monitoring

Monitor the following metrics:

- Authentication success/failure rates
- API response times
- Async operation completion rates
- Error rates and types

### Log Levels

- **INFO**: Normal operation messages
- **ERROR**: Error conditions and failures
- **DEBUG**: Detailed operation information (development only)

## Performance Tuning

### Docker Resource Limits

```yaml
# docker-compose.yml
services:
  ruckus1-mcp:
    image: dogkeeper886/ruckus1-mcp
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Environment-Specific Tuning

#### Development
```bash
# Faster polling for development
export RUCKUS_POLL_INTERVAL_MS=1000
export RUCKUS_MAX_RETRIES=3
```

#### Production
```bash
# Conservative settings for production
export RUCKUS_POLL_INTERVAL_MS=2000
export RUCKUS_MAX_RETRIES=5
```

## Troubleshooting

### Common Issues

#### Authentication Failures

```bash
# Check credentials
echo $RUCKUS_TENANT_ID
echo $RUCKUS_CLIENT_ID
echo $RUCKUS_CLIENT_SECRET

# Test authentication
curl -X POST "https://${RUCKUS_REGION}.ruckus.cloud/oauth2/token/${RUCKUS_TENANT_ID}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${RUCKUS_CLIENT_ID}&client_secret=${RUCKUS_CLIENT_SECRET}"
```

#### MCP Connection Issues

1. Verify MCP client configuration
2. Check that the server is running
3. Ensure stdio communication is working
4. Review MCP client logs

#### API Rate Limiting

- Implement client-side retry logic
- Use appropriate polling intervals
- Monitor API usage patterns

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=ruckus1-mcp:*

# Run with debug output
npm run dev
```

### Testing Deployment

Use the MCP Inspector for testing:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run inspector
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

## Scaling and High Availability

### Horizontal Scaling

- Deploy multiple MCP server instances
- Use load balancing at the MCP client level
- Implement connection pooling for high-volume operations

### Vertical Scaling

- Increase memory allocation for large datasets
- Optimize polling intervals based on operation volume
- Use faster CPU for compute-intensive operations

### Backup and Recovery

- Backup MCP client configurations
- Document environment variable values
- Implement credential rotation procedures

## Maintenance

### Regular Updates

```bash
# Update Docker image
docker pull dogkeeper886/ruckus1-mcp:latest

# Update from source
git pull origin main
npm install
npm run build
```

### Monitoring

- Set up alerts for authentication failures
- Monitor API response times
- Track error rates and patterns

### Log Rotation

```bash
# Configure log rotation
logrotate /etc/logrotate.d/ruckus1-mcp
```

## Support and Resources

### Documentation

- [Architecture Documentation](architecture.md)
- [API Reference](api-reference.md)
- [Development Guide](development-guide.md)

### Community

- GitHub Issues for bug reports
- GitHub Discussions for questions
- MCP Community for protocol-related questions

### Professional Support

For enterprise deployments and support:

- Contact RUCKUS support for API-related issues
- Consider professional services for custom integrations
- Implement monitoring and alerting solutions
