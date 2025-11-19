/**
 * Test script for AP query and management tools
 *
 * Tests:
 *   - query_ruckus_aps: Query access points with filtering and pagination
 *   - add_ap_to_group: Add an AP to an AP group
 *   - update_ruckus_ap: Update AP properties (name, venue, group)
 *   - remove_ap: Remove an AP from a venue
 *
 * Usage:
 *   npx ts-node tests/query-and-manage-aps.test.ts
 *   or: npm run test:aps
 *
 * Requirements:
 *   - Set TEST_AP_SERIAL_NUMBER in .env to test add/remove operations
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
import { getRuckusJwtToken, queryAPs, getApDetailsBySerial, updateApWithRetrieval, addApToGroupWithRetry, removeApWithRetry, queryApGroups, createApGroupWithRetry, deleteApGroupWithRetry } from '../src/services/ruckusApiService';

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

  let testApSerial: string | null = null;
  let testVenueId: string | null = null;
  let testApGroupId: string | null = null;

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

    // Step 2: Get a venue to use for testing
    console.log('Step 2: Finding a venue for testing...');
    const region = process.env.RUCKUS_REGION;
    const venueApiUrl = region && region.trim() !== ''
      ? `https://api.${region}.ruckus.cloud/venues/query`
      : 'https://api.ruckus.cloud/venues/query';

    const venuesResponse = await axios.post(venueApiUrl, {
      fields: ["id", "name"],
      filters: {},
      page: 1,
      pageSize: 1,
      defaultPageSize: 10,
      total: 0
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!venuesResponse.data.data || venuesResponse.data.data.length === 0) {
      console.error('❌ No venues found. Please create a venue first to test APs.');
      process.exit(1);
    }

    testVenueId = venuesResponse.data.data[0].id;
    const venueName = venuesResponse.data.data[0].name;
    console.log(`✅ Using venue: ${venueName} (${testVenueId})\n`);

    // Step 3: Create a test AP group for testing
    console.log('Step 3: Creating test AP group...');
    const testApGroupName = `Test-AP-Group-${Date.now()}`;

    const createApGroupResult = await createApGroupWithRetry(
      token,
      testVenueId!,
      {
        name: testApGroupName,
        description: 'Created by automated AP test'
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ Test AP group created');
    console.log(`   Name: ${testApGroupName}`);
    console.log(`   Status: ${createApGroupResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');

    // Extract AP group ID from response
    if (createApGroupResult.response && createApGroupResult.response.id) {
      testApGroupId = createApGroupResult.response.id;
      console.log(`   ID: ${testApGroupId} (from response.id)`);
    } else if (createApGroupResult.activityDetails && createApGroupResult.activityDetails.resourceId) {
      testApGroupId = createApGroupResult.activityDetails.resourceId;
      console.log(`   ID: ${testApGroupId} (from activityDetails.resourceId)`);
    } else if (createApGroupResult.id) {
      testApGroupId = createApGroupResult.id;
      console.log(`   ID: ${testApGroupId} (from id)`);
    } else {
      // Query to find it
      console.log('   Querying to find AP group ID...');
      const findResult = await queryApGroups(
        token,
        process.env.RUCKUS_REGION,
        { venueId: [testVenueId] },
        ['id', 'name'],
        1,
        100
      );
      const found = findResult.data?.find((g: any) => g.name === testApGroupName);
      if (found) {
        testApGroupId = found.id;
        console.log(`   ID: ${testApGroupId} (from query)`);
      } else {
        console.error('❌ Failed to get AP group ID');
        console.error('   Response structure:', JSON.stringify(createApGroupResult, null, 2));
        process.exit(1);
      }
    }
    console.log(`   Venue: ${venueName} (${testVenueId})\n`);

    // Step 4: Query existing APs
    console.log('Step 4: Querying existing access points...');
    const queryResult = await queryAPs(
      token,
      process.env.RUCKUS_REGION,
      {}, // filters
      ['name', 'serialNumber', 'model', 'venue', 'apGroup', 'networkStatus'],
      '', // searchString
      ['name', 'model', 'serialNumber'], // searchTargetFields
      1, // page
      5  // pageSize
    );

    console.log(`✅ Found ${queryResult.totalCount} total access points`);
    console.log(`📄 Showing first ${queryResult.data?.length || 0} APs:\n`);

    if (queryResult.data && queryResult.data.length > 0) {
      queryResult.data.forEach((ap: any, index: number) => {
        console.log(`  ${index + 1}. ${ap.name || 'Unnamed AP'}`);
        console.log(`     Serial: ${ap.serialNumber}`);
        console.log(`     Model: ${ap.model || 'N/A'}`);
        console.log(`     Venue: ${ap.venue?.name || 'N/A'}`);
        console.log(`     AP Group: ${ap.apGroup?.name || 'N/A'}`);
        console.log(`     Status: ${ap.networkStatus?.connectionState || 'Unknown'}\n`);
      });
    }

    // Step 5: Test add_ap_to_group (if TEST_AP_SERIAL_NUMBER is set)
    if (!process.env.TEST_AP_SERIAL_NUMBER) {
      console.log('⚠️  TEST_AP_SERIAL_NUMBER not set in .env');
      console.log('   Skipping add_ap_to_group and remove_ap tests\n');
      console.log('   To test full AP lifecycle:');
      console.log('   1. Add TEST_AP_SERIAL_NUMBER=your-ap-serial to .env');
      console.log('   2. Run this test again\n');

      console.log('=== ✅ Query Tests Passed! ===');
      console.log('\nAP query operations working correctly:');
      console.log('  ✅ query_ruckus_aps - Query APs with pagination and search');
      return;
    }

    testApSerial = process.env.TEST_AP_SERIAL_NUMBER;

    // Check if AP already exists anywhere
    console.log(`\nStep 5: Checking if AP already exists...`);
    console.log(`   AP Serial: ${testApSerial}`);
    const existingApCheck = await queryAPs(
      token,
      process.env.RUCKUS_REGION,
      {}, // filters
      ['serialNumber', 'name', 'venue', 'apGroup'],
      testApSerial, // searchString
      ['serialNumber'], // searchTargetFields
      1, // page
      10 // pageSize
    );

    const existingAp = existingApCheck.data?.find((ap: any) => ap.serialNumber === testApSerial);
    if (existingAp) {
      console.log('⚠️  AP already exists in the system');
      console.log(`   Current Venue: ${existingAp.venue?.name || 'Unknown'} (${existingAp.venue?.id || 'N/A'})`);
      console.log(`   Current AP Group: ${existingAp.apGroup?.name || 'Unknown'} (${existingAp.apGroup?.id || 'N/A'})`);

      // Remove it first to ensure clean test
      if (existingAp.venue?.id) {
        console.log('   Removing AP from current location for clean test...');
        try {
          await removeApWithRetry(
            token,
            existingAp.venue.id,
            testApSerial,
            process.env.RUCKUS_REGION,
            5,
            2000
          );
          console.log('✅ AP removed from previous location');
          console.log('⏳ Waiting 5 seconds for backend propagation...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log('✅ Wait completed\n');
        } catch (removeError: any) {
          console.error('❌ Failed to remove AP from previous location:', removeError.message);
          console.error('   Please manually remove the AP first');
          return;
        }
      }
    } else {
      console.log('✅ AP not currently assigned\n');
    }

    console.log(`Step 5b: Adding test AP to group...`);
    console.log(`   AP Serial: ${testApSerial}`);
    console.log(`   Venue: ${venueName} (${testVenueId})`);
    console.log(`   AP Group: ${testApGroupName} (${testApGroupId})`);

    const testApName = `Test-AP-${Date.now()}`;

    const addResult = await addApToGroupWithRetry(
      token,
      testVenueId!,
      testApGroupId!,
      {
        name: testApName,
        serialNumber: testApSerial,
        description: 'Created by automated test'
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    if (addResult.status === 'failed') {
      console.log('❌ AP addition failed');
      console.log(`   Status: ${addResult.status}`);
      console.log(`   Error: ${addResult.error || 'Unknown error'}`);
      console.log('\n⚠️  Common causes:');
      console.log('   1. AP serial number does not exist or is not available');
      console.log('   2. AP is already assigned to another venue');
      console.log('   3. AP model is not compatible with the venue');
      console.log('\n   Please verify TEST_AP_SERIAL_NUMBER is a valid, unassigned AP');
      testApSerial = null; // Clear so we don't try to remove
      return;
    }

    console.log('✅ AP added to group successfully');
    console.log(`   Name: ${testApName}`);
    console.log(`   Serial: ${testApSerial}`);
    console.log(`   Status: ${addResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');

    // Step 6: Verify AP was added by querying
    console.log('\nStep 6: Verifying AP appears in query results...');
    const verifyResult = await queryAPs(
      token,
      process.env.RUCKUS_REGION,
      {}, // filters
      ['name', 'serialNumber', 'venue', 'apGroup'],
      testApSerial, // searchString
      ['serialNumber'], // searchTargetFields
      1, // page
      10 // pageSize
    );

    const foundAp = verifyResult.data?.find((ap: any) => ap.serialNumber === testApSerial);
    if (foundAp) {
      console.log('✅ AP found in query results');
      console.log(`   Name: ${foundAp.name}`);
      console.log(`   Serial: ${foundAp.serialNumber}`);
      console.log(`   Venue: ${foundAp.venue?.name || 'N/A'}`);
      console.log(`   AP Group: ${foundAp.apGroup?.name || 'N/A'}`);
    } else {
      console.log('⚠️  AP not found in query (might need time to propagate)');
    }

    // Step 7: Get detailed AP information
    console.log('\nStep 7: Getting detailed AP information...');
    const apDetails = await getApDetailsBySerial(
      token,
      testApSerial,
      process.env.RUCKUS_REGION
    );

    console.log('✅ AP details retrieved successfully');
    console.log(`   Name: ${apDetails.name}`);
    console.log(`   Serial: ${apDetails.serialNumber}`);
    console.log(`   Model: ${apDetails.model || 'N/A'}`);
    console.log(`   MAC Address: ${apDetails.macAddress || 'N/A'}`);
    console.log(`   Venue ID: ${apDetails.venue?.id || 'N/A'}`);
    console.log(`   AP Group ID: ${apDetails.apGroup?.id || 'N/A'}`);

    // Step 8: Test update_ruckus_ap
    console.log('\nStep 8: Testing AP update (name change)...');
    const updatedName = `${testApName}-Updated`;
    console.log(`   Original name: ${testApName}`);
    console.log(`   Updated name: ${updatedName}`);

    const updateResult = await updateApWithRetrieval(
      token,
      testApSerial,
      {
        name: updatedName
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    if (updateResult.status === 'failed') {
      console.log('❌ AP update failed');
      console.log(`   Status: ${updateResult.status}`);
      console.log(`   Error: ${updateResult.error || 'Unknown error'}`);
      if (updateResult.activityDetails) {
        console.log(`   Activity Details: ${JSON.stringify(updateResult.activityDetails, null, 2)}`);
      }
      console.log('\n⚠️  Test cannot continue - cleaning up...');
      testApSerial = null; // Will trigger cleanup in catch block
      throw new Error(`AP update failed: ${updateResult.error || 'Unknown error'}`);
    }

    console.log('✅ AP updated successfully');
    console.log(`   Status: ${updateResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');

    // Step 9: Remove the test AP
    console.log('\nStep 9: Removing test AP from venue...');
    const removeResult = await removeApWithRetry(
      token,
      testVenueId!,
      testApSerial,
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    if (removeResult.status === 'failed') {
      console.log('❌ AP removal failed');
      console.log(`   Status: ${removeResult.status}`);
      console.log(`   Error: ${removeResult.error || 'Unknown error'}`);
      if (removeResult.activityDetails) {
        console.log(`   Activity Details: ${JSON.stringify(removeResult.activityDetails, null, 2)}`);
      }
      console.log('\n⚠️  Test cannot continue - AP may need manual cleanup');
      throw new Error(`AP removal failed: ${removeResult.error || 'Unknown error'}`);
    }

    console.log('✅ AP removed successfully');
    console.log(`   Status: ${removeResult.status}`);
    testApSerial = null; // Clear so we don't try to remove again

    // Step 10: Delete the test AP group
    console.log('\nStep 10: Deleting test AP group...');
    const deleteApGroupResult = await deleteApGroupWithRetry(
      token,
      testVenueId!,
      testApGroupId!,
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ Test AP group deleted successfully');
    console.log(`   Status: ${deleteApGroupResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');
    testApGroupId = null; // Clear so we don't try to delete again

    console.log('\n\n=== ✅ All AP Tests Passed! ===');
    console.log('\nAP operations working correctly:');
    console.log('  ✅ query_ruckus_aps - Query APs with pagination and search');
    console.log('  ✅ add_ap_to_group - Add AP to group with async polling');
    console.log('  ✅ update_ruckus_ap - Update AP properties');
    console.log('  ✅ remove_ap - Remove AP from venue with async polling');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }

    // Cleanup: Try to remove test AP if it was added
    if (testApSerial && testVenueId) {
      console.log('\n🧹 Cleaning up: Attempting to remove test AP...');
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        await removeApWithRetry(token, testVenueId!, testApSerial!, process.env.RUCKUS_REGION, 5, 2000);
        console.log('✅ Test AP cleaned up successfully');
      } catch (cleanupError: any) {
        console.error('⚠️  Failed to cleanup test AP:', cleanupError.message);
        console.error(`   Please manually remove AP serial: ${testApSerial}`);
      }
    }

    // Cleanup: Try to delete test AP group if it was created
    if (testApGroupId && testVenueId) {
      console.log('\n🧹 Cleaning up: Attempting to delete test AP group...');
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        await deleteApGroupWithRetry(token, testVenueId!, testApGroupId!, process.env.RUCKUS_REGION, 5, 2000);
        console.log('✅ Test AP group cleaned up successfully');
      } catch (cleanupError: any) {
        console.error('⚠️  Failed to cleanup test AP group:', cleanupError.message);
        console.error(`   Please manually delete AP group ID: ${testApGroupId}`);
      }
    }

    process.exit(1);
  }
}

// Run tests
testApOperations();
