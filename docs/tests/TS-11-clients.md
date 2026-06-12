---
id: TS-11
title: Client query and monitoring
namespace: ruckus1-mcp
story: STORY-011
story_hash: b39cb306bc1a6bfcb0ecde91179f5649f83f032b329c4364735100d79553211d
status: green
---

## Why this scenario exists

Client query surfaces with and without filters/pagination.

### TC-01: Query clients returns results

- **Objective:** Query clients returns results.
- **Script:** cicd/tests/testcases/integration/TC-INT-017.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query clients with default parameters | content |

### TC-02: Query clients with filter and pagination

- **Objective:** Query clients with filter and pagination.
- **Script:** cicd/tests/testcases/integration/TC-INT-112.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query clients with pagination parameters | content |
