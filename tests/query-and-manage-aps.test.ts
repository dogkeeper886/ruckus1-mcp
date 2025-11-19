/**
 * Test script for AP query and management tools
 *
 * Tests:
 *   - query_ruckus_aps: Query access points with filtering and pagination
 *   - get_ap_details: Get detailed AP information by serial number
 *   - update_ruckus_ap: Update AP properties (name, venue, group)
 *
 * Usage:
 *   npx ts-node tests/query-and-manage-aps.test.ts
 *   or: npm run test:aps
 */

import dotenv from 'dotenv';
import { getRuckusJwtToken, queryAPs, getApDetailsBySerial, updateApWithRetrieval } from '../src/services/ruckusApiService';

dotenv.config();

async function testApOperations() {
  console.log('=== Testing Access Point Operations ===\n');

  // Check required environment variables
  const requiredEnvVars = ['RUCKUS_TENANT_ID', 'RUCKUS_CLIENT_ID', 'RUCKUS_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these in your .env file');
    process.exit(1);
  }

  try {
    // Step 1: Get authentication token
    console.log('Step 1: Getting authentication token...');
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );
    console.log('✅ Authentication successful\n');

    // Step 2: Query all APs
    console.log('Step 2: Querying access points...');
    const queryResult = await queryAPs(
      token,
      process.env.RUCKUS_REGION,
      ['name', 'serialNumber', 'model', 'venue', 'apGroup', 'networkStatus', 'tags'],
      '', // searchString
      ['name', 'model', 'serialNumber', 'tags'],
      1, // page
      5  // pageSize
    );

    console.log(`✅ Found ${queryResult.totalCount} total access points`);
    console.log(`📄 Showing page 1 with ${queryResult.data?.length || 0} APs:\n`);

    if (queryResult.data && queryResult.data.length > 0) {
      queryResult.data.forEach((ap: any, index: number) => {
        console.log(`  ${index + 1}. ${ap.name || 'Unnamed AP'}`);
        console.log(`     Serial: ${ap.serialNumber}`);
        console.log(`     Model: ${ap.model}`);
        console.log(`     Venue: ${ap.venue?.name || 'N/A'}`);
        console.log(`     AP Group: ${ap.apGroup?.name || 'N/A'}`);
        console.log(`     Status: ${ap.networkStatus?.connectionState || 'Unknown'}`);
        console.log(`     IP Address: ${ap.networkStatus?.ipAddress || 'N/A'}\n`);
      });

      // Step 3: Get details for first AP
      const firstAp = queryResult.data[0];
      console.log(`Step 3: Getting detailed information for AP: ${firstAp.serialNumber}...`);

      const apDetails = await getApDetailsBySerial(
        token,
        firstAp.serialNumber,
        process.env.RUCKUS_REGION
      );

      console.log('✅ AP details retrieved successfully');
      console.log('\n📋 AP Details:');
      console.log(`   Name: ${apDetails.name || 'Unnamed'}`);
      console.log(`   Serial Number: ${apDetails.serialNumber}`);
      console.log(`   Model: ${apDetails.model}`);
      console.log(`   MAC Address: ${apDetails.macAddress}`);
      console.log(`   Firmware: ${apDetails.networkStatus?.fwVersion || 'N/A'}`);
      console.log(`   Uptime: ${apDetails.networkStatus?.uptimeInSec || 0} seconds`);
      console.log(`   Venue ID: ${apDetails.venue?.id || 'N/A'}`);
      console.log(`   AP Group ID: ${apDetails.apGroup?.id || 'N/A'}`);

      // Step 4: Test search functionality
      console.log('\n\nStep 4: Testing search functionality...');
      const searchResult = await queryAPs(
        token,
        process.env.RUCKUS_REGION,
        ['name', 'serialNumber', 'model'],
        firstAp.model, // Search by model
        ['model', 'name'],
        1,
        10
      );

      console.log(`✅ Search for model "${firstAp.model}" found ${searchResult.totalCount} APs`);
      if (searchResult.data && searchResult.data.length > 0) {
        console.log(`   First match: ${searchResult.data[0].name || searchResult.data[0].serialNumber}`);
      }

      // Step 5: Test update AP (optional - only if you want to test updates)
      console.log('\n\nStep 5: Testing AP update (name change)...');
      console.log('ℹ️  This will change the AP name temporarily for testing');

      const originalName = apDetails.name || 'Unnamed';
      const testName = `${originalName}-Test-${Date.now()}`;

      console.log(`   Original name: ${originalName}`);
      console.log(`   Test name: ${testName}`);
      console.log('   Updating...');

      const updateResult = await updateApWithRetrieval(
        token,
        firstAp.serialNumber,
        testName, // New AP name
        undefined, // Keep same venue
        undefined, // Keep same AP group
        process.env.RUCKUS_REGION,
        5,
        2000
      );

      console.log('✅ AP updated successfully');
      console.log(`   Status: ${updateResult.status}`);

      // Restore original name
      console.log('   Restoring original name...');
      await updateApWithRetrieval(
        token,
        firstAp.serialNumber,
        originalName,
        undefined,
        undefined,
        process.env.RUCKUS_REGION,
        5,
        2000
      );
      console.log('✅ AP name restored');

      console.log('\n\n=== ✅ All AP Tests Passed! ===');
      console.log('\nAP operations working correctly:');
      console.log('  ✅ query_ruckus_aps - Query APs with pagination and search');
      console.log('  ✅ get_ap_details - Get detailed AP information');
      console.log('  ✅ update_ruckus_ap - Update AP properties with polling');

    } else {
      console.log('⚠️  No access points found in your RUCKUS One tenant');
      console.log('   The query tools work correctly, but there is no data to test with');
      console.log('\n   To fully test AP operations:');
      console.log('   1. Add APs to your RUCKUS One tenant');
      console.log('   2. Run this test again');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testApOperations();
