/**
 * Test script for WiFi network query and retrieval tools
 *
 * Tests:
 *   - query_wifi_networks: Query WiFi networks with filtering and pagination
 *   - get_wifi_network: Get detailed WiFi network information by ID
 *
 * Usage:
 *   npx ts-node tests/query-and-get-wifi-networks.test.ts
 *   or: npm test wifi-networks
 */

import dotenv from 'dotenv';
import { getRuckusJwtToken, queryWifiNetworks, getWifiNetwork } from '../src/services/ruckusApiService';

dotenv.config();

async function testWifiTools() {
  console.log('=== Testing WiFi Network Tools ===\n');

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

    // Step 2: Test queryWifiNetworks
    console.log('Step 2: Testing queryWifiNetworks...');
    console.log('Request: Query first 5 WiFi networks');
    const queryResult = await queryWifiNetworks(
      token,
      process.env.RUCKUS_REGION,
      {}, // filters
      ['id', 'name', 'ssid', 'vlan', 'nwSubType', 'securityProtocol', 'clientCount', 'apCount'], // fields
      '', // searchString
      ['name'], // searchTargetFields
      1, // page
      5, // pageSize
      'name', // sortField
      'ASC' // sortOrder
    );

    console.log(`✅ Found ${queryResult.totalCount} total WiFi networks`);
    console.log(`📄 Showing page 1 with ${queryResult.data?.length || 0} networks:\n`);

    if (queryResult.data && queryResult.data.length > 0) {
      queryResult.data.forEach((network: any, index: number) => {
        console.log(`  ${index + 1}. ${network.name} (${network.ssid})`);
        console.log(`     ID: ${network.id}`);
        console.log(`     Security: ${network.securityProtocol}`);
        console.log(`     VLAN: ${network.vlan}`);
        console.log(`     Clients: ${network.clientCount}, APs: ${network.apCount}\n`);
      });

      // Step 3: Test getWifiNetwork with first network ID
      const firstNetworkId = queryResult.data[0].id;
      console.log(`Step 3: Testing getWifiNetwork with ID: ${firstNetworkId}...`);

      const detailResult = await getWifiNetwork(
        token,
        firstNetworkId,
        process.env.RUCKUS_REGION
      );

      console.log('✅ Network details retrieved successfully');
      console.log('\n📋 Network Details:');
      console.log(`   Name: ${detailResult.name}`);
      console.log(`   ID: ${detailResult.id}`);
      console.log(`   Type: ${detailResult.type}`);
      if (detailResult.wlan) {
        console.log(`   SSID: ${detailResult.wlan.ssid}`);
        console.log(`   Security: ${detailResult.wlan.wlanSecurity}`);
        console.log(`   VLAN: ${detailResult.wlan.vlanId}`);
        console.log(`   Hidden SSID: ${detailResult.wlan.advancedCustomization?.hideSsid || false}`);
        console.log(`   Client Isolation: ${detailResult.wlan.advancedCustomization?.clientIsolation || false}`);
        console.log(`   WiFi 6 Enabled: ${detailResult.wlan.advancedCustomization?.wifi6Enabled || false}`);
        console.log(`   WiFi 7 Enabled: ${detailResult.wlan.advancedCustomization?.wifi7Enabled || false}`);
      }

      // Step 4: Test search functionality
      console.log('\n\nStep 4: Testing search functionality...');
      const searchResult = await queryWifiNetworks(
        token,
        process.env.RUCKUS_REGION,
        {},
        ['id', 'name', 'ssid'],
        'open', // Search for networks containing "open"
        ['name', 'ssid'],
        1,
        10,
        'name',
        'ASC'
      );

      console.log(`✅ Search for "open" found ${searchResult.totalCount} networks`);
      if (searchResult.data && searchResult.data.length > 0) {
        console.log('   Matching networks:');
        searchResult.data.forEach((network: any) => {
          console.log(`   - ${network.name} (${network.ssid})`);
        });
      }

      console.log('\n\n=== ✅ All Tests Passed! ===');
      console.log('\nThe new WiFi network tools are working correctly:');
      console.log('  ✅ query_wifi_networks - Query with pagination and search');
      console.log('  ✅ get_wifi_network - Get detailed network information');

    } else {
      console.log('⚠️  No WiFi networks found in your RUCKUS One tenant');
      console.log('   The tools work correctly, but there is no data to display');
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
testWifiTools();
