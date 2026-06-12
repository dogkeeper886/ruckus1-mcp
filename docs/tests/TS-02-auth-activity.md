---
id: TS-02
title: Authentication and activity monitoring
namespace: ruckus1-mcp
story: STORY-001
story_hash: dd236091e9df7ffaf07489473f7507f83eef78010cb9d5859f498ecdd1425c99
status: green
---

## Why this scenario exists

Token issuance and the activity-detail error paths that the auth/activity surface must get right.

### TC-01: Authenticate and obtain JWT token

- **Objective:** Authenticate and obtain JWT token.
- **Script:** cicd/tests/testcases/integration/TC-INT-001.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Get auth token from RUCKUS One | eyJ |

### TC-02: Get activity details with dummy request ID

- **Objective:** Get activity details with dummy request ID.
- **Script:** cicd/tests/testcases/integration/TC-INT-002.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query activity details with an unknown parameter name (no activityId supplied) | isError |

### TC-03: Activity details with invalid request ID returns error

- **Objective:** Activity details with invalid request ID returns error.
- **Script:** cicd/tests/testcases/integration/TC-INT-301.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query activity with completely invalid ID format | isError |
