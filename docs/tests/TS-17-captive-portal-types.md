---
id: TS-17
title: Captive-portal types on create_wifi_network
namespace: ruckus1-mcp
story: STORY-017
story_hash: a12ffde2ddb1d24521c8f49f7daf93e644ca7e6949900a5d31dd3188d8470df0
status: green
---

## Why this scenario exists

Captive-portal type exposure on create_wifi_network: click-through, guest pass, and rejection of the legacy type=guest.

### TC-01: Click-Through WiFi network lifecycle - create, verify captiveType, delete

- **Objective:** Click-Through WiFi network lifecycle - create, verify captiveType, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-334.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | completed |
| 2 | Capture portal profile ID | mcp-test-portal-ct-{{TEST_RUN_ID}} |
| 3 | Create Click-Through WiFi network | networkId |
| 4 | Verify network has captiveType=ClickThrough | mcp-test-clickthrough-{{TEST_RUN_ID}} |
| 5 | Delete WiFi network | completed |
| 6 | Delete portal service profile | completed |

### TC-02: Guest Pass WiFi network via new type=guestPass - regression for rename

- **Objective:** Guest Pass WiFi network via new type=guestPass - regression for rename.
- **Script:** cicd/tests/testcases/integration/TC-INT-335.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | completed |
| 2 | Capture portal profile ID | mcp-test-portal-gp-{{TEST_RUN_ID}} |
| 3 | Create Guest Pass WiFi network with new type=guestPass | networkId |
| 4 | Verify network has captiveType=GuestPass | mcp-test-guestpass-{{TEST_RUN_ID}} |
| 5 | Delete WiFi network | completed |
| 6 | Delete portal service profile | completed |

### TC-03: Legacy type=guest is rejected after breaking-change rename

- **Objective:** Legacy type=guest is rejected after breaking-change rename.
- **Script:** cicd/tests/testcases/integration/TC-INT-336.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Attempt create_wifi_network with legacy type=guest | isError |
