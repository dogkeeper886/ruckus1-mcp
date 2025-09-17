# RUCKUS1-MCP Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the RUCKUS1-MCP server. It covers authentication problems, MCP connection issues, API errors, and performance troubleshooting.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] Are all required environment variables set?
- [ ] Are the RUCKUS One credentials valid and not expired?
- [ ] Is the MCP client properly configured?
- [ ] Is the server running and accessible?
- [ ] Are there any network connectivity issues?

## Authentication Issues

### Problem: "Authentication failed" or "Invalid credentials"

**Symptoms:**
- Error messages about authentication failure
- HTTP 401 Unauthorized responses
- "Invalid client credentials" errors

**Solutions:**

1. **Verify Environment Variables**
   ```bash
   # Check if variables are set
   echo $RUCKUS_TENANT_ID
   echo $RUCKUS_CLIENT_ID
   echo $RUCKUS_CLIENT_SECRET
   echo $RUCKUS_REGION
   ```

2. **Test Credentials Manually**
   ```bash
   # Test authentication with curl
   curl -X POST "https://${RUCKUS_REGION}.ruckus.cloud/oauth2/token/${RUCKUS_TENANT_ID}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=${RUCKUS_CLIENT_ID}&client_secret=${RUCKUS_CLIENT_SECRET}"
   ```

3. **Check Credential Format**
   - Ensure no extra spaces or newlines
   - Verify tenant ID format (usually UUID-like)
   - Confirm client ID and secret are correct

4. **Verify Region**
   - Check if you're using the correct region
   - Try with `RUCKUS_REGION=global` if unsure
   - Ensure the region matches your RUCKUS One deployment

### Problem: "Token expired" or "Invalid token"

**Symptoms:**
- Operations work initially but fail after some time
- "Token expired" error messages
- HTTP 401 responses after successful authentication

**Solutions:**

1. **Check Token Expiration**
   ```bash
   # Decode JWT token to check expiration
   echo "your-jwt-token" | base64 -d
   ```

2. **Implement Token Refresh**
   - The server should handle token refresh automatically
   - Check if token caching is working properly
   - Verify the token service is functioning

3. **Restart the Server**
   ```bash
   # Restart to get a fresh token
   docker restart ruckus1-mcp-container
   # or
   npm run dev
   ```

## MCP Connection Issues

### Problem: MCP client cannot connect to server

**Symptoms:**
- MCP client shows connection errors
- Server not responding to MCP requests
- "Connection refused" or similar errors

**Solutions:**

