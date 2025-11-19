# RUCKUS One MCP Server - Tests

This directory contains test files for the MCP server tools.

## Test Files

### `query-and-get-wifi-networks.test.ts`
Tests the WiFi network query and retrieval tools:
- `query_wifi_networks` - Query WiFi networks with filtering and pagination
- `get_wifi_network` - Get detailed WiFi network information by ID

**Usage:**
```bash
npm run test:wifi-networks
# or: npx ts-node tests/query-and-get-wifi-networks.test.ts
```

### `query-and-manage-venues.test.ts`
Tests venue query and management tools:
- `get_ruckus_venues` - Query all venues
- `create_ruckus_venue` - Create a new venue
- `update_ruckus_venue` - Update venue properties
- `delete_ruckus_venue` - Delete a venue

**Usage:**
```bash
npm run test:venues
# or: npx ts-node tests/query-and-manage-venues.test.ts
```

### `query-and-manage-aps.test.ts`
Tests access point query and management tools:
- `query_ruckus_aps` - Query APs with filtering and pagination
- `get_ap_details` - Get detailed AP information by serial number
- `update_ruckus_ap` - Update AP properties (name, venue, group)

**Usage:**
```bash
npm run test:aps
# or: npx ts-node tests/query-and-manage-aps.test.ts
```

### `query-and-manage-ap-groups.test.ts`
Tests AP group query and management tools:
- `query_ruckus_ap_groups` - Query AP groups with filtering
- `create_ruckus_ap_group` - Create a new AP group
- `update_ruckus_ap_group` - Update AP group properties
- `delete_ruckus_ap_group` - Delete an AP group

**Usage:**
```bash
npm run test:ap-groups
# or: npx ts-node tests/query-and-manage-ap-groups.test.ts
```

## Running Tests

### Prerequisites
- Valid RUCKUS One credentials configured in `.env` file
- Required environment variables:
  - `RUCKUS_TENANT_ID`
  - `RUCKUS_CLIENT_ID`
  - `RUCKUS_CLIENT_SECRET`
  - `RUCKUS_REGION` (optional)

### Run Individual Test
```bash
npx ts-node tests/<test-file-name>.test.ts
```

### Run Specific Test
```bash
npm run test:wifi-networks    # WiFi network tools
npm run test:venues           # Venue management
npm run test:aps              # Access point management
npm run test:ap-groups        # AP group management
```

### Run All Integration Tests (Future)
```bash
# TODO: Add script to run all integration tests sequentially
```

## Test Naming Convention

Test files should be named to clearly indicate what they test:
- Format: `<action>-<resource>.test.ts`
- Examples:
  - `query-and-get-wifi-networks.test.ts`
  - `create-and-delete-venue.test.ts`
  - `update-ap-group.test.ts`

## Writing New Tests

When adding new MCP tools, create corresponding test files:

1. Create test file in `tests/` directory
2. Import required functions from `src/services/ruckusApiService`
3. Test authentication first
4. Test each tool operation
5. Include error cases
6. Verify response structure

Example structure:
```typescript
import dotenv from 'dotenv';
import { getRuckusJwtToken, yourNewFunction } from '../src/services/ruckusApiService';

dotenv.config();

async function testYourNewTool() {
  // 1. Get auth token
  // 2. Test basic operation
  // 3. Test with different parameters
  // 4. Test error cases
  // 5. Verify results
}

testYourNewTool();
```

## Notes

- Tests make real API calls to RUCKUS One
- Some tests may create/modify/delete resources
- Always verify the environment before running destructive tests
- Test files use `ts-node` for direct TypeScript execution
