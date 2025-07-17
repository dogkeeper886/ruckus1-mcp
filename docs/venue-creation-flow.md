# Venue Creation Flow Documentation

## Overview

This document describes the implementation of the `create_ruckus_venue_with_retry` function and its flow based on actual RUCKUS One API behavior.

## Function Flow

### 1. Initial API Call
```typescript
const response = await axios.post(apiUrl, payload, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

- **Always returns**: `requestId` regardless of success/failure
- **Success**: HTTP 202 with venue data in `response` field
- **Failure**: HTTP 400 with validation errors but still includes `requestId`

### 2. Extract Activity ID
```typescript
const activityId = createResponse.requestId;
```

- **Key Finding**: Always use `requestId` from the create response
- **Previous Bug**: Code incorrectly assumed `requestId` might be missing
- **Correction**: Venue creation always returns `requestId` for async tracking

### 3. Polling Loop
```typescript
while (retryCount < maxRetries) {
  const activityDetails = await getRuckusActivityDetails(token, activityId, region);
  
  const isCompleted = activityDetails.endDatetime !== undefined;
  const isFailed = activityDetails.status !== 'SUCCESS' && 
                   activityDetails.status !== 'INPROGRESS';
  
  if (isCompleted) {
    // Check final status
  }
  
  if (isFailed) {
    // Handle failure
  }
  
  // Wait and retry
}
```

### 4. Completion Detection

**Critical Discovery**: Use `endDatetime` field to detect completion, not status values.

#### Status During Lifecycle
1. **In Progress**: `status: "INPROGRESS"`, `endDatetime: undefined`
2. **Completed**: `status: "SUCCESS"`, `endDatetime: "2025-07-17T08:51:57Z"`
3. **Failed**: `status: "FAILED"` (or other non-SUCCESS), `endDatetime: "..."`

#### Implementation Logic
```typescript
// Check if operation is completed (has endDatetime populated)
const isCompleted = activityDetails.endDatetime !== undefined;

// Check if operation failed (status is not SUCCESS or INPROGRESS)
const isFailed = 
  activityDetails.status !== 'SUCCESS' && 
  activityDetails.status !== 'INPROGRESS';

if (isCompleted) {
  // Check if it completed successfully
  if (activityDetails.status === 'SUCCESS') {
    return { status: 'completed', ... };
  } else {
    return { status: 'failed', ... };
  }
}
```

## Return Values

### Success Response
```json
{
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "response": {
    "id": "45ae93a7e9034e4388681eeaf58fe831",
    "name": "Test Venue 1752742317063",
    "address": { ... }
  },
  "activityDetails": { ... },
  "status": "completed",
  "message": "Venue created successfully"
}
```

### Failure Response
```json
{
  "requestId": "2efb45d4-cbc6-4185-a178-9f1f377f5de7",
  "response": { ... },
  "activityDetails": { ... },
  "status": "failed",
  "message": "Venue creation failed",
  "error": "Country code is not supported by AP firmware!"
}
```

### Timeout Response
```json
{
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "response": { ... },
  "status": "timeout",
  "message": "Venue creation status unknown - polling timeout",
  "activityId": "df0e4041-a575-4e74-9a41-47ed491c9456"
}
```

## Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxRetries` | 5 | Maximum number of polling attempts |
| `pollIntervalMs` | 2000 | Milliseconds between polling attempts |

## Error Handling

### 1. Missing RequestId
```typescript
if (!activityId) {
  throw new Error('No requestId returned from venue creation API');
}
```

### 2. Polling Failures
- Individual polling failures increment retry counter
- Continue polling until max retries reached
- Return timeout status if all retries exhausted

### 3. API Errors
- HTTP 400: Validation errors (still trackable via requestId)
- HTTP 401/403: Authentication errors (re-throw)
- HTTP 5xx: Server errors (re-throw)

## Testing Results

From our test run:
- **Create Response**: HTTP 202 with `requestId` and venue data
- **Activity Status**: Started as `"INPROGRESS"`, completed as `"SUCCESS"`
- **Completion Time**: ~2 seconds (1 poll cycle)
- **Completion Indicator**: `endDatetime` field populated

## Key Learnings

1. **Always Async**: All venue creation operations are asynchronous
2. **RequestId Always Present**: Even validation failures return requestId
3. **EndDatetime is Key**: Use `endDatetime` presence to detect completion
4. **Status Values**: `INPROGRESS` → `SUCCESS` (or failure status)
5. **Polling Strategy**: 2-second intervals, 5 retries is sufficient for most cases

## Previous Implementation Issues

1. **Wrong Assumption**: Believed requestId might be missing for sync operations
2. **Incorrect Status Checking**: Used lowercase status values (`'success'` vs `'SUCCESS'`)
3. **Missing Completion Logic**: Didn't check for `endDatetime` field
4. **Overly Complex**: Multiple status/state field checks instead of simple `endDatetime` logic