1. **Verify MCP Client Configuration**
   ```json
   // Check mcp.json configuration
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

2. **Test Server Manually**
   ```bash
   # Test server directly
   npx ts-node src/mcpServer.ts
   
   # Test with MCP Inspector
   npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
   ```

3. **Check Docker Container**
   ```bash
   # Check if container is running
   docker ps | grep ruckus1-mcp
   
   # Check container logs
   docker logs <container-id>
   
   # Test container manually
   docker run --rm -i -e RUCKUS_TENANT_ID=... ruckus1-mcp
   ```

4. **Verify stdio Communication**
   - Ensure the MCP client is using stdio transport
   - Check that stdin/stdout are properly connected
   - Verify no other processes are interfering

### Problem: "Tool not found" or "Unknown tool"

**Symptoms:**
- MCP client reports tool not found
- Available tools list is empty
- Specific tools are missing

**Solutions:**

1. **Check Tool Registration**
   ```typescript
   // Verify tool is registered in mcpServer.ts
   {
     name: 'your_tool_name',
     description: 'Tool description',
     inputSchema: { ... }
   }
   ```

2. **Verify Server Version**
   ```bash
   # Check server version
   npm list @modelcontextprotocol/sdk
   
   # Update if needed
   npm update @modelcontextprotocol/sdk
   ```

3. **Restart MCP Client**
   - Restart the MCP client application
   - Clear any cached tool definitions
   - Reconnect to the server

## API Errors

### Problem: "API request failed" or HTTP errors

**Symptoms:**
- HTTP 4xx or 5xx error responses
- "API request failed" messages
- Specific RUCKUS API error messages

**Solutions:**

1. **Check API Endpoint**
   ```bash
   # Verify the API endpoint is accessible
   curl -H "Authorization: Bearer $TOKEN" \
     "https://api.${RUCKUS_REGION}.ruckus.cloud/venues"
   ```

2. **Review Error Details**
   ```typescript
   // Check the detailed error response
   if (error.response) {
     console.error('HTTP Status:', error.response.status);
     console.error('Response Data:', error.response.data);
     console.error('Response Headers:', error.response.headers);
   }
   ```

3. **Common API Issues**
   - **404 Not Found**: Check if the resource exists
   - **400 Bad Request**: Verify request parameters
   - **403 Forbidden**: Check permissions and credentials
   - **429 Too Many Requests**: Implement rate limiting
   - **500 Internal Server Error**: Contact RUCKUS support

### Problem: "Async operation timeout"

**Symptoms:**
- Operations start but never complete
- "Polling timeout" messages
- Operations stuck in "in progress" state

**Solutions:**

1. **Check Operation Status**
   ```bash
   # Use the activity details tool
   {
     "tool": "get_ruckus_activity_details",
     "arguments": {
       "activityId": "your-activity-id"
     }
   }
   ```

2. **Adjust Polling Parameters**
   ```typescript
   // Increase retry attempts and polling interval
   {
     "tool": "create_ruckus_venue",
     "arguments": {
       "name": "Test Venue",
       "addressLine": "123 Main St",
       "city": "New York",
       "country": "United States",
       "maxRetries": 10,
       "pollIntervalMs": 5000
     }
   }
   ```

3. **Check RUCKUS One Status**
   - Verify RUCKUS One service is operational
   - Check for any ongoing maintenance
   - Contact RUCKUS support if issues persist

## Performance Issues

### Problem: Slow response times

**Symptoms:**
- Operations take longer than expected
- Timeout errors
- High memory or CPU usage

**Solutions:**

1. **Optimize Polling Parameters**
   ```typescript
   // Reduce polling interval for faster responses
   {
     "maxRetries": 5,
     "pollIntervalMs": 1000  // Reduce from default 2000ms
   }
   ```

2. **Use Field Selection**
   ```typescript
   // Only request needed fields
   {
     "fields": ["id", "name", "status"]  // Instead of all fields
   }
   ```

3. **Implement Pagination**
   ```typescript
   // Use pagination for large datasets
   {
     "page": 1,
     "pageSize": 100  // Instead of loading all data
   }
   ```

4. **Monitor Resource Usage**
   ```bash
   # Check Docker container resources
   docker stats <container-id>
   
   # Check Node.js memory usage
   node --inspect src/mcpServer.ts
   ```

### Problem: Memory leaks or high memory usage

**Symptoms:**
- Memory usage continuously increases
- Server becomes unresponsive
- Out of memory errors

**Solutions:**

1. **Check for Memory Leaks**
   ```bash
   # Use Node.js memory profiling
   node --inspect --max-old-space-size=4096 src/mcpServer.ts
   ```

2. **Implement Proper Cleanup**
   ```typescript
   // Ensure proper cleanup in async operations
   try {
     // Operation code
   } finally {
     // Cleanup code
     clearTimeout(timeoutId);
     // Remove event listeners
   }
   ```

3. **Optimize Data Structures**
   - Use appropriate data structures for large datasets
   - Implement data pagination
   - Clear unused references

## Network Issues

### Problem: "Network error" or "Connection timeout"

**Symptoms:**
- Network-related error messages
- Connection timeout errors
- DNS resolution failures

**Solutions:**

1. **Check Network Connectivity**
   ```bash
   # Test basic connectivity
   ping api.ruckus.cloud
   
   # Test HTTPS connectivity
   curl -I https://api.ruckus.cloud
   ```

2. **Verify DNS Resolution**
   ```bash
   # Check DNS resolution
   nslookup api.ruckus.cloud
   dig api.ruckus.cloud
   ```

3. **Check Firewall Settings**
   - Ensure outbound HTTPS (443) is allowed
   - Check for proxy settings
   - Verify corporate firewall rules

4. **Test Different Regions**
   ```bash
   # Try different RUCKUS regions
   export RUCKUS_REGION=global
   export RUCKUS_REGION=us
   export RUCKUS_REGION=eu
   ```

## Docker Issues

### Problem: Container fails to start

**Symptoms:**
- Docker container exits immediately
- "Container not found" errors
- Permission denied errors

**Solutions:**

1. **Check Container Logs**
   ```bash
   # Check container logs
   docker logs <container-id>
   
   # Check with container name
   docker logs ruckus1-mcp
   ```

2. **Verify Environment Variables**
   ```bash
   # Check environment variables in container
   docker run --rm -e RUCKUS_TENANT_ID=test ruckus1-mcp env
   ```

3. **Test Container Manually**
   ```bash
   # Run container interactively
   docker run -it --rm \
     -e RUCKUS_TENANT_ID=your-tenant-id \
     -e RUCKUS_CLIENT_ID=your-client-id \
     -e RUCKUS_CLIENT_SECRET=your-client-secret \
     ruckus1-mcp /bin/sh
   ```

4. **Check Image Integrity**
   ```bash
   # Verify image exists
   docker images | grep ruckus1-mcp
   
   # Pull latest image
   docker pull dogkeeper886/ruckus1-mcp:latest
   ```

### Problem: Permission denied errors

**Symptoms:**
- "Permission denied" errors
- Container cannot write to filesystem
- User permission issues

**Solutions:**

1. **Check File Permissions**
   ```bash
   # Check file permissions
   ls -la src/mcpServer.ts
   
   # Fix permissions if needed
   chmod +x src/mcpServer.ts
   ```

2. **Use Non-root User**
   ```bash
   # The Docker image already uses non-root user
   # Check if user switching is working
   docker run --rm ruckus1-mcp whoami
   ```

3. **Check Volume Mounts**
   ```bash
   # If using volume mounts, check permissions
   docker run --rm -v $(pwd):/app ruckus1-mcp ls -la /app
   ```

## Debugging Techniques

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=ruckus1-mcp:*

# Run with debug output
npm run dev
```

