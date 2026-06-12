---
id: TS-05
title: Directory server profile reads and lifecycle
namespace: ruckus1-mcp
story: STORY-005
story_hash: ee6a0a27d6c8a4a89f21367c9058c793f7db8cb287fcda80101e65bd7ff57e28
status: green
---

## Why this scenario exists

Directory (AD/LDAP) server profile reads and the create -> partial-update -> verify -> delete lifecycle.

### TC-01: Query directory server profiles returns results

- **Objective:** Query directory server profiles returns results.
- **Script:** cicd/tests/testcases/integration/TC-INT-008.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query directory server profiles with default parameters | content |

### TC-02: Query directory server profiles with search

- **Objective:** Query directory server profiles with search.
- **Script:** cicd/tests/testcases/integration/TC-INT-106.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query directory server profiles with search and pagination | content |

### TC-03: Directory server profile CRUD lifecycle - create, partial-update, verify, delete

- **Objective:** Directory server profile CRUD lifecycle - create, partial-update, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-207.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create directory server profile (config-object create) | completed |
| 2 | Find created profile and capture ID | mcp-test-ldap-{{TEST_RUN_ID}} |
| 3 | Partial update - change only host (retrieve-then-merge) | completed |
| 4 | Get profile - verify host changed and unspecified fields preserved | 10.88.88.88 |
| 5 | Delete directory server profile | completed |
| 6 | Verify profile is gone | totalCount |
