# AP Update Flow Design

## Overview

Design a comprehensive **retrieve-then-update** flow for AP management that:
1. **Retrieves current AP state** before any modification
2. **Merges changes** with existing properties  
3. **Provides unified tools** for venue, AP group, and name changes
4. **Preserves all properties** not explicitly being changed

## Current Problem

The existing `move_ruckus_ap` tool directly calls update API without preserving existing properties, causing data loss.

## Proposed Solution: Retrieve-Then-Update Pattern

### Core Flow
```
1. GET current AP details (name, venue, group, all properties)
2. MERGE user changes with existing properties  
3. PUT updated AP with complete, correct payload
4. VERIFY operation success
```

### Benefits
- **Property Preservation**: Never lose existing AP data
- **Unified Interface**: Single update mechanism for all changes
- **Flexibility**: Support any combination of property updates
- **Safety**: Always work with complete, known state

## Tool Architecture

### 1. Core Service Functions

#### `getApDetails(token, serialNumber, region)`
```typescript
// Retrieve complete AP configuration
const ap = await getApDetails(token, "212339500134", region);
// Returns: { name, venueId, apGroupId, model, macAddress, ... }
```

#### `updateApWithRetrieval(token, serialNumber, changes, region, maxRetries, pollInterval)`
```typescript
// Smart update that preserves existing properties
const result = await updateApWithRetrieval(
  token, 
  "212339500134",
  { 
    name: "new-name",           // Optional: change name
    apGroupId: "group-123",     // Optional: change group  
    venueId: "venue-456"        // Optional: change venue
  },
  region,
  maxRetries,
  pollInterval
);
```

### 2. MCP Tools (User Interface)

#### `update_ruckus_ap` - Unified AP Update Tool
```typescript
// Single tool for any AP property changes
{
  name: 'update_ruckus_ap',
  description: 'Update AP properties (name, venue, group, etc.) with automatic property preservation',
  inputSchema: {
    type: 'object',
    properties: {
      apSerialNumber: { type: 'string', description: 'AP serial number' },
      apName: { type: 'string', description: 'New AP display name (optional)' },
      venueId: { type: 'string', description: 'Target venue ID (optional)' },  
      apGroupId: { type: 'string', description: 'Target AP group ID (optional)' },
      // ... other updatable properties
    },
    required: ['apSerialNumber']
  }
}
```

#### Convenience Tools (Built on Core Update)

##### `move_ap_to_venue` - Cross-Venue Move
```typescript
{
  name: 'move_ap_to_venue',
  description: 'Move AP to different venue (preserves name and other properties)',
  inputSchema: {
    properties: {
      apSerialNumber: { type: 'string' },
      targetVenueId: { type: 'string' },  
      targetApGroupId: { type: 'string' }, // Required: which group in target venue
    }
  }
}
```

##### `move_ap_to_group` - Same-Venue Group Change  
```typescript
{
  name: 'move_ap_to_group', 
  description: 'Move AP to different group in same venue (preserves name)',
  inputSchema: {
    properties: {
      apSerialNumber: { type: 'string' },
      targetApGroupId: { type: 'string' }
    }
  }
}
```

##### `rename_ap` - Name Change Only
```typescript
{
  name: 'rename_ap',
  description: 'Change AP display name (preserves venue and group)',  
  inputSchema: {
    properties: {
      apSerialNumber: { type: 'string' },
      newName: { type: 'string' }
    }
  }
}
```

## Implementation Flow

### Service Layer (`ruckusApiService.ts`)

#### 1. Enhanced AP Retrieval
```typescript
export async function getApDetailsBySerial(
  token: string,
  serialNumber: string,
  region: string = ''
): Promise<ApDetails> {
  // Use existing get_ruckus_aps with serial number filter
  const response = await getRuckusAps({
    token,
    searchString: serialNumber,
    searchTargetFields: ['serialNumber'],
    region
  });
  
  if (response.totalCount === 0) {
    throw new Error(`AP with serial number ${serialNumber} not found`);
  }
  
  return response.data[0];
}
```

