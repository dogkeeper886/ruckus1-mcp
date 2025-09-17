# RUCKUS1-MCP Development Guide

## Overview

This guide provides comprehensive information for developers working on the RUCKUS1-MCP project, including setup, coding standards, testing, and contribution guidelines.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **TypeScript**: Version 5.0 or higher
- **Git**: For version control
- **Docker**: For containerized testing (optional)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ruckus1-mcp.git
cd ruckus1-mcp

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your RUCKUS One credentials

# Build the project
npm run build

# Run tests
npm test
```

### Environment Configuration

Create a `.env` file with your development credentials:

```bash
# .env
RUCKUS_TENANT_ID=your-dev-tenant-id
RUCKUS_CLIENT_ID=your-dev-client-id
RUCKUS_CLIENT_SECRET=your-dev-client-secret
RUCKUS_REGION=dev
```

## Project Structure

```
src/
├── mcpServer.ts              # Main MCP server implementation
├── services/
│   └── ruckusApiService.ts   # RUCKUS One API service layer
├── types/
│   └── ruckusApi.ts          # TypeScript type definitions
├── utils/
│   ├── config.ts             # Configuration utilities
│   ├── errorHandler.ts       # Error handling utilities
│   ├── tokenCache.ts         # Token caching utilities
│   └── validation.ts         # Input validation utilities
└── __tests__/
    └── mcpTools.test.ts      # Test suite

scripts/
├── test-move-ap.ts           # AP movement testing script
├── test-move-ap-mcp.ts       # MCP-specific testing
└── test-wifi-settings.ts     # WiFi settings testing

docs/                         # Documentation
dist/                         # Compiled JavaScript (generated)
```

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Run with ts-node (development)
npm run mcp          # Run MCP server directly
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript

# Testing
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run typecheck    # TypeScript type checking
npm run lint         # Linting (when configured)
npm run clean        # Clean build artifacts
```

### Development Mode

For active development, use the development mode:

```bash
# Run in development mode with hot reload
npm run dev

# In another terminal, test with MCP Inspector
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

## Coding Standards

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Code Style Guidelines

#### 1. Function Naming

- Use descriptive, action-oriented names
- Prefix async functions with operation type
- Use consistent parameter ordering

```typescript
// Good
export async function createVenueWithRetry(...)
export async function queryApGroups(...)
export async function getRuckusActivityDetails(...)

