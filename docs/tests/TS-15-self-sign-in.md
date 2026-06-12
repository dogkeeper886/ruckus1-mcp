---
id: TS-15
title: Self Sign-In channels and back-compat
namespace: ruckus1-mcp
story: STORY-014
story_hash: 0f910a8e109423d16e852bf18cc525d8ca390295ff2ae97cf46d73d8404c35e9
status: green
---

## Why this scenario exists

Self Sign-In channel validation and the back-compat Email-only default.

### TC-01: Self Sign-In rejects create with no channels enabled

- **Objective:** Self Sign-In rejects create with no channels enabled.
- **Script:** cicd/tests/testcases/integration/TC-INT-329.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | requestId |
| 2 | Capture portal profile ID | mcp-test-portal-ssi-nochan-{{TEST_RUN_ID}} |
| 3 | Create Self Sign-In with all channel flags false - expect validation error | isError |
| 4 | smsPasswordDuration without enableSmsLogin - expect validation error | isError |
| 5 | allowedEmailDomains without enableEmailLogin - expect validation error | isError |
| 6 | Delete portal service profile | completed |

### TC-02: Self Sign-In back-compat default (no channel flags = Email-only)

- **Objective:** Self Sign-In back-compat default (no channel flags = Email-only).
- **Script:** cicd/tests/testcases/integration/TC-INT-330.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal service profile | requestId |
| 2 | Capture portal profile ID | mcp-test-portal-ssi-default-{{TEST_RUN_ID}} |
| 3 | Create Self Sign-In without any channel flags (back-compat default) | networkId |
| 4 | Capture network ID | mcp-test-ssi-default-{{TEST_RUN_ID}} |
| 5 | GET network - verify Email-only default persisted (no regression) | enableSmsLogin |
| 6 | Delete WiFi network | completed |
| 7 | Delete portal service profile | completed |
