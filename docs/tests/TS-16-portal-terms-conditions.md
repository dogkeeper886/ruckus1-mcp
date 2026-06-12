---
id: TS-16
title: Portal profile Terms and Conditions fields
namespace: ruckus1-mcp
story: STORY-016
story_hash: d442d7e62bd9fc6f8bb9817b554629295e37310fce4419bb21869dfa624d415b
status: green
---

## Why this scenario exists

Portal profile Terms & Conditions fields (rich-doc and URL mode) and rejection of mutually-exclusive inputs.

### TC-01: Portal profile T&C fields - rich-doc, URL mode, hyperlink builder

- **Objective:** Portal profile T- **Objective:** TODOC fields - rich-doc, URL mode, hyperlink builder.
- **Script:** cicd/tests/testcases/integration/TC-INT-333.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Build PLAIN Tiptap config via builder | type |
| 2 | Create portal profile with rich-doc T&C (RICH DOC mode + display toggle) | requestId |
| 3 | Capture portal profile ID | mcp-test-portal-tc-{{TEST_RUN_ID}} |
| 4 | GET portal profile - verify rich-doc T&C round-trip | termsConditionConfig |
| 5 | Update portal profile to LINK TO URL mode (partial merge, null the rich-doc) | completed |
| 6 | GET portal profile - verify URL mode round-trip | termsConditionUrl |
| 7 | Build HYPERLINK Tiptap config via builder | paragraph |
| 8 | Update portal profile to rich-doc with hyperlink (partial merge, null the URL) | completed |
| 9 | GET portal profile - verify hyperlink mark round-trip | termsConditionConfig |
| 10 | Delete portal service profile | completed |

### TC-02: Portal profile rejects mutually-exclusive T&C fields (v1.1 media type)

- **Objective:** Portal profile rejects mutually-exclusive T- **Objective:** TODOC fields (v1.1 media type).
- **Script:** cicd/tests/testcases/integration/TC-INT-342.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create portal profile with both termsConditionConfig and termsConditionUrl | isError |
