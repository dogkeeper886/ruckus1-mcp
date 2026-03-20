---
name: dev-merge
description: |
  Merge an approved pull request and clean up branches, labels, and story status.
  Use when a PR is approved and ready to merge.
disable-model-invocation: true
---

# Merge a Pull Request

Merge an approved pull request and clean up.

Arguments: $ARGUMENTS
  - <PR-number>    PR number to merge

## PURPOSE

Merges an approved PR, deletes the remote branch, cleans up local branches,
issue labels, and updates the story file status. The linked issue auto-closes
via "Fixes #N" in the PR body.

---

## WORKFLOW

    /dev-merge 30
        │
        ├─► Step 1: Verify PR is Ready
        │   - Run: gh pr view <PR> --json reviewDecision,mergeStateStatus,headRefName
        │   - Must be approved and mergeable
        │   - Run: gh pr checks <PR>
        │   - CI checks must pass (if applicable)
        │
        ├─► Step 2: Identify Linked Issue and Story
        │   - Read PR body for "Fixes #N" or "Closes #N"
        │   - Note the issue number for label cleanup
        │   - Check if issue references a STORY-XXX
        │
        ├─► Step 3: Merge
        │   - Run: gh pr merge <PR> --merge --delete-branch
        │   - Uses --merge (not squash/rebase) to preserve commit history
        │   - --delete-branch cleans up the remote branch
        │
        ├─► Step 4: Clean Up Issue Labels
        │   - Run: gh issue edit <N> --remove-label "status:needs-review"
        │   - Issue auto-closes via "Fixes #N" — no manual close needed
        │
        ├─► Step 5: Update Story File (if linked)
        │   - If the issue references STORY-XXX, update the story status
        │   - Check off completed acceptance criteria
        │   - If all tasks are done, mark story as Completed
        │
        ├─► Step 6: Clean Up Local Branch
        │   - Run: git checkout main && git pull
        │   - Run: git branch -d <branch-name>
        │
        └─► Step 7: Report
            - Confirm merge to the user
            - Show the merged PR URL
            - If story has remaining tasks, suggest: /dev-impl STORY-XXX
            - If story is complete, suggest: /ci-testcase STORY-XXX

---

## EXAMPLE

    /dev-merge 30

**Agent verifies, merges, cleans up:**

    $ gh pr view 30 --json reviewDecision,mergeStateStatus,headRefName
    $ gh pr checks 30
    $ gh pr merge 30 --merge --delete-branch
    $ gh issue edit 27 --remove-label "status:needs-review"
    $ git checkout main && git pull
    $ git branch -d issue-27-add-wifi-tool

**Output:**

    PR #30 merged: https://github.com/dogkeeper886/ruckus1-mcp/pull/30
    Issue #27 auto-closed.
    Branch issue-27-add-wifi-tool deleted (local + remote).
    STORY-009 updated — 2/3 tasks complete.
    Next: /dev-impl STORY-009

---

## API Notes

- Uses `gh` CLI for PR and issue operations
- `--merge` preserves full commit history (use `--squash` only if the project convention requires it)
- `--delete-branch` removes the remote branch; `git branch -d` removes the local one
- If PR is not approved or CI fails, report the blocker instead of merging
