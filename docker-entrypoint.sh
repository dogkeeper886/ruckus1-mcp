#!/bin/sh

# Docker entrypoint script for ruckus1-mcp
# This script ensures proper startup and stdio handling for MCP communication

set -e

# Validate required environment variables
if [ -z "$RUCKUS_TENANT_ID" ]; then
  echo "Error: RUCKUS_TENANT_ID environment variable is required" >&2
  exit 1
fi

if [ -z "$RUCKUS_CLIENT_ID" ]; then
  echo "Error: RUCKUS_CLIENT_ID environment variable is required" >&2
  exit 1
fi

if [ -z "$RUCKUS_CLIENT_SECRET" ]; then
  echo "Error: RUCKUS_CLIENT_SECRET environment variable is required" >&2
  exit 1
fi

# Set default region if not provided
export RUCKUS_REGION=${RUCKUS_REGION:-global}

# Log startup information (to stderr to avoid interfering with stdio)
echo "Starting RUCKUS One MCP Server..." >&2
echo "Tenant ID: $RUCKUS_TENANT_ID" >&2
echo "Region: $RUCKUS_REGION" >&2

# Execute the MCP server
exec node dist/mcpServer.js "$@"