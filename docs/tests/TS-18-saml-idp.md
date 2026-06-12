---
id: TS-18
title: SAML IdP profile and SAML WLAN lifecycle
namespace: ruckus1-mcp
story: STORY-025
story_hash: e1048367f15865c6546ac3a47e0748b4b3f4a53c96c2597f23c18aed011a03d4
status: green
---

## Why this scenario exists

SAML IdP profile CRUD and the SAML captive-portal WLAN bind/activate/deactivate lifecycle.

### TC-01: SAML IdP profile CRUD lifecycle - create, SP metadata, full-config update, verify, delete

- **Objective:** SAML IdP profile CRUD lifecycle - create, SP metadata, full-config update, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-340.yml
- **Preconditions:** valid RUCKUS One credentials and a SAML IdP reachable via SAML_IDP_METADATA_URL / SAML_IDP_HOST.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create SAML IdP profile (config-object create, metadataUrl fetched server-side) | completed |
| 2 | Find created profile and capture ID | mcp-test-saml-{{TEST_RUN_ID}} |
| 3 | Get profile with SP metadata - verify R1-generated SP entityID (derived from profileId) + ACS | serviceProviderMetadata |
| 4 | Full-config update - change phone claim mapping to 'mobile' (NOT a partial merge) | completed |
| 5 | Get profile - verify the full-config update applied (mobile) and name intact | mobile |
| 6 | Delete SAML IdP profile | completed |
| 7 | Verify profile is gone | totalCount |

### TC-02: SAML IdP captive-portal WLAN lifecycle - create with SAML IdP binding, activate, deactivate, delete

- **Objective:** SAML IdP captive-portal WLAN lifecycle - create with SAML IdP binding, activate, deactivate, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-341.yml
- **Preconditions:** valid RUCKUS One credentials and a SAML IdP reachable via SAML_IDP_METADATA_URL / SAML_IDP_HOST.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue for SAML WLAN activation | completed |
| 2 | Capture venue ID | mcp-test-samlwlan-venue-{{TEST_RUN_ID}} |
| 3 | Create SAML IdP profile (companion) | completed |
| 4 | Capture SAML IdP profile ID | mcp-test-samlwlan-idp-{{TEST_RUN_ID}} |
| 5 | Create portal service profile (companion) | completed |
| 6 | Capture portal profile ID | mcp-test-samlwlan-portal-{{TEST_RUN_ID}} |
| 7 | Create SAML WiFi network (binds portal + SAML IdP profile) | networkId |
| 8 | Verify network exists with captiveType SAML and capture ID | mcp-test-samlwlan-{{TEST_RUN_ID}} |
| 9 | Activate SAML WLAN at venue | completed |
| 10 | Deactivate SAML WLAN from venue | completed |
| 11 | Delete WiFi network | completed |
| 12 | Delete portal service profile | completed |
| 13 | Delete SAML IdP profile | completed |
| 14 | Delete test venue | completed |
