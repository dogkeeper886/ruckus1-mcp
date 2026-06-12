---
id: TS-04
title: Access point queries and update validation
namespace: ruckus1-mcp
story: STORY-004
story_hash: 440b484b57ed94b2ece857d7a952cbd48b023439da5ef1c27a96515245690af7
status: green
---

## Why this scenario exists

Access point inventory queries and rejection of an update against an unknown serial.

### TC-01: Query access points inventory

- **Objective:** Query access points inventory.
- **Script:** cicd/tests/testcases/integration/TC-INT-007.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query all APs from RUCKUS One | serialNumber |

### TC-02: Query APs with search and pagination

- **Objective:** Query APs with search and pagination.
- **Script:** cicd/tests/testcases/integration/TC-INT-104.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query APs with pagination parameters | serialNumber |

### TC-03: Update AP with invalid serial number returns error

- **Objective:** Update AP with invalid serial number returns error.
- **Script:** cicd/tests/testcases/integration/TC-INT-307.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Update AP with non-existent serial number | isError |