#### 2. Smart Update Function
```typescript
export async function updateApWithRetrieval(
  token: string,
  serialNumber: string, 
  changes: Partial<ApUpdateRequest>,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<ApUpdateResponse> {
  
  // Step 1: Get current AP state
  const currentAp = await getApDetailsBySerial(token, serialNumber, region);
  
  // Step 2: Merge changes with existing properties
  const updatePayload = {
    serialNumber: currentAp.serialNumber,
    name: changes.name ?? currentAp.name,                    // Preserve existing name
    venueId: changes.venueId ?? currentAp.venueId,           // Preserve existing venue  
    apGroupId: changes.apGroupId ?? currentAp.apGroupId,     // Preserve existing group
    // ... merge other properties as needed
  };
  
  // Step 3: Perform update with complete payload
  return await performApUpdate(token, updatePayload, region, maxRetries, pollIntervalMs);
}
```

#### 3. Convenience Functions
```typescript
export async function moveApToVenue(token: string, serialNumber: string, targetVenueId: string, targetApGroupId: string, region?: string) {
  return updateApWithRetrieval(token, serialNumber, { venueId: targetVenueId, apGroupId: targetApGroupId }, region);
}

export async function moveApToGroup(token: string, serialNumber: string, targetApGroupId: string, region?: string) {
  return updateApWithRetrieval(token, serialNumber, { apGroupId: targetApGroupId }, region);
}

export async function renameAp(token: string, serialNumber: string, newName: string, region?: string) {
  return updateApWithRetrieval(token, serialNumber, { name: newName }, region);
}
```

### MCP Layer (`mcpServer.ts`)

#### Unified Handler Pattern
```typescript
case 'update_ruckus_ap': {
  const { apSerialNumber, apName, venueId, apGroupId, ...otherChanges } = request.params.arguments;
  
  const changes: Partial<ApUpdateRequest> = {};
  if (apName !== undefined) changes.name = apName;
  if (venueId !== undefined) changes.venueId = venueId;  
  if (apGroupId !== undefined) changes.apGroupId = apGroupId;
  // ... handle other properties
  
  const result = await updateApWithRetrieval(token, apSerialNumber, changes, region, maxRetries, pollIntervalMs);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

case 'move_ap_to_group': {
  const { apSerialNumber, targetApGroupId } = request.params.arguments;
  const result = await moveApToGroup(token, apSerialNumber, targetApGroupId, region);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}
```

## Benefits of This Approach

### 1. **Property Safety**
- Never lose AP name, configuration, or metadata
- Always work with complete, known state  
- Explicit control over what changes

### 2. **Unified Interface**  
- Single update mechanism for all AP changes
- Consistent error handling and retry logic
- Simplified tool maintenance

### 3. **Flexibility**
- Support any combination of property updates
- Easy to add new updatable properties
- Backwards compatible with existing usage

### 4. **Better User Experience**
- Convenience tools for common operations  
- Clear, predictable behavior
- Comprehensive error messages

## Migration Strategy

### Phase 1: Implement Core Functions
1. Add `getApDetailsBySerial()` function
2. Add `updateApWithRetrieval()` function  
3. Test with existing `move_ruckus_ap` scenarios

### Phase 2: Create Unified Tool
1. Implement `update_ruckus_ap` MCP tool
2. Test all property update scenarios
3. Verify property preservation

### Phase 3: Add Convenience Tools  
1. Implement `move_ap_to_venue`, `move_ap_to_group`, `rename_ap`
2. Update documentation and examples
3. Deprecate old `move_ruckus_ap` tool

### Phase 4: Cleanup
1. Remove old implementation
2. Update CLAUDE.md guidance
3. Add comprehensive tests

## Implementation Priority

1. **High**: Core retrieve-then-update mechanism
2. **High**: Unified `update_ruckus_ap` tool  
3. **Medium**: Convenience tools for common operations
4. **Low**: Migration and cleanup of old tools

This approach provides a robust, flexible foundation for AP management while solving the current property loss issues.