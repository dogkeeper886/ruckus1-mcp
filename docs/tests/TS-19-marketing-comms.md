---
id: TS-19
title: Portal profile marketing-communication opt-in
namespace: ruckus1-mcp
story: STORY-026
story_hash: 1fa2589b915af028bef92d73424d3dbbf0279b881c4f42c6f77b1d797e8dcfd0
status: green
---

## Why this scenario exists

The marketing-communication opt-in component on portal profiles and its field validation.

### TC-01: Portal profile marketing communication opt-in - fields, consent doc, partial-merge round-trip

- **Objective:** Portal profile marketing communication opt-in - fields, consent doc, partial-merge round-trip.
- **Script:** cicd/tests/testcases/integration/TC-INT-343.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Build HYPERLINK consent doc via builder (reused for marketing) | paragraph |
| 2 | Create portal profile with marketing opt-in (component on + email field + consent doc) | requestId |
| 3 | Capture portal profile ID | mcp-test-portal-mc-{{TEST_RUN_ID}} |
| 4 | GET portal profile - verify marketing fields + consent doc round-trip | marketingCommunication |
| 5 | Update marketing fields (enable phone, make email required) - partial deep-merge | completed |
| 6 | GET portal profile - verify field toggle merged and consent doc preserved | phone |
| 7 | Delete portal service profile | completed |

### TC-02: Portal profile rejects marketing opt-in without email or phone enabled

- **Objective:** Portal profile rejects marketing opt-in without email or phone enabled.
- **Script:** cicd/tests/testcases/integration/TC-INT-344.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal with marketingCommunication enabled but neither email nor phone | isError |
