# Create User Story

Create a user story file from user input.

```
{{input}}

## PURPOSE

Transform user input into a structured user story file saved to `docs/stories/`.

---

## AGENT WORKFLOW

### Step 1: Determine Story ID

Check `docs/stories/` for existing story files. Generate the next sequential ID:
- Format: `STORY-XXX` (e.g., STORY-001, STORY-002)
- If no stories exist, start with STORY-001

### Step 2: Clarify Requirements

If the user input is vague, ask clarifying questions:
- What is the expected behavior?
- Which RUCKUS One resources does this affect?
- Are there any edge cases to consider?

If the input is clear enough, proceed directly.

### Step 3: Write Story File

Create `docs/stories/STORY-XXX.md` with this template:

```markdown
# STORY-XXX: [Title]

## User Story

As a [role],
I want to [action],
So that [benefit].

## Description

[Expanded description from user input]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Notes

- Affected files: [list of files likely to change]
- MCP tools involved: [list of MCP tools if applicable]
- API endpoints: [relevant RUCKUS One API endpoints if known]

## Status

- Created: [date]
- Tasks: none
- Tests: none
```

### Step 4: Confirm

Show the user the created story and suggest next steps:
- `/dev-tasks STORY-XXX` to break into GitHub issues
- `/ci-testcase STORY-XXX` to create test cases

---

## OUTPUT

The path to the created story file.
```
