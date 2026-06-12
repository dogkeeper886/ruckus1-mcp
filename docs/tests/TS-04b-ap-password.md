---
id: TS-04b
title: Get AP password by serial
namespace: ruckus1-mcp
story: STORY-029
story_hash: 61fc101c563d57328f4ce6eb666e91c74dc032746515192fa80fbd8fef2325fe
status: green
---

## Why this scenario exists

Retrieving an AP's admin credentials by discovering its venue from the serial.

### TC-01: Get AP password returns valid credentials

- **Objective:** Get AP password returns valid credentials.
- **Script:** cicd/tests/testcases/integration/TC-INT-319.yml
- **Preconditions:** valid RUCKUS One credentials and a registered AP whose serial is set in TEST_AP_SERIAL.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query AP to get venue ID | serialNumber |
| 2 | Get AP password for test AP | apPassword |
