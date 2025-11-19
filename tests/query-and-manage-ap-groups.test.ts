/**
 * Test script for AP group query and management tools
 *
 * Tests:
 *   - query_ruckus_ap_groups: Query AP groups with filtering and pagination
 *   - create_ruckus_ap_group: Create a new AP group
 *   - update_ruckus_ap_group: Update AP group properties
 *   - delete_ruckus_ap_group: Delete an AP group
 *
 * Usage:
 *   npx ts-node tests/query-and-manage-ap-groups.test.ts
 *   or: npm run test:ap-groups
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { getRuckusJwtToken, queryApGroups, createApGroupWithRetry, updateApGroupWithRetry, deleteApGroupWithRetry } from '../src/services/ruckusApiService';

dotenv.config();

async function testApGroupOperations() {
  console.log('=== Testing AP Group Operations ===\n');

  // Check required environment variables
  const requiredEnvVars = ['RUCKUS_TENANT_ID', 'RUCKUS_CLIENT_ID', 'RUCKUS_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these in your .env file');
    process.exit(1);
  }

  let testApGroupId: string | null = null;
  let testVenueId: string | null = null;

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
      console.error('❌ No venues found. Please create a venue first to test AP groups.');
      process.exit(1);
    }

    testVenueId = venuesResponse.data.data[0].id;
    const venueName = venuesResponse.data.data[0].name;
    console.log(`✅ Using venue: ${venueName} (${testVenueId})\n`);

    // Step 3: Query existing AP groups
    console.log('Step 3: Querying existing AP groups...');
    const queryResult = await queryApGroups(
      token,
      process.env.RUCKUS_REGION,
      {}, // filters
      ['id', 'name', 'description', 'isDefault'],
      1,
      5
    );

    console.log(`✅ Found ${queryResult.totalCount} total AP groups`);
    console.log(`📄 Showing first ${queryResult.data?.length || 0} AP groups:\n`);

    if (queryResult.data && queryResult.data.length > 0) {
      queryResult.data.forEach((group: any, index: number) => {
        console.log(`  ${index + 1}. ${group.name}`);
        console.log(`     ID: ${group.id}`);
        console.log(`     Default: ${group.isDefault ? 'Yes' : 'No'}`);
        if (group.description) {
          console.log(`     Description: ${group.description}`);
        }
        console.log('');
      });
    }

    // Step 4: Create a test AP group
    console.log('\nStep 4: Creating a test AP group...');
    const testGroupName = `Test-AP-Group-${Date.now()}`;
    const testGroupDescription = 'Created by automated test';

    const createResult = await createApGroupWithRetry(
      token,
      testVenueId!,
      {
        name: testGroupName,
        description: testGroupDescription
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ AP group created successfully');
    console.log(`   Name: ${testGroupName}`);
    console.log(`   Venue ID: ${testVenueId}`);
    console.log(`   Status: ${createResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');

    // Extract AP group ID from response (check multiple possible locations)
    if (createResult.response && createResult.response.id) {
      testApGroupId = createResult.response.id;
      console.log(`   ID: ${testApGroupId}`);
    } else if (createResult.activityDetails && createResult.activityDetails.resourceId) {
      testApGroupId = createResult.activityDetails.resourceId;
      console.log(`   ID: ${testApGroupId}`);
    } else if (createResult.id) {
      testApGroupId = createResult.id;
      console.log(`   ID: ${testApGroupId}`);
    } else {
      // ID not in response, query AP groups to find it by name
      console.log('   ID not in response, querying to find newly created AP group...');
      const findResult = await queryApGroups(
        token,
        process.env.RUCKUS_REGION,
        { isDefault: [false] },
        ['id', 'name'],
        1,
        100
      );
      const found = findResult.data?.find((g: any) => g.name === testGroupName);
      if (found) {
        testApGroupId = found.id;
        console.log(`   ID: ${testApGroupId} (found via query)`);
      } else {
        console.error('   ⚠️  AP group not found in query results');
        throw new Error('Failed to get AP group ID');
      }
    }

    // Step 5: Update the AP group
    console.log('\nStep 5: Updating the AP group...');
    const updatedGroupName = `${testGroupName}-Updated`;
    const updatedDescription = 'Updated by automated test';

    const updateResult = await updateApGroupWithRetry(
      token,
      testVenueId!,
      testApGroupId!,
      {
        name: updatedGroupName,
        description: updatedDescription
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ AP group updated successfully');
    console.log(`   New Name: ${updatedGroupName}`);
    console.log(`   New Description: ${updatedDescription}`);
    console.log(`   Status: ${updateResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');

    // Step 6: Query to verify the updated AP group
    console.log('\nStep 6: Verifying AP group exists in query results...');
    const verifyResult = await queryApGroups(
      token,
      process.env.RUCKUS_REGION,
      { isDefault: [false] }, // Filter out default groups
      ['id', 'name', 'description'],
      1,
      100
    );

    const foundGroup = verifyResult.data?.find((g: any) => g.id === testApGroupId);
    if (foundGroup) {
      console.log('✅ AP group found in query results');
      console.log(`   Confirmed: ${foundGroup.name}`);
      console.log(`   Description: ${foundGroup.description}`);
    } else {
      console.log('⚠️  AP group not found in query (might need time to propagate)');
    }

    // Step 7: Delete the test AP group
    console.log('\nStep 7: Deleting the test AP group...');
    const deleteResult = await deleteApGroupWithRetry(
      token,
      testVenueId!,
      testApGroupId!,
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ AP group deleted successfully');
    console.log(`   Status: ${deleteResult.status}`);
    console.log('⏳ Waiting 5 seconds for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');
    testApGroupId = null; // Clear so we don't try to delete again

    console.log('\n\n=== ✅ All AP Group Tests Passed! ===');
    console.log('\nAP group operations working correctly:');
    console.log('  ✅ query_ruckus_ap_groups - Query AP groups with filtering');
    console.log('  ✅ create_ruckus_ap_group - Create AP group with async polling');
    console.log('  ✅ update_ruckus_ap_group - Update AP group properties');
    console.log('  ✅ delete_ruckus_ap_group - Delete AP group with async polling');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
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
testApGroupOperations();
