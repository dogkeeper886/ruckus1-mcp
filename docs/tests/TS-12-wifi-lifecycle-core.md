---
id: TS-12
title: WiFi network lifecycles (PSK + captive portal)
namespace: ruckus1-mcp
story: STORY-009
story_hash: 36b0e4095926b96f951fa93aaa19cb407b2c82eb3e0b88dc6f0ead8f06f2b57f
status: green
---

## Why this scenario exists

WiFi network create -> activate -> deactivate -> delete lifecycles across PSK, Self Sign-In, Directory, WISPr and Cloudpath types.

### TC-01: PSK WiFi network lifecycle - create, query, delete

- **Objective:** PSK WiFi network lifecycle - create, query, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-209.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create PSK WiFi network | completed |
| 2 | Find created network and capture ID | mcp-test-wifi-psk-{{TEST_RUN_ID}} |
| 3 | Delete WiFi network | completed |
| 4 | Verify network is gone | content |

### TC-02: Self Sign-In network with temporaryConnection round-trip

- **Objective:** Self Sign-In network with temporaryConnection round-trip.
- **Script:** cicd/tests/testcases/integration/TC-INT-326.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | requestId |
| 2 | Capture portal profile ID | mcp-test-portal-tc-{{TEST_RUN_ID}} |
| 3 | Create Self Sign-In WiFi network with temporaryConnection enabled | networkId |
| 4 | Capture network ID | mcp-test-wifi-tc-{{TEST_RUN_ID}} |
| 5 | GET network - verify temporaryConnection fields round-trip | temporaryConnectionEnabled |
| 6 | Partial update via update_wifi_network - add walled garden (retrieve-then-merge) | completed |
| 7 | GET network - verify walled garden persisted and temporaryConnection preserved | walledGardens |
| 8 | Sub-resource routing - re-attach portal via update_wifi_network | completed |
| 9 | Delete WiFi network | completed |
| 10 | Delete portal service profile | completed |

### TC-03: Directory (AD/LDAP) captive-portal WLAN lifecycle - create with directory binding, activate, deactivate, delete

- **Objective:** Directory (AD/LDAP) captive-portal WLAN lifecycle - create with directory binding, activate, deactivate, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-337.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue for directory WLAN activation | completed |
| 2 | Capture venue ID | mcp-test-dirwlan-venue-{{TEST_RUN_ID}} |
| 3 | Create directory server profile (companion) | completed |
| 4 | Capture directory server profile ID | mcp-test-dirwlan-dir-{{TEST_RUN_ID}} |
| 5 | Create portal service profile (companion) | completed |
| 6 | Capture portal profile ID | mcp-test-dirwlan-portal-{{TEST_RUN_ID}} |
| 7 | Create Directory WiFi network (binds portal + directory server profile) | networkId |
| 8 | Verify network exists and capture ID | mcp-test-dirwlan-{{TEST_RUN_ID}} |
| 9 | Activate directory WLAN at venue | completed |
| 10 | Deactivate directory WLAN from venue | completed |
| 11 | Delete WiFi network | completed |
| 12 | Delete portal service profile | completed |
| 13 | Delete directory server profile | completed |
| 14 | Delete test venue | completed |

### TC-04: WISPr (3rd-party captive portal) WLAN lifecycle - create with external provider + AAA server, verify, delete

- **Objective:** WISPr (3rd-party captive portal) WLAN lifecycle - create with external provider + AAA server, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-338.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create RADIUS authentication profile (the 3rd-party AAA server) | completed |
| 2 | Capture RADIUS profile ID | mcp-test-wispr-radius-{{TEST_RUN_ID}} |
| 3 | Create WISPr WiFi network (external provider URL + AAA server binding) | networkId |
| 4 | Verify network exists and capture ID | mcp-test-wispr-{{TEST_RUN_ID}} |
| 5 | Get network and verify WISPr external-provider config persisted | WISPr |
| 6 | Delete WiFi network | completed |
| 7 | Delete RADIUS authentication profile | completed |

### TC-05: Cloudpath captive-portal WLAN lifecycle - create with enrollment URL + AAA server, verify, delete

- **Objective:** Cloudpath captive-portal WLAN lifecycle - create with enrollment URL + AAA server, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-339.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create RADIUS authentication profile (the Cloudpath AAA server) | completed |
| 2 | Capture RADIUS profile ID | mcp-test-cloudpath-radius-{{TEST_RUN_ID}} |
| 3 | Create Cloudpath WiFi network (enrollment URL + AAA server + default walled garden) | networkId |
| 4 | Verify network exists and capture ID | mcp-test-cloudpath-{{TEST_RUN_ID}} |
| 5 | Get network and verify Cloudpath enrollment config persisted | Cloudpath |
| 6 | Delete WiFi network | completed |
| 7 | Delete RADIUS authentication profile | completed |
