---
id: TS-14
title: Venue WiFi scheduler get/update + builder
namespace: ruckus1-mcp
story: STORY-013
story_hash: be57afc42302078aed06e2322906f65ff8cf21af6d414eb44ffc40ab55761a86
status: green
---

## Why this scenario exists

Venue WiFi-network scheduler get/update and the new-format scheduler builder round-trip.

### TC-01: Venue WiFi network settings lifecycle - get and update scheduler

- **Objective:** Venue WiFi network settings lifecycle - get and update scheduler.
- **Script:** cicd/tests/testcases/integration/TC-INT-324.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue | completed |
| 2 | Capture venue ID | mcp-test-venue-sched-{{TEST_RUN_ID}} |
| 3 | Create PSK WiFi network | networkId |
| 4 | Capture network ID | mcp-test-wifi-sched-{{TEST_RUN_ID}} |
| 5 | Activate network at venue | completed |
| 6 | GET settings - verify default state (no scheduler field when ALWAYS_ON) | isAllApGroups |
| 7 | PUT settings - change to CUSTOM scheduler | completed |
| 8 | GET settings - verify CUSTOM scheduler applied | CUSTOM |
| 9 | PUT settings - change back to ALWAYS_ON | completed |
| 10 | GET settings - verify ALWAYS_ON restored (no scheduler field) | isAllApGroups |
| 11 | Deactivate network from venue | completed |
| 12 | Delete WiFi network | completed |
| 13 | Delete test venue | completed |

### TC-02: WiFi scheduler builder + new-format scheduler round-trip

- **Objective:** WiFi scheduler builder + new-format scheduler round-trip.
- **Script:** cicd/tests/testcases/integration/TC-INT-325.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Build ALWAYS_ON scheduler | ALWAYS_ON |
| 2 | Build LEGACY_CUSTOM scheduler | CUSTOM |
| 3 | Build BASIC scheduler | BASIC |
| 4 | Build ADVANCED scheduler | ADVANCED |
| 5 | Builder rejects BASIC mode missing required fields | Error building scheduler config |
| 6 | Create test venue | completed |
| 7 | Capture venue ID | mcp-test-venue-sched-new-{{TEST_RUN_ID}} |
| 8 | Create PSK WiFi network | networkId |
| 9 | Capture network ID | mcp-test-wifi-sched-new-{{TEST_RUN_ID}} |
| 10 | Activate network with BASIC new-format scheduler | completed |
| 11 | GET settings - verify BASIC new-format fields round-trip | CUSTOM |
| 12 | Update to ADVANCED new-format scheduler | completed |
| 13 | GET settings - verify ADVANCED new-format fields round-trip | ADVANCED |
| 14 | Deactivate network from venue | completed |
| 15 | Delete WiFi network | completed |
| 16 | Delete test venue | completed |
