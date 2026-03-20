# Implement a Task

Pick a task from a story and implement it.

```
{{input}}

## PURPOSE

Implement a task from a user story, write the code, and close the GitHub issue.

---

## AGENT WORKFLOW

### Step 1: Find the Task

Input can be:
- A story ID (e.g., `STORY-001`) — list open issues for that story and let user pick
- A GitHub issue number (e.g., `#3`) — work on that specific issue directly

Read the story file and the GitHub issue to understand full context.

### Step 2: Plan

Before writing code, briefly state:
- What files will be created or modified
- The approach

Ask user to confirm or adjust.

### Step 3: Implement

Write the code. Follow existing patterns in the codebase:
- Service functions go in `src/services/ruckusApiService.ts` following existing patterns
- Register new tools in `src/mcpServer.ts` (tool definition + handler case)
- Types go in `src/types/ruckusApi.ts`
- Follow the patterns documented in CLAUDE.md

### Step 4: Build and Verify

Run `npm run build` to verify the code compiles.

### Step 5: Close the Loop

- Commit the changes (ask user first)
- Close the GitHub issue with `gh issue close`
- Update the story file: check off the completed acceptance criteria

Suggest next steps:
- `/dev-impl STORY-XXX` for the next task
- `/ci-testcase STORY-XXX` to create tests

---

## OUTPUT

Summary of changes made and issue closed.
```
