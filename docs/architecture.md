# RUCKUS1-MCP Architecture Documentation

## Overview

RUCKUS1-MCP is a Model Context Protocol (MCP) server that provides AI assistants and MCP clients with standardized access to RUCKUS One network management capabilities. The project follows a service-oriented architecture with clear separation of concerns and robust error handling.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client Layer                        │
│  (Claude Desktop, Cline, other MCP-compatible clients)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (stdio)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              mcpServer.ts                           │   │
│  │  - Tool registration and routing                    │   │
│  │  - Request/response handling                        │   │
│  │  - Error formatting and logging                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Function calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Service Layer                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           ruckusApiService.ts                       │   │
│  │  - OAuth2 authentication                            │   │
│  │  - API request/response handling                    │   │
│  │  - Async operation polling                          │   │
│  │  - Error handling and retry logic                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                RUCKUS One API                              │
│  - Multi-region cloud endpoints                           │
│  - OAuth2 protected resources                             │
│  - Async operation tracking                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server (`src/mcpServer.ts`)

The main entry point that implements the Model Context Protocol specification.

**Responsibilities:**
- Tool registration and schema definition
- Request routing and parameter validation
- Response formatting and error handling
- Environment variable management

**Key Features:**
- 20+ MCP tools for comprehensive RUCKUS One management
- Standardized error responses with detailed API error information
- Support for both synchronous and asynchronous operations
- Resource definitions for token and venue data

### 2. API Service Layer (`src/services/ruckusApiService.ts`)

Comprehensive service layer handling all RUCKUS One API interactions.

**Responsibilities:**
- OAuth2 authentication and token management
- HTTP request/response handling with axios
- Async operation polling and status checking
- Error handling and retry logic
- Multi-region endpoint management

**Key Patterns:**
- **Retrieve-Then-Update**: Preserves existing properties during updates
- **Async Polling**: Automatic status checking for long-running operations
- **Retry Logic**: Configurable retry mechanisms with exponential backoff
- **Error Enrichment**: Detailed error messages with API response data

### 3. Type System (`src/types/ruckusApi.ts`)

TypeScript interfaces and types for API responses and requests.

**Key Interfaces:**
- `AuthTokenResponse`: OAuth2 token response structure
- `Venue`: Venue data model with address and location information
- `ApGroup`: Access Point group configuration
- `ActivityDetails`: Async operation status tracking
- `ApiError`: Standardized error response format

### 4. Utilities

Supporting utilities for configuration, validation, and error handling.

**Components:**
- **Configuration**: Environment variable validation and defaults
- **Error Handling**: Centralized error processing and formatting
- **Token Caching**: JWT token management and refresh logic
- **Validation**: Input parameter validation and sanitization

## Operation Patterns

### Synchronous Operations (Read-Only)

**Pattern:**
```typescript
export async function queryResource(
  token: string,
  region: string = '',
  // ... query parameters
): Promise<any> {
  // Direct API call with immediate response
  const response = await makeRuckusApiCall({...}, 'Operation name');
  return response.data;
}
```

**Characteristics:**
- Immediate response
- No retry parameters
- Simple error handling
- Used for queries and GET operations

### Asynchronous Operations (Create/Update/Delete)

**Pattern:**
```typescript
export async function operationWithRetry(
  token: string,
  // ... required parameters
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  // 1. Make API call
  const response = await makeRuckusApiCall({...}, 'Operation name');
  
  // 2. Check for async operation (requestId)
  const activityId = response.data.requestId;
  if (!activityId) {
    return { ...response.data, status: 'completed' };
  }
  
  // 3. Poll for completion
  let retryCount = 0;
  while (retryCount < maxRetries) {
    const activityDetails = await getRuckusActivityDetails(token, activityId, region);
    // Check completion status and handle accordingly
  }
}
```

**Characteristics:**
- Polling-based completion checking
- Configurable retry logic (default: 5 retries, 2-second intervals)
- Status tracking via activity details
- Used for create, update, and delete operations

## Error Handling Strategy

### 1. API Error Enrichment

```typescript
async function makeRuckusApiCall<T = any>(
  config: AxiosRequestConfig,
  operationName: string
): Promise<AxiosResponse<T>> {
  try {
    return await axios(config);
  } catch (error: any) {
    if (error.response) {
      // Extract detailed error information from RUCKUS API
      let errorMessage = `${operationName} failed with status ${error.response.status}`;
      
      // Add specific API error details
      if (error.response.data.error) {
        errorMessage += ` - API Error: ${error.response.data.error}`;
      }
      // ... additional error detail extraction
      
      const detailedError = new Error(errorMessage) as any;
      detailedError.response = error.response;
      throw detailedError;
    }
    throw error;
  }
}
```

### 2. MCP Error Response Format

```typescript
return {
  content: [{
    type: 'text',
    text: errorMessage
  }],
  isError: true
};
```

### 3. Async Operation Error Handling

- Timeout detection after maximum retries
- Status-based error classification (SUCCESS, FAILED, INPROGRESS)
- Detailed error messages from activity details
- Graceful degradation for network issues

## Security Considerations

### 1. Authentication
- OAuth2 client credentials flow
- JWT token management with automatic refresh
- No credential storage in code

### 2. Environment Variables
- Required credentials via environment variables
- No hardcoded secrets or API keys
- Docker security with non-root user

### 3. Input Validation
- Parameter validation at MCP tool level
- Type safety with TypeScript
- Sanitization of user inputs

## Performance Optimizations

### 1. Token Caching
- JWT token caching to reduce authentication overhead
- Automatic token refresh before expiration
- Single token per region/tenant

### 2. Async Operation Efficiency
- Configurable polling intervals
- Early termination on completion/failure
- Parallel operation support where possible

### 3. Response Optimization
- Field selection for large datasets
- Pagination support for queries
- Client-side filtering for large responses

## Multi-Region Support

The system supports multiple RUCKUS cloud regions through dynamic endpoint construction:

```typescript
const apiUrl = region && region.trim() !== ''
  ? `https://api.${region}.ruckus.cloud/endpoint`
  : 'https://api.ruckus.cloud/endpoint';
```

**Supported Regions:**
- Global (default)
- Development
- Custom regions as configured

## Deployment Architecture

### Docker Container
- Node.js 18 Alpine base image
- Multi-stage build for optimization
- Non-root user for security
- Environment variable validation

### MCP Integration
- stdio transport for MCP communication
- No HTTP server (MCP-only design)
- Process-based execution model
- Client-managed lifecycle

## Monitoring and Logging

### Logging Strategy
- Structured logging with operation context
- Error logging with full API response details
- Progress logging for async operations
- stderr for operational logs (preserves stdio for MCP)

### Monitoring Points
- Authentication success/failure rates
- API response times and error rates
- Async operation completion rates
- Retry attempt tracking

## Future Architecture Considerations

### Scalability
- Horizontal scaling through multiple MCP server instances
- Connection pooling for high-volume operations
- Caching layer for frequently accessed data

### Extensibility
- Plugin architecture for additional API integrations
- Custom tool registration system
- Configuration-driven feature toggles

### Reliability
- Circuit breaker pattern for API failures
- Exponential backoff with jitter
- Health check endpoints for monitoring