### Use MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run inspector
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

### Test Individual Components

```bash
# Test authentication only
npx ts-node -e "
import { getRuckusJwtToken } from './src/services/ruckusApiService';
getRuckusJwtToken(process.env.RUCKUS_TENANT_ID, process.env.RUCKUS_CLIENT_ID, process.env.RUCKUS_CLIENT_SECRET, process.env.RUCKUS_REGION)
  .then(token => console.log('Token:', token))
  .catch(err => console.error('Error:', err));
"

# Test specific API calls
npx ts-node scripts/test-move-ap.ts
```

### Monitor Network Traffic

```bash
# Use tcpdump to monitor network traffic
sudo tcpdump -i any -n host api.ruckus.cloud

# Use curl with verbose output
curl -v -H "Authorization: Bearer $TOKEN" \
  "https://api.ruckus.cloud/venues"
```

## Common Error Messages

### "No requestId returned from API"

**Cause:** The API call didn't return a requestId for async operation tracking.

**Solution:** Check if the operation is actually async or if there's an API issue.

### "Operation status unknown - polling timeout"

**Cause:** The async operation didn't complete within the retry limit.

**Solution:** Increase `maxRetries` or `pollIntervalMs`, or check RUCKUS One status.

### "AP with serial number X not found"

**Cause:** The specified AP doesn't exist or isn't accessible.

**Solution:** Verify the AP serial number and check if it's in the correct venue.

### "Venue 'X' not found"

**Cause:** The specified venue doesn't exist or isn't accessible.

**Solution:** Verify the venue name/ID and check permissions.

### "Invalid parameter: Y"

**Cause:** One or more parameters don't meet the API requirements.

**Solution:** Check parameter format and required fields.

## Getting Help

### Self-Service Resources

1. **Check Documentation**
   - [Architecture Guide](architecture.md)
   - [API Reference](api-reference.md)
   - [Development Guide](development-guide.md)

2. **Review Logs**
   - Check server logs for error details
   - Look for specific error codes
   - Review network connectivity

3. **Test with MCP Inspector**
   - Use the inspector to test individual tools
   - Verify MCP protocol compliance
   - Check request/response formats

### Community Support

1. **GitHub Issues**
   - Search existing issues
   - Create new issue with detailed information
   - Include logs and error messages

2. **GitHub Discussions**
   - Ask questions in discussions
   - Share solutions and workarounds
   - Get help from the community

### Professional Support

1. **RUCKUS Support**
   - Contact RUCKUS for API-related issues
   - Report service outages
   - Get help with RUCKUS One platform

2. **MCP Community**
   - Join MCP community forums
   - Get help with MCP protocol issues
   - Share best practices

## Prevention

### Best Practices

1. **Regular Updates**
   - Keep the server updated
   - Monitor for security patches
   - Update dependencies regularly

2. **Monitoring**
   - Set up monitoring for the server
   - Monitor API response times
   - Track error rates

3. **Testing**
   - Test changes in development first
   - Use integration tests
   - Verify MCP client compatibility

4. **Documentation**
   - Keep documentation updated
   - Document any custom configurations
   - Share solutions with the team

### Maintenance

1. **Regular Health Checks**
   - Test authentication regularly
   - Verify API connectivity
   - Check MCP client connections

2. **Log Rotation**
   - Implement log rotation
   - Monitor log file sizes
   - Archive old logs

3. **Backup**
   - Backup configurations
   - Document environment variables
   - Keep deployment scripts updated
