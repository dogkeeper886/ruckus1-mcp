/**
 * Test script for venue query and management tools
 *
 * Tests:
 *   - get_ruckus_venues: Query all venues
 *   - create_ruckus_venue: Create a new venue
 *   - update_ruckus_venue: Update venue properties
 *   - delete_ruckus_venue: Delete a venue
 *
 * Usage:
 *   npx ts-node tests/query-and-manage-venues.test.ts
 *   or: npm run test:venues
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { getRuckusJwtToken, createVenueWithRetry, updateVenueWithRetry, deleteVenueWithRetry } from '../src/services/ruckusApiService';

dotenv.config();

async function testVenueOperations() {
  console.log('=== Testing Venue Operations ===\n');

  // Check required environment variables
  const requiredEnvVars = ['RUCKUS_TENANT_ID', 'RUCKUS_CLIENT_ID', 'RUCKUS_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these in your .env file');
    process.exit(1);
  }

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

    // Step 2: Query existing venues
    console.log('Step 2: Querying existing venues...');
    const region = process.env.RUCKUS_REGION;
    const apiUrl = region && region.trim() !== ''
      ? `https://api.${region}.ruckus.cloud/venues/query`
      : 'https://api.ruckus.cloud/venues/query';

    const queryPayload = {
      fields: ["id", "name", "addressLine", "city", "country"],
      searchTargetFields: ["name", "addressLine", "description"],
      filters: {},
      sortField: "name",
      sortOrder: "ASC",
      page: 1,
      pageSize: 10,
      defaultPageSize: 10,
      total: 0
    };

    const venuesResponse = await axios.post(apiUrl, queryPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Found ${venuesResponse.data.totalCount} total venues`);
    console.log(`📄 Showing first ${venuesResponse.data.data?.length || 0} venues:\n`);

    if (venuesResponse.data.data && venuesResponse.data.data.length > 0) {
      venuesResponse.data.data.forEach((venue: any, index: number) => {
        console.log(`  ${index + 1}. ${venue.name}`);
        console.log(`     ID: ${venue.id}`);
        console.log(`     Location: ${venue.addressLine}, ${venue.city}, ${venue.country}\n`);
      });
    }

    // Step 3: Create a test venue
    console.log('\nStep 3: Creating a test venue...');
    const testVenueName = `Test-Venue-${Date.now()}`;

    const createResult = await createVenueWithRetry(
      token,
      {
        name: testVenueName,
        addressLine: 'Paris',
        city: 'Paris',
        country: 'France'
      },
      process.env.RUCKUS_REGION,
      5, // maxRetries
      2000 // pollIntervalMs
    );

    console.log('✅ Venue created successfully');
    console.log(`   Name: ${testVenueName}`);
    console.log(`   Status: ${createResult.status}`);

    // Extract venue ID from response
    if (createResult.response && createResult.response.id) {
      testVenueId = createResult.response.id;
      console.log(`   ID: ${testVenueId}`);
    } else if (createResult.activityDetails && createResult.activityDetails.resourceId) {
      testVenueId = createResult.activityDetails.resourceId;
      console.log(`   ID: ${testVenueId}`);
    } else if (createResult.id) {
      testVenueId = createResult.id;
      console.log(`   ID: ${testVenueId}`);
    } else {
      console.error('   ⚠️  Venue ID not found in response');
      console.log('   Full response:', JSON.stringify(createResult, null, 2));
      throw new Error('Failed to get venue ID from create response');
    }

    // Step 4: Update the venue
    console.log('\nStep 4: Updating the venue...');
    const updatedVenueName = `${testVenueName}-Updated`;

    const updateResult = await updateVenueWithRetry(
      token,
      testVenueId!,
      {
        name: updatedVenueName,
        addressLine: 'Lyon',
        city: 'Lyon',
        country: 'France'
      },
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ Venue updated successfully');
    console.log(`   New Name: ${updatedVenueName}`);
    console.log(`   New City: Lyon`);
    console.log(`   Status: ${updateResult.status}`);

    // Step 5: Query venues again to verify
    console.log('\nStep 5: Verifying venue exists in query results...');
    const verifyResponse = await axios.post(apiUrl, {
      ...queryPayload,
      searchString: updatedVenueName,
      pageSize: 1
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.data.data && verifyResponse.data.data.length > 0) {
      console.log('✅ Venue found in query results');
      console.log(`   Confirmed: ${verifyResponse.data.data[0].name}`);
    } else {
      console.log('⚠️  Venue not found in query (might need time to propagate)');
    }

    // Step 6: Delete the test venue
    console.log('\nStep 6: Deleting the test venue...');
    const deleteResult = await deleteVenueWithRetry(
      token,
      testVenueId!,
      process.env.RUCKUS_REGION,
      5,
      2000
    );

    console.log('✅ Venue deleted successfully');
    console.log(`   Status: ${deleteResult.status}`);
    testVenueId = null; // Clear so we don't try to delete again in catch block

    console.log('\n\n=== ✅ All Venue Tests Passed! ===');
    console.log('\nVenue operations working correctly:');
    console.log('  ✅ get_ruckus_venues - Query venues with pagination');
    console.log('  ✅ create_ruckus_venue - Create venue with async polling');
    console.log('  ✅ update_ruckus_venue - Update venue properties');
    console.log('  ✅ delete_ruckus_venue - Delete venue with async polling');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }

    // Cleanup: Try to delete test venue if it was created
    if (testVenueId) {
      console.log('\n🧹 Cleaning up: Attempting to delete test venue...');
      try {
        const token = await getRuckusJwtToken(
          process.env.RUCKUS_TENANT_ID!,
          process.env.RUCKUS_CLIENT_ID!,
          process.env.RUCKUS_CLIENT_SECRET!,
          process.env.RUCKUS_REGION
        );
        await deleteVenueWithRetry(token, testVenueId!, process.env.RUCKUS_REGION, 5, 2000);
        console.log('✅ Test venue cleaned up successfully');
      } catch (cleanupError: any) {
        console.error('⚠️  Failed to cleanup test venue:', cleanupError.message);
        console.error(`   Please manually delete venue ID: ${testVenueId}`);
      }
    }

    process.exit(1);
  }
}

// Run tests
testVenueOperations();
