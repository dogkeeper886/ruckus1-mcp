---
id: TS-09
title: WiFi network queries and create validation
namespace: ruckus1-mcp
story: STORY-009
story_hash: 36b0e4095926b96f951fa93aaa19cb407b2c82eb3e0b88dc6f0ead8f06f2b57f
status: green
---

## Why this scenario exists

WiFi network query surfaces (default, search, multi-param) and rejection of a create missing required fields.

### TC-01: Query WiFi networks with default parameters

- **Objective:** Query WiFi networks with default parameters.
- **Script:** cicd/tests/testcases/integration/TC-INT-014.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query all WiFi networks from RUCKUS One | content |

### TC-02: Query WiFi networks with search string filtering

- **Objective:** Query WiFi networks with search string filtering.
- **Script:** cicd/tests/testcases/integration/TC-INT-015.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query WiFi networks with a search string filter | content |

### TC-03: Query WiFi networks with multiple parameters

- **Objective:** Query WiFi networks with multiple parameters.
- **Script:** cicd/tests/testcases/integration/TC-INT-110.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query WiFi networks with sort and pagination | content |

### TC-04: Create WiFi network with missing required fields returns error

- **Objective:** Create WiFi network with missing required fields returns error.
- **Script:** cicd/tests/testcases/integration/TC-INT-316.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create WiFi network without ssid (required field) | isError |
