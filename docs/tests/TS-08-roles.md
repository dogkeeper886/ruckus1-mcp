---
id: TS-08
title: Roles and permissions reads and lifecycle
namespace: ruckus1-mcp
story: STORY-008
story_hash: 0be4f5451297cd08c0c568ecc57026e66e34d90d363d2067b50a8f37fbf52653
status: green
---

## Why this scenario exists

Role, user-group and role-feature reads plus the custom-role create -> verify -> delete lifecycle.

### TC-01: Get user groups returns list of user groups

- **Objective:** Get user groups returns list of user groups.
- **Script:** cicd/tests/testcases/integration/TC-INT-011.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query all user groups | content |

### TC-02: Get roles returns list of roles

- **Objective:** Get roles returns list of roles.
- **Script:** cicd/tests/testcases/integration/TC-INT-012.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query all roles | content |

### TC-03: Query role features returns list of features

- **Objective:** Query role features returns list of features.
- **Script:** cicd/tests/testcases/integration/TC-INT-013.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query all role features | content |

### TC-04: Query role features with category filter

- **Objective:** Query role features with category filter.
- **Script:** cicd/tests/testcases/integration/TC-INT-109.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query role features filtered by wifi category | content |

### TC-05: Custom role CRUD lifecycle - create, verify, delete

- **Objective:** Custom role CRUD lifecycle - create, verify, delete.
- **Script:** cicd/tests/testcases/integration/TC-INT-208.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create custom role with valid wifi feature | mcp-test-custom-role-{{TEST_RUN_ID}} |
| 2 | Verify role exists and capture roleId | mcp-test-custom-role-{{TEST_RUN_ID}} |
| 3 | Delete custom role | completed |
| 4 | Verify role is gone | content |
