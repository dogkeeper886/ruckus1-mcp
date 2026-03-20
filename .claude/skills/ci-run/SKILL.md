---
name: ci-run
description: |
  Execute test cases against a live RUCKUS One environment using MCP tools.
  Use when the user wants to run tests, execute test cases, or verify MCP tool behavior.
disable-model-invocation: true
---

# Run Test Cases

Execute test cases against a live RUCKUS One environment using MCP tools.

{{input}}

## PURPOSE

Run YAML test cases by calling MCP tools and evaluating results.

---

## AGENT WORKFLOW

### Step 1: Load Test Cases

Input can be:
- A test ID (e.g., `TC-INT-001`) — run that specific test
- A suite name (e.g., `integration`) — run all tests in that suite
- A story ID (e.g., `STORY-001`) — run all tests linked to that story
- Empty — run all tests

Read YAML test case files from `cicd/tests/testcases/`.

### Step 2: Resolve Dependencies

Sort tests by:
1. Dependencies (tests that depend on others run after)
2. Priority (lower number = runs first)

### Step 3: Execute Each Test

For each test case, for each step:

1. **Call the MCP tool** specified in `mcp_tool` with `mcp_args`
2. **Capture the output** (the text content returned by the tool)
3. **Check expectPatterns** — each regex must match somewhere in the output
4. **Check rejectPatterns** — none of these regexes should match in the output
5. **Record result**: PASS or FAIL with evidence

If a step fails and subsequent steps depend on it, skip them.

### Step 4: Judge Results

For each test case, determine overall verdict:
- **PASS** — all steps passed, all patterns matched
- **FAIL** — any step failed, with details on which and why

### Step 5: Report

Output a summary table:

```
Test Results
============
TC-INT-001  Query WiFi networks       PASS
TC-INT-002  Get venue details         FAIL  (step 2: expected pattern "venueId" not found)
TC-E2E-001  Full venue lifecycle      PASS

Summary: 2/3 passed
```

If any test failed, show:
- Which step failed
- Expected vs actual output (truncated)
- Suggested fix or investigation

---

## OUTPUT

Test results summary with pass/fail status for each test case.
