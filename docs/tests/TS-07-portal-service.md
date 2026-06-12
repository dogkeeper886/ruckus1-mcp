---
id: TS-07
title: Portal service profile reads and lifecycle
namespace: ruckus1-mcp
story: STORY-007
story_hash: d973101a611895e80b32383d34202c8514b96473085ce71dde7882460891868b
status: green
---

## Why this scenario exists

Portal service profile reads and the create -> verify -> delete lifecycle.

### TC-01: Query portal service profiles returns results

- **Objective:** Query portal service profiles returns results.
- **Script:** cicd/tests/testcases/integration/TC-INT-010.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query portal service profiles with default parameters | content |

### TC-02: Portal service profile CRUD lifecycle - create, verify, delete

- **Objective:** Portal service profile CRUD lifecycle - create, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-205.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | completed |
| 2 | Find created profile and capture ID | mcp-test-portal-{{TEST_RUN_ID}} |
| 3 | Delete portal service profile | completed |
| 4 | Verify profile is gone | totalCount |
