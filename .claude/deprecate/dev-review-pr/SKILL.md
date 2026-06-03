---
name: dev-review-pr
description: |
  Review a pull request using a structured MCP-specific checklist. Use when a PR
  exists and needs code review before merging.
disable-model-invocation: true
---

# Review a Pull Request

Review a pull request using a structured checklist.

Arguments: $ARGUMENTS
  - <PR-number>    PR number to review

## PURPOSE

Reviews a pull request against a structured checklist covering issue linkage,
MCP tool quality, code patterns, test coverage, and documentation. Approves or requests changes.

---

## WORKFLOW

    /dev-review-pr 30
        │
        ├─► Step 1: Read the PR
        │   - Run: gh pr view <PR>
        │   - Run: gh pr diff <PR>
        │   - Run: gh pr checks <PR>
        │
        ├─► Step 2: Review Checklist
        │
        │   Issue Linkage:
        │   - [ ] PR body contains "Fixes #N" or "Closes #N"
        │   - [ ] PR title is clear and under 70 characters
        │   - [ ] Labels match the linked issue
        │
        │   MCP Tool Quality (if new tool added):
        │   - [ ] Service function in src/services/ruckusApiService.ts follows existing patterns
        │   - [ ] Tool registered in src/mcpServer.ts (definition + handler)
        │   - [ ] Types added to src/types/ruckusApi.ts if needed
        │   - [ ] Tool description includes REQUIRED/PREREQUISITE with tool references
        │   - [ ] Async operations use maxRetries=5, pollIntervalMs=2000
        │   - [ ] Error handling matches existing patterns
        │
        │   Code Quality:
        │   - [ ] Changes match the issue's acceptance criteria
        │   - [ ] No unnecessary changes beyond what was requested
        │   - [ ] No security vulnerabilities (injection, hardcoded secrets)
        │   - [ ] No debug/temporary code left in
        │   - [ ] Follows patterns documented in CLAUDE.md
        │
        │   Build & Test:
        │   - [ ] `npm run build` passes
        │   - [ ] Relevant test cases exist or updated (if applicable)
        │   - [ ] CI checks pass (if applicable)
        │
        │   Documentation:
        │   - [ ] CLAUDE.md updated if new tool added (tool list, architecture)
        │   - [ ] Comments added where logic isn't self-evident
        │   - [ ] No unnecessary comments or docstrings
        │
        ├─► Step 3: Decision
        │   - Approve: all checks pass → proceed to /dev-merge
        │   - Request changes: specific feedback → back to /dev-impl
        │
        └─► Step 4: Submit Review
            - Check if you are the PR author (GitHub blocks self-approval)
            - If NOT the author:
              gh pr review <PR> --approve --body "LGTM"
            - If you ARE the author (self-review):
              gh pr comment <PR> --body "Self-review complete. Checklist passes. Ready to merge."
            - To request changes:
              gh pr review <PR> --request-changes --body "<specific feedback>"

---

## EXAMPLE

    /dev-review-pr 30

**Agent reads PR, runs checklist:**

    $ gh pr view 30
    $ gh pr diff 30
    $ gh pr checks 30

**Checklist result:**

    ✓ Issue linkage — Fixes #27 present
    ✓ Title — "Add WiFi network creation tool" (36 chars)
    ✓ MCP tool quality — Service + registration + types all present
    ✓ Code quality — Changes match acceptance criteria
    ✓ Build — npm run build passes
    ✓ Tests — TC-INT-009 covers this tool

    $ gh pr comment 30 --body "Self-review complete. Checklist passes. Ready to merge."

**Output:**

    PR #30 reviewed. Next: /dev-merge 30

---

## API Notes

- Uses `gh` CLI for PR operations
- GitHub blocks self-approval — use comment instead if you authored the PR
- If CI checks are failing, investigate before approving
- Always read the full diff, not just the PR description
