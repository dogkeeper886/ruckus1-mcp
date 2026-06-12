---
id: TS-06
title: RADIUS server profile reads and lifecycle
namespace: ruckus1-mcp
story: STORY-006
story_hash: f950bf11bdb40550f97d094a1f43fb82cbaea2ede951f7102f0e8828c45779fc
status: green
---

## Why this scenario exists

RADIUS server profile reads and the create -> partial-update -> verify -> delete lifecycle.

### TC-01: Query RADIUS server profiles returns results

- **Objective:** Query RADIUS server profiles returns results.
- **Script:** cicd/tests/testcases/integration/TC-INT-009.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query RADIUS server profiles with default parameters | content |

### TC-02: Query RADIUS server profiles with pagination

- **Objective:** Query RADIUS server profiles with pagination.
- **Script:** cicd/tests/testcases/integration/TC-INT-107.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query RADIUS profiles with pagination | content |

### TC-03: RADIUS server profile CRUD lifecycle - create, partial-update, verify, delete

- **Objective:** RADIUS server profile CRUD lifecycle - create, partial-update, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-206.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create RADIUS server profile (config-object create) | completed |
| 2 | Find created profile and capture ID | mcp-test-radius-{{TEST_RUN_ID}} |
| 3 | Partial update - change only primary.port (retrieve-then-merge) | completed |
| 4 | Get profile - verify port changed and unspecified fields preserved | 1814 |
| 5 | Delete RADIUS server profile | completed |
| 6 | Verify profile is gone | totalCount |
