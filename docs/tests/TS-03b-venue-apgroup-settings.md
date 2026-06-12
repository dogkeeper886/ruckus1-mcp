---
id: TS-03b
title: Venue / AP-group merged settings getter
namespace: ruckus1-mcp
story: STORY-020
story_hash: e3bbf37fb033f24c8f042d3e315e79a9080b970ba4fa7c94205a136bca54c714
status: green
---

## Why this scenario exists

The folded settings-family getter returns merged AP-group settings (STORY-020 consolidation).

### TC-01: get_ap_group_settings returns merged AP-group settings (folded getter, STORY-020)

- **Objective:** get_ap_group_settings returns merged AP-group settings (folded getter, STORY-020).
- **Script:** cicd/tests/testcases/integration/TC-INT-005.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create test venue | completed |
| 2 | Capture venue ID | mcp-test-apgset-venue-{{TEST_RUN_ID}} |
| 3 | Create AP group | completed |
| 4 | Capture AP group ID | mcp-test-apgset-{{TEST_RUN_ID}} |
| 5 | get_ap_group_settings (default = all categories) returns the merged shape | radio |
| 6 | get_ap_group_settings with categories=[clientAdmissionControl] returns only that category | clientAdmissionControl |
| 7 | Delete AP group | completed |
| 8 | Delete test venue | completed |
