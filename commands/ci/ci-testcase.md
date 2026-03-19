# Create Test Case from Story

Generate a YAML test case file that tests a user story via MCP tools.

```
{{input}}

## PURPOSE

Read a user story and generate YAML test case(s) that verify the acceptance criteria by calling MCP tools on a live RUCKUS One environment.

---

## AGENT WORKFLOW

### Step 1: Read the Story

Read the story file from `docs/stories/`. The input should be a story ID (e.g., `STORY-001`).

If no story ID provided, list available stories and ask the user to pick one.

### Step 2: Identify What to Test

From the acceptance criteria, determine:
- Which MCP tools to call (e.g., `query_wifi_networks`, `create_ruckus_venue`)
- What output to expect (patterns, values)
- What would indicate failure

### Step 3: Generate Test Case YAML

Create test case file(s) in `cicd/tests/testcases/` using this format:

```yaml
id: TC-[SUITE]-[NUMBER]
name: [Descriptive test name]
suite: [build|integration|e2e]
story: STORY-XXX
priority: [1-10, lower = runs first]
timeout: 30000
dependencies: []

steps:
  - name: [Step description]
    command: npx tsx cicd/tests/src/mcp-client.ts [tool_name] '{"arg":"value"}'
    expectPatterns:
      - "[regex pattern for expected output]"
    rejectPatterns:
      - "isError"

criteria: |
  [Human-readable test criteria from the story's acceptance criteria]
```

**Suite guidelines:**
- `build` — compilation, dependency checks
- `integration` — single MCP tool calls, verify output format
- `e2e` — multi-tool workflows, verify RUCKUS One state

**Test case ID format:**
- Build: `TC-BUILD-XXX`
- Integration: `TC-INT-XXX`
- E2E: `TC-E2E-XXX`

### Step 4: Update Story File

Update the story's **Status** section with test references:
```markdown
- Tests: TC-INT-001, TC-E2E-001
```

### Step 5: Report

Show the user:
- Test case files created
- What each test validates
- Suggest: `/ci-run` to execute tests

---

## EXAMPLE

For a story about querying WiFi networks:

```yaml
id: TC-INT-001
name: Query WiFi networks with default parameters
suite: integration
story: STORY-001
priority: 5
timeout: 30000
dependencies: []

steps:
  - name: Query all WiFi networks
    command: npx tsx cicd/tests/src/mcp-client.ts query_wifi_networks '{}'
    expectPatterns:
      - "content"
      - "text"
    rejectPatterns:
      - "isError"

  - name: Query with search string
    command: npx tsx cicd/tests/src/mcp-client.ts query_wifi_networks '{"searchString":"test"}'
    expectPatterns:
      - "content"
    rejectPatterns:
      - "isError"

criteria: |
  Verify the query_wifi_networks MCP tool:
  - Can query all WiFi networks and return results
  - Can filter by search string
  - Returns structured JSON response
```

---

## OUTPUT

Paths to created test case files.
```
