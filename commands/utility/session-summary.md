# Session Summary — Privacy-Safe Session Recorder

```
Generate a privacy-safe summary of the current session to feed pattern detection and workflow improvement.

Arguments: {{input}}
  - (empty)         Generate summary for the current session
  - --detail full   Include ticket/issue references (default: structural only)
  - review          Review and show aggregated patterns from past summaries

Examples:
  /session-summary
  /session-summary --detail full
  /session-summary review

## Important Rules

1. **Privacy first** — Never record actual credentials, passwords, or API keys
2. **Structure over content** — Record what type of work was done, not specific network data
3. **User reviews before save** — Always present the summary for approval before writing
4. **Anonymize by default** — Strip tenant IDs and secrets unless --detail full
5. **Local only** — Summaries stay in docs/session_summaries/, never committed to git automatically
6. **No duplicate summaries** — If running multiple times in same session, update existing

## Phase 1: Collect Session Context

### 1a. Session Goal
- What did the user ask to accomplish?
- Summarize in 1 sentence using generic terms

### 1b. Skills & Commands Used
- List all slash commands invoked during the session
- List all MCP tools used (by category, not individual calls)
- Note any manual workflows not covered by existing commands

### 1c. Artifacts Produced
- Count of files created/modified (by type: stories, test cases, source files, commands, etc.)
- Don't list actual file names — just counts and types

### 1d. Friction Points
- Where did the workflow get stuck or require rework?
- What corrections did the user make?
- What took multiple attempts?
- Any tool failures or unexpected behaviors?

### 1e. Workflow Pattern
Classify the session into one or more patterns:
- **Story** — Creating user stories from requirements
- **Tasks** — Breaking stories into GitHub issues
- **Implement** — Writing MCP tool code
- **Test** — Creating/running test cases
- **CI** — Test framework setup, automation
- **Maintenance** — Updating existing artifacts, fixing bugs
- **Meta** — Improving workflow, evolve, tooling changes

### 1f. Session Outcome
- **Completed** — All goals achieved
- **Partial** — Some goals achieved, work remains
- **Blocked** — Could not proceed due to external dependency
- **Pivoted** — Changed direction based on new information

### 1g. Session Scale
- **Quick** — Under 15 minutes, simple task
- **Medium** — 15-60 minutes, moderate complexity
- **Long** — Over 60 minutes, complex multi-step workflow

## Phase 2: Detect Patterns

### 2a. Repeated Sequences
- Did you perform multi-step sequences that could be a single command?

### 2b. Workflow Gaps
- Any manual steps that should be automated?
- Missing handoffs between existing commands?

### 2c. Efficiency Observations
- What went smoothly? (reinforce these patterns)
- What was unnecessarily slow? (flag for improvement)

### 2d. Knowledge Gaps
- Did CLAUDE.md have relevant guidance? Was it accurate?
- Were there undocumented conventions you had to discover?

## Phase 3: Generate Summary

### Summary Structure

Present the following to the user for approval:

    ---
    date: [YYYY-MM-DD]
    session_id: [YYYYMMDD-HHMM]
    workflow_patterns: [list from 1e]
    outcome: [from 1f]
    scale: [from 1g]
    commands_used: [list of slash commands]
    mcp_tools_used: [ruckus1 tools used]
    ---

    ## Goal
    [1 sentence, anonymized]

    ## Artifacts
    - [type]: [count] created, [count] modified

    ## Workflow
    [Brief description of the workflow path taken]

    ## Friction Points
    - [Each friction point as a bullet]

    ## Patterns Detected
    - **Repeated sequence:** [description] → Candidate for: [improvement]
    - **Workflow gap:** [description] → Suggestion: [improvement]
    - **Efficiency win:** [what worked well]

    ## Signals for /evolve
    [Key observations that /evolve should pick up in its next analysis]

### Privacy Check

Before presenting, verify the summary passes this checklist:
- [ ] No real credentials, passwords, or API keys
- [ ] No real tenant IDs (unless --detail full)
- [ ] No real person names or email addresses
- [ ] No specific network configuration data that could identify the deployment

## Phase 4: Save (after user approval)

1. **Create directory if needed:**

        mkdir -p docs/session_summaries

2. **Save summary to:** `docs/session_summaries/[YYYY-MM-DD]_[HHMM]_summary.md`

3. **Update patterns file** — Append new patterns to `docs/session_summaries/patterns.md`:
   - If patterns.md doesn't exist, create it with a header
   - Add new patterns with date and frequency count
   - If a pattern already exists, increment its count and update last-seen date

### patterns.md Structure

    # Session Patterns

    Last updated: [DATE]
    Total sessions recorded: [N]

    ## Workflow Distribution
    | Pattern | Count | Last Seen |
    |---------|-------|-----------|
    | Implement | 5  | 2026-03-18 |
    | Test      | 3  | 2026-03-18 |

    ## Recurring Friction Points
    | Friction Point | Occurrences | First Seen | Last Seen | Status |
    |---------------|-------------|------------|-----------|--------|
    | [description] | 3 | 2026-03-01 | 2026-03-18 | Open |

    ## Improvement Candidates
    | Candidate | Evidence Count | Suggestion | Status |
    |-----------|---------------|------------|--------|
    | [description] | 5 | [improvement] | Proposed / Applied / Dismissed |

## Phase 5: Review Mode (when argument is "review")

When invoked with `review`, analyze existing summaries:

1. **Read all summaries** from `docs/session_summaries/`
2. **Read patterns.md** for aggregated data
3. **Present dashboard:**

        ## Session Summary Dashboard

        ### Overview
        - Total sessions: [N]
        - Date range: [first] to [last]
        - Most common workflow: [pattern] ([N] sessions)

        ### Top Friction Points (by frequency)
        1. [point] — [N] occurrences

        ### Improvement Candidates (ready for /evolve)
        | # | Candidate | Sessions | Confidence |
        |---|-----------|----------|------------|
        | 1 | [desc]    | 5        | High       |

4. **Suggest /evolve integration:** If high-confidence candidates exist, suggest running `/evolve`.

## Integration with /evolve

Session summaries are designed to be consumed by `/evolve`:

- `/evolve` Phase 1 should check `docs/session_summaries/patterns.md`
- Friction points with 3+ occurrences become High-confidence insights
- Improvement candidates feed directly into `/evolve` Phase 5
- Pipeline: `/session-summary` → patterns.md → `/evolve` → actions
```
