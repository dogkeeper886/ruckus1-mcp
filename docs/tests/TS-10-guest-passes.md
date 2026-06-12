---
id: TS-10
title: Guest pass reads and create validation
namespace: ruckus1-mcp
story: STORY-010
story_hash: 53eac9d77fa3d389b23f8e4c7c7d1ec8cf321a3fcecbd3f69ab875dc9cb127d7
status: green
---

## Why this scenario exists

Guest pass reads and rejection of a create against an invalid network id.

### TC-01: Query guest passes returns results

- **Objective:** Query guest passes returns results.
- **Script:** cicd/tests/testcases/integration/TC-INT-016.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query guest passes with default parameters | content |

### TC-02: Query guest passes with filter parameters

- **Objective:** Query guest passes with filter parameters.
- **Script:** cicd/tests/testcases/integration/TC-INT-111.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query guest passes with pagination and search | content |

### TC-03: Create guest pass with invalid networkId returns error

- **Objective:** Create guest pass with invalid networkId returns error.
- **Script:** cicd/tests/testcases/integration/TC-INT-318.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create guest pass with non-existent network | isError |
