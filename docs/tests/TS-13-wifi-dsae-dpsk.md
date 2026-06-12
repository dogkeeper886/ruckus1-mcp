---
id: TS-13
title: OWE / DSAE / DPSK / identity-group lifecycles
namespace: ruckus1-mcp
story: STORY-012
story_hash: 8a1f20c2d16e9c951b33094efea3100f5455af61b2efd0db3feb352b9ca02ddb
status: green
---

## Why this scenario exists

OWE-Transition and DSAE dual-network lifecycles plus the identity-group and DPSK-service lifecycles they depend on.

### TC-01: OWE Transition WiFi network lifecycle - create, activate, deactivate, delete

- **Objective:** OWE Transition WiFi network lifecycle - create, activate, deactivate, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-320.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue for OWE activation | completed |
| 2 | Capture venue ID | mcp-test-venue-owe-{{TEST_RUN_ID}} |
| 3 | Create OWE Transition WiFi network | networkId |
| 4 | Verify dual-network pair created with OWE fields | mcp-test-wifi-owe-{{TEST_RUN_ID}} |
| 5 | Activate OWE network at venue | completed |
| 6 | Deactivate OWE network from venue | completed |
| 7 | Delete OWE WiFi network | completed |
| 8 | Verify OWE network and companion are gone | content |
| 9 | Delete test venue | completed |

### TC-02: DSAE WiFi network lifecycle - create, activate, deactivate, delete

- **Objective:** DSAE WiFi network lifecycle - create, activate, deactivate, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-323.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create identity group for DSAE | completed |
| 2 | Capture identity group ID | mcp-test-idgroup-dsae-ci-{{TEST_RUN_ID}} |
| 3 | Create DPSK service for DSAE | completed |
| 4 | Capture DPSK service ID | mcp-test-dpsk-dsae-ci-{{TEST_RUN_ID}} |
| 5 | Create test venue for DSAE activation | completed |
| 6 | Capture venue ID | mcp-test-venue-dsae-{{TEST_RUN_ID}} |
| 7 | Create DSAE WiFi network | networkId |
| 8 | Verify dual-network pair created with DSAE fields | mcp-test-dsae-ci-{{TEST_RUN_ID}} |
| 9 | Activate DSAE network at venue | completed |
| 10 | Deactivate DSAE network from venue | completed |
| 11 | Delete DSAE WiFi network | completed |
| 12 | Verify DSAE network and companion are gone | content |
| 13 | Delete DPSK service | completed |
| 14 | Delete identity group | completed |
| 15 | Delete test venue | completed |

### TC-03: Identity Group lifecycle - create, query, delete

- **Objective:** Identity Group lifecycle - create, query, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-321.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create identity group | completed |
| 2 | Query identity groups and capture ID | mcp-test-idgroup-ci-{{TEST_RUN_ID}} |
| 3 | Delete identity group | completed |
| 4 | Verify identity group is gone | totalElements |

### TC-04: DPSK Service lifecycle - create, partial-update, query, delete

- **Objective:** DPSK Service lifecycle - create, partial-update, query, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-322.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create identity group for DPSK service | completed |
| 2 | Capture identity group ID | mcp-test-idgroup-dpsk-ci-{{TEST_RUN_ID}} |
| 3 | Create DPSK service under identity group | completed |
| 4 | Query DPSK services and verify created | mcp-test-dpsk-ci-{{TEST_RUN_ID}} |
| 5 | Partial update - change only passphraseLength (retrieve-then-merge + reshape) | completed |
| 6 | Get DPSK service - verify length changed and name/identity preserved | mcp-test-dpsk-ci-{{TEST_RUN_ID}} |
| 7 | Delete DPSK service | completed |
| 8 | Delete identity group | completed |
