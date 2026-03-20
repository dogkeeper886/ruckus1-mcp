---
name: dev-tasks
description: |
  Break a user story into implementable GitHub issues. Use when a story file exists
  and needs to be broken down into tracked tasks.
disable-model-invocation: true
---

# Break Story into GitHub Issues

Read a user story and create GitHub issues for each task.

Arguments: $ARGUMENTS

## PURPOSE

Break a user story into implementable tasks and track them as GitHub issues.

---

## AGENT WORKFLOW

### Step 1: Read the Story

Read the story file from `docs/stories/`. The input should be a story ID (e.g., `STORY-001`).

If no story ID provided, list available stories in `docs/stories/` and ask the user to pick one.

### Step 2: Break into Tasks

Analyze the story and break it into tasks. Each task should be:
- **Small** — completable in one session
- **Independent** — minimal dependencies between tasks
- **Testable** — has a clear done condition

Common task types for this project:
- Add new service function (src/services/ruckusApiService.ts)
- Register MCP tool (src/mcpServer.ts)
- Add/update types (src/types/ruckusApi.ts)
- Build and test
- Update documentation

### Step 3: Check for Duplicates

Before creating issues, query existing issues to avoid duplicates:
- Run: `gh issue list --search "[STORY-XXX]" --state all`
- If matching issues exist, report them and ask user how to proceed

### Step 4: Create GitHub Issues

For each task, run `gh issue create` with:
- **Title**: `[STORY-XXX] Task description`
- **Body**: Include acceptance criteria from the task breakdown
- **Labels**: add relevant labels (e.g., `enhancement`, `bug`, `priority:high`)

### Step 5: Update Story File

Update the story file's **Status** section:
```markdown
## Status

- Created: [date]
- Tasks: #1, #2, #3 (GitHub issue numbers)
- Tests: none
```

### Step 6: Report

Show the user:
- List of created issues with numbers and titles
- Suggested implementation order
- Remind: `/dev-impl STORY-XXX` to start implementing

---

## OUTPUT

List of GitHub issue numbers created and their titles.
