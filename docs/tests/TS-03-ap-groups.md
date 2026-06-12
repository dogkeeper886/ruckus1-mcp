---
id: TS-03
title: AP group reads and lifecycle
namespace: ruckus1-mcp
story: STORY-003
story_hash: 1f78cd399f1dba1173a87fe32f350e105ce72ebf47a33a6651bd42475a7a067d
status: green
---

## Why this scenario exists

AP group list/query reads and the full create -> partial-update -> verify -> delete lifecycle.

### TC-01: Get AP groups returns list

- **Objective:** Get AP groups returns list.
- **Script:** cicd/tests/testcases/integration/TC-INT-006.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query AP groups from RUCKUS One | totalCount |

### TC-02: Query AP groups with pagination parameters

- **Objective:** Query AP groups with pagination parameters.
- **Script:** cicd/tests/testcases/integration/TC-INT-103.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query AP groups with specific fields and page size | totalCount |

### TC-03: AP group CRUD lifecycle - create, partial-update, verify, delete

- **Objective:** AP group CRUD lifecycle - create, partial-update, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-203.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue for AP group | completed |
| 2 | Get venue ID for AP group creation | mcp-test-apg-venue-{{TEST_RUN_ID}} |
| 3 | Create AP group in test venue (config-object create) | completed |
| 4 | Verify AP group exists | mcp-test-ap-group-{{TEST_RUN_ID}} |
| 5 | Partial update - add description (retrieve-then-merge, preserves name + members) | completed |
| 6 | Get AP group - verify description added and name preserved | Updated by MCP test |
| 7 | Delete AP group | completed |
| 8 | Cleanup - delete test venue | completed |
