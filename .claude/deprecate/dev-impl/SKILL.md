---
name: dev-impl
description: |
  Pick a task from a story and implement it. Use when tasks exist as GitHub issues
  and need implementation following MCP project patterns.
disable-model-invocation: true
---

# Implement a Task

Pick a task from a story and implement it.

Arguments: $ARGUMENTS

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

### Step 3: Create Branch and Track

- Branch name: `issue-<N>-<short-slug>` (e.g., `issue-28-sync-commands`)
- Run: `git checkout -b issue-<N>-<slug> main`
- Add status label: `gh issue edit <N> --add-label "status:in-progress"`

### Step 4: Implement

Write the code. Follow existing patterns in the codebase:
- Service functions go in `src/services/ruckusApiService.ts` following existing patterns
- Register new tools in `src/mcpServer.ts` (tool definition + handler case)
- Types go in `src/types/ruckusApi.ts`
- Follow the patterns documented in CLAUDE.md

### Step 5: Build and Verify

Run `npm run build` to verify the code compiles.

### Step 6a: On Success

- Commit the changes (ask user first)
- Close the GitHub issue with `gh issue close`
- Update the story file: check off the completed acceptance criteria
- Comment on issue: `gh issue comment <N> --body "Implementation complete. Ready for PR."`

Suggest next steps:
- `/dev-create-pr <N>` to create a pull request
- `/dev-impl STORY-XXX` for the next task
- `/ci-testcase STORY-XXX` to create tests

### Step 6b: On Failure

- Do NOT silently retry — update the issue:
  `gh issue comment <N> --body "Build/test failure: <what failed, error, root cause>"`
- If blocked, add label: `gh issue edit <N> --add-label "status:blocked"`
- Investigate, fix, update issue:
  `gh issue comment <N> --body "Applied fix: <what changed>. Retesting."`
- Remove blocked label after unblocking:
  `gh issue edit <N> --remove-label "status:blocked"`
- If stuck after 2-3 attempts, comment blockers and ask the user

### Step 6c: On Partial Fix

- Comment: what was fixed, what remains, blockers
- Proceed to `/dev-create-pr` if the partial fix is independently useful
- Create follow-up issues for remaining work

---

## OUTPUT

Summary of changes made and issue closed.