// Avoid
export async function venue(...)
export async function apGroups(...)
```

#### 2. Parameter Ordering

Follow the established pattern for all functions:

```typescript
export async function operationName(
  token: string,               // ALWAYS first parameter
  requiredParam1: string,      // Required business parameters
  requiredParam2: string,      
  region: string = '',         // ALWAYS this default
  maxRetries: number = 5,      // ALWAYS 5 (not 10, not 3)
  pollIntervalMs: number = 2000 // ALWAYS 2000
): Promise<any>
```

#### 3. Error Handling

Use the standardized error handling pattern:

```typescript
try {
  const result = await operation();
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
} catch (error: any) {
  console.error('[MCP] Error in operation:', error);
  
  let errorMessage = `Error in operation: ${error}`;
  
  if (error.response) {
    errorMessage += `\nHTTP Status: ${error.response.status}`;
    errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
  }
  
  return {
    content: [{ type: 'text', text: errorMessage }],
    isError: true
  };
}
```

#### 4. Async Operation Pattern

For operations that return `requestId` and need polling:

```typescript
export async function operationWithRetry(
  token: string,
  requiredParam: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  // 1. Make API call
  const response = await makeRuckusApiCall({...}, 'Operation name');
  const operationResponse = response.data;
  
  // 2. Check for async operation
  const activityId = operationResponse.requestId;
  if (!activityId) {
    return {
      ...operationResponse,
      status: 'completed',
      message: 'Operation completed successfully (synchronous operation)'
    };
  }

  // 3. Poll for completion (COPY EXACTLY from existing tools)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      const isCompleted = activityDetails.endDatetime !== undefined;
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...operationResponse,
            activityDetails,
            status: 'completed',
            message: 'Operation completed successfully'
          };
        } else {
          return {
            ...operationResponse,
            activityDetails,
            status: 'failed',
            message: 'Operation failed',
            error: activityDetails.error || activityDetails.message
          };
        }
      }

      if (isFailed) {
        return {
          ...operationResponse,
          activityDetails,
          status: 'failed',
          message: 'Operation failed',
          error: activityDetails.error || activityDetails.message
        };
      }

      retryCount++;
      console.log(`[RUCKUS] Operation in progress, attempt ${retryCount}/${maxRetries}`);
      
      if (retryCount >= maxRetries) break;
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        return {
          ...operationResponse,
          status: 'timeout',
          message: 'Operation status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...operationResponse,
    status: 'timeout',
    message: 'Operation status unknown - polling timeout',
    activityId
  };
}
```

## Adding New MCP Tools

### Step-by-Step Process

#### 1. Determine Operation Type

**Read-Only Operations** (GET, Query):
- No retry parameters
- Immediate response
- Use existing read-only patterns

**Async Operations** (Create, Delete, Update):
- Include retry parameters
- Use polling pattern
- Follow async operation template

#### 2. Add Service Function

Add your function to `src/services/ruckusApiService.ts`:

```typescript
// For read-only operations
export async function queryYourResource(
  token: string,
  region: string = '',
  filters: any = {},
  fields: string[] = ['id', 'name'],
  page: number = 1,
  pageSize: number = 10
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/endpoint`
    : 'https://api.ruckus.cloud/your/endpoint';

  const payload = {
    fields,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField: 'name',
    sortOrder: 'ASC'
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query your resource');

  return response.data;
}
```

#### 3. Add MCP Tool Registration

Add to the tools array in `src/mcpServer.ts`:

```typescript
{
  name: 'query_your_resource',
  description: 'Query your resource from RUCKUS One with filtering and pagination support',
  inputSchema: {
    type: 'object',
    properties: {
      filters: { type: 'object', description: 'Optional filters to apply' },
      fields: { type: 'array', items: { type: 'string' }, description: 'Fields to return (default: ["id", "name"])' },
      page: { type: 'number', description: 'Page number (default: 1)' },
      pageSize: { type: 'number', description: 'Number of results per page (default: 10)' }
    },
    required: []
  }
}
```

#### 4. Add MCP Tool Handler

Add case handler in `src/mcpServer.ts`:

```typescript
case 'query_your_resource': {
  try {
    const { 
      filters = {},
      fields = ['id', 'name'],
      page = 1,
      pageSize = 10
    } = request.params.arguments as {
      filters?: any;
      fields?: string[];
      page?: number;
      pageSize?: number;
    };
    
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );
    
    const result = await queryYourResource(
      token,
      process.env.RUCKUS_REGION,
      filters,
      fields,
      page,
      pageSize
    );
    
    console.log('[MCP] Query response:', result);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    // Use standard error handling pattern
  }
}
```

#### 5. Update Imports

Add your function to the imports in `src/mcpServer.ts`:

```typescript
import { 
  // ... existing imports
  queryYourResource 
} from './services/ruckusApiService';
```

## Testing

### Test Structure

Tests are located in `src/__tests__/` and use Jest with TypeScript support.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

```typescript
// src/__tests__/mcpTools.test.ts
import { queryYourResource } from '../services/ruckusApiService';

describe('queryYourResource', () => {
  it('should query resources successfully', async () => {
    const mockToken = 'mock-token';
    const mockResponse = {
      data: [
        { id: '1', name: 'Resource 1' },
        { id: '2', name: 'Resource 2' }
      ]
    };

    // Mock the API call
    jest.spyOn(axios, 'post').mockResolvedValue(mockResponse);

    const result = await queryYourResource(mockToken);

    expect(result).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/your/endpoint'),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
```

### Integration Testing

Use the provided test scripts for integration testing:

```bash
# Test AP movement operations
npx ts-node scripts/test-move-ap.ts

# Test MCP-specific functionality
npx ts-node scripts/test-move-ap-mcp.ts

# Test WiFi settings
npx ts-node scripts/test-wifi-settings.ts
```

## Debugging

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=ruckus1-mcp:*

# Run with debug output
npm run dev
```

### MCP Inspector

Use the MCP Inspector for testing and debugging:

```bash
# Install globally
npm install -g @modelcontextprotocol/inspector

# Run inspector
npx @modelcontextprotocol/inspector npx ts-node src/mcpServer.ts
```

### Logging

The server uses structured logging:

```typescript
console.log('[MCP] Operation started:', operationName);
console.error('[MCP] Error in operation:', error);
console.log('[RUCKUS] API call to:', url);
```

## Code Quality

### TypeScript Strict Mode

The project uses strict TypeScript settings. Ensure all code compiles without warnings:

```bash
npm run typecheck
```

### Linting

Configure and run linting:

```bash
# Install ESLint (when configured)
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Run linting
npm run lint
```

### Pre-commit Hooks

Set up pre-commit hooks for code quality:

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run typecheck && npm test"
```

## Performance Considerations

### Memory Management

- Avoid memory leaks in long-running operations
- Use appropriate data structures for large datasets
- Implement proper cleanup in async operations

### API Efficiency

- Use field selection to minimize response sizes
- Implement appropriate pagination
- Cache frequently accessed data when possible

### Polling Optimization

- Use appropriate polling intervals
- Implement early termination on completion
- Handle timeout scenarios gracefully

## Documentation

### Code Documentation

Use JSDoc comments for public functions:

```typescript
/**
 * Query resources from RUCKUS One with filtering and pagination support
 * @param token - JWT authentication token
 * @param region - RUCKUS cloud region (optional)
 * @param filters - Optional filters to apply
 * @param fields - Fields to return in response
 * @param page - Page number for pagination
 * @param pageSize - Number of results per page
 * @returns Promise resolving to query results
 */
export async function queryYourResource(
  token: string,
  region: string = '',
  filters: any = {},
  fields: string[] = ['id', 'name'],
  page: number = 1,
  pageSize: number = 10
): Promise<any>
```

### API Documentation

Update the API reference when adding new tools:

1. Add tool description to `docs/api-reference.md`
2. Include parameter documentation
3. Provide example requests and responses
4. Update the overview section if needed

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes following coding standards
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

### Commit Messages

Use conventional commit format:

```
feat: add new MCP tool for resource management
fix: resolve authentication timeout issue
docs: update API reference for new tools
test: add unit tests for query functions
```

### Code Review

All code changes require review:

- Ensure coding standards are followed
- Verify tests are included
- Check documentation is updated
- Validate error handling is appropriate

## Troubleshooting

### Common Development Issues

#### TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npm run typecheck

# Fix common issues
# - Add missing type annotations
# - Handle null/undefined cases
# - Import missing types
```

#### Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- mcpTools.test.ts

# Debug test issues
npm test -- --detectOpenHandles
```

#### MCP Connection Issues

1. Verify MCP client configuration
2. Check environment variables
3. Ensure server is running
4. Review MCP protocol compliance

### Getting Help

- Check existing GitHub issues
- Review documentation
- Ask questions in GitHub discussions
- Contact maintainers for critical issues
