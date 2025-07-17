# RUCKUS One API Behavior Documentation

## Overview

This document describes the observed behavior of the RUCKUS One API based on testing and implementation findings.

## Authentication

- **Endpoint**: `https://{region}.ruckus.cloud/oauth2/token/{tenantId}`
- **Method**: POST
- **Grant Type**: `client_credentials`
- **Response**: JWT token in `access_token` field

## Venue Creation API

### Endpoint
- **URL**: `https://api.{region}.ruckus.cloud/venues`
- **Method**: POST
- **Headers**: `Authorization: Bearer {token}`, `Content-Type: application/json`

### Request Payload
```json
{
  "name": "Venue Name",
  "address": {
    "addressLine": "Street Address",
    "city": "City",
    "country": "Country Code",
    "latitude": 37.4220094,
    "longitude": -122.0847516,
    "timezone": "America/Los_Angeles"
  }
}
```

### Response Behavior

#### Success Response (HTTP 202)
```json
{
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "response": {
    "id": "45ae93a7e9034e4388681eeaf58fe831",
    "name": "Test Venue 1752742317063",
    "address": {
      "country": "USA",
      "city": "Mountain View",
      "addressLine": "1600 Amphitheatre Parkway",
      "latitude": 37.4220094,
      "longitude": -122.0847516,
      "timezone": "America/Los_Angeles"
    },
    "isTemplate": false,
    "isEnforced": false
  }
}
```

#### Error Response (HTTP 400)
```json
{
  "requestId": "2efb45d4-cbc6-4185-a178-9f1f377f5de7",
  "errors": [
    {
      "object": "VENUE-10001.message",
      "value": "Country code is not supported by AP firmware!",
      "code": "VENUE-10001.message",
      "message": "Country code is not supported by AP firmware!",
      "reason": "Provide a valid attribute"
    }
  ]
}
```

### Key Findings

1. **Always Returns RequestId**: Both successful and failed venue creation requests return a `requestId` field
2. **Asynchronous Operations**: All venue creation operations are asynchronous and require polling
3. **Status Codes**: 
   - `202 Accepted` - Operation initiated successfully
   - `400 Bad Request` - Validation errors (still returns requestId)

## Activity Details API

### Endpoint
- **URL**: `https://api.{region}.ruckus.cloud/activities/{activityId}`
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`

### Response Structure

#### In Progress Activity
```json
{
  "tenantId": "1a504b89c85f4dbc8a485e7498240510",
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "status": "INPROGRESS",
  "useCase": "AddVenue",
  "startDatetime": "2025-07-17T08:51:57Z",
  "steps": [
    {
      "id": "AddVenue",
      "description": "AddVenue",
      "status": "SUCCESS",
      "progressType": "REQUEST",
      "startDatetime": "2025-07-17T08:51:57Z",
      "endDatetime": "2025-07-17T08:51:57Z"
    }
  ]
}
```

#### Completed Activity
```json
{
  "tenantId": "1a504b89c85f4dbc8a485e7498240510",
  "requestId": "df0e4041-a575-4e74-9a41-47ed491c9456",
  "status": "SUCCESS",
  "useCase": "AddVenue",
  "startDatetime": "2025-07-17T08:51:57Z",
  "endDatetime": "2025-07-17T08:51:57Z",
  "steps": [
    {
      "id": "AddVenue",
      "description": "AddVenue",
      "status": "SUCCESS",
      "progressType": "REQUEST",
      "startDatetime": "2025-07-17T08:51:57Z",
      "endDatetime": "2025-07-17T08:51:57Z"
    }
  ]
}
```

### Status Values

- **`INPROGRESS`**: Activity is still running
- **`SUCCESS`**: Activity completed successfully
- **Other values**: Activity failed (exact failure statuses TBD)

### Completion Detection

**Key Finding**: The presence of `endDatetime` field indicates completion, not the status value.

- **In Progress**: `endDatetime` is `undefined` or missing
- **Completed**: `endDatetime` is populated with completion timestamp
- **Success/Failure**: Determined by `status` field when `endDatetime` is present

## Regional Endpoints

The API supports regional endpoints:
- **Global**: `https://api.ruckus.cloud/`
- **Regional**: `https://api.{region}.ruckus.cloud/`

Common regions: `us`, `eu`, `ap` (specific regions may vary)

## Error Handling

1. **Validation Errors**: Return HTTP 400 with `errors` array but still provide `requestId`
2. **Authentication Errors**: Return HTTP 401/403 
3. **Rate Limiting**: May return HTTP 429 (behavior not tested)
4. **Server Errors**: May return HTTP 5xx (behavior not tested)

## Polling Strategy

Based on observed behavior:
- **Initial Delay**: No delay needed, start polling immediately
- **Poll Interval**: 2 seconds is reasonable
- **Max Retries**: 5-10 attempts should be sufficient for most operations
- **Timeout**: Operations typically complete within 10-20 seconds