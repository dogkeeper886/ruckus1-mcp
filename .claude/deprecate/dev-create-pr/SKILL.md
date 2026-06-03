---
name: dev-create-pr
description: |
  Push branch and open a pull request with issue and story linkage. Use when
  implementation is done and ready for review.
disable-model-invocation: true
---

# Create a Pull Request

Push branch and open a pull request with issue and story linkage.

Arguments: $ARGUMENTS
  - <issue-number>    Issue number to link (or infer from branch name)

## PURPOSE

Creates a pull request for the current branch, linking it to the GitHub Issue
via "Fixes #N" for auto-closure. Updates issue labels and story file to reflect PR status.

---

## WORKFLOW

    /dev-create-pr 27
        │
        ├─► Step 1: Verify Readiness
        │   - Confirm you're on the correct branch (issue-<N>-<slug>)
        │   - Run: git status — check for uncommitted changes
        │   - Run: git log --oneline main..HEAD — review commits
        │   - If no argument given, infer issue number from branch name
        │   - Read the GitHub issue to find linked story (STORY-XXX)
        │
        ├─► Step 2: Push Branch
        │   - Run: git push -u origin $(git branch --show-current)
        │
        ├─► Step 3: Create PR
        │   - Title: short, imperative, under 70 characters
        │   - Body must include "Fixes #N" or "Closes #N"
        │   - Use this template:
        │
        │       gh pr create --title "<title>" --body "$(cat <<'EOF'
        │       ## Summary
        │       <1-3 bullet points>
        │
        │       Fixes #<issue-number>
        │
        │       ## Test plan
        │       - [ ] `npm run build` passes
        │       - [ ] MCP tool tested via mcp-client.ts or Claude Desktop
        │       - [ ] `/ci-run` test cases pass (if applicable)
        │
        │       Generated with [Claude Code](https://claude.com/claude-code)
        │       EOF
        │       )"
        │
        ├─► Step 4: Update Issue Labels
        │   - Run: gh issue edit <N> --remove-label "status:in-progress" \
        │          --add-label "status:needs-review"
        │   - Comment on issue:
        │     gh issue comment <N> --body "PR #<PR> created. Summary: <what changed>"
        │
        ├─► Step 5: Update Story File (if linked)
        │   - If the issue references a STORY-XXX, update the story file status
        │
        └─► Step 6: Report
            - Show the PR URL to the user
            - Suggest next step: /dev-review-pr <PR>

---

## EXAMPLE

    /dev-create-pr 27

**Agent verifies, pushes, creates PR:**

    $ git status
    $ git log --oneline main..HEAD
    $ git push -u origin issue-27-add-wifi-tool
    $ gh pr create --title "Add WiFi network creation tool" --body "..."
    $ gh issue edit 27 --remove-label "status:in-progress" --add-label "status:needs-review"
    $ gh issue comment 27 --body "PR #30 created."

**Output:**

    PR #30 created: https://github.com/dogkeeper886/ruckus1-mcp/pull/30
    Next: /dev-review-pr 30

---

## API Notes

- Uses `gh` CLI for PR and issue operations
- `Fixes #N` in PR body auto-closes the issue when PR is merged
- Copy relevant labels from the issue to the PR if needed
- If branch is already pushed, the push step is a no-op
