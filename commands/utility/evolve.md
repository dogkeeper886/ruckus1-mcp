# Evolve — Self-Improvement Loop

```
Analyze project history to detect patterns and suggest improvements to CLAUDE.md, skills, and commands.

Arguments: {{input}}
  - (empty)         Full analysis (issues + commits, last 90 days)
  - issues          Analyze GitHub issues only
  - commits         Analyze git commits only
  - --since 30d     Override time range (default: 90 days)

Examples:
  /evolve
  /evolve issues
  /evolve commits --since 30d
  /evolve --since 180d

## Important Rules

1. Evidence-based only — every suggestion must cite specific issues or commits
2. Conservative by default — prefer updating existing files over creating new ones
3. No destructive changes without explicit user confirmation
4. Respect existing naming conventions and repository structure
5. High-confidence suggestions (3+ evidence points) are highlighted first
6. Never auto-apply changes — always present the report and ask for confirmation

## Phase 0: Read Prior Evolve Reports

Before collecting new data, check for prior evolve reports to establish baseline:

1. **Find prior reports:**

        ls docs/evolve/*_evolve_report.md 2>/dev/null

2. **If prior reports exist, read the most recent one** and extract:
   - Date and time range of previous analysis
   - Actions that were applied (from "Actions Applied" table)
   - Patterns flagged for monitoring (from "Patterns to Monitor" section)
   - Total insight counts for trend comparison

3. **Build a "prior actions" checklist** — each applied action becomes an evaluation target in Phase 4.

4. **If no prior reports exist**, skip to Phase 1 (first run).

## Phase 1: Data Collection

Collect the following data (respect --since argument if provided, default 90 days).

Note: Translate shorthand to git format (e.g., "30d" → "30 days ago", "90d" → "90 days ago").

### GitHub Issues
Run: gh issue list --state all --limit 100 --json number,title,body,labels,state,createdAt,closedAt,comments

### Git Commit History
Run: git log --oneline --since="<range>" --format="%h %s" | head -200

### Commit File Changes
For the 50 most recent commits, identify which files each touched:
Run: git log --since="<range>" --name-only --format="%h %s" | head -500

### Session Summaries
Check for pattern data from `/session-summary`:
- Read `docs/session_summaries/patterns.md` if it exists
- Friction points with 3+ occurrences become automatic High-confidence insights

### Current State
- Read CLAUDE.md for current instructions
- List existing commands: ls commands/
- List existing stories: ls docs/stories/
- List existing test cases: ls cicd/tests/testcases/

### Fallback
- If `gh` CLI is not authenticated or the repo has no GitHub issues, skip issue analysis and proceed with git commits only.
- If git history is empty or too short, report "insufficient data" and exit gracefully.

## Phase 2: Pattern Detection

Analyze collected data for these categories:

### A. Workflow Gaps
- Repeated manual steps that could be automated
- Missing commands for common operations
- Stories without tests (gap in CI flow)
- Tests without stories (orphaned tests)
- Evidence: issues describing manual workarounds, commits adding repetitive boilerplate

### B. Friction Points
- Recurring corrections in commit history (look for "fix", "workaround", "revert", "correct", "patch")
- Frequent CLAUDE.md edits (indicates instructions need stabilization)
- Issues reopened or with long comment threads
- Test failures that required pattern adjustments
- Evidence: commit messages, issue comment counts, revert patterns

### C. Usage Patterns
- Commands or files always modified together (candidates for combining)
- MCP tools with high usage vs low usage
- Stories that follow a consistent dev-tasks-impl-test cycle vs those that skip steps
- Evidence: file co-occurrence in commits, story status fields

### D. Knowledge Decay
- CLAUDE.md sections contradicted by recent commits
- References to files, paths, or tools that no longer exist
- New MCP tools or workflows introduced but not documented
- Evidence: diff between documented state and actual repository state

## Phase 3: Generate Insights

For each detected pattern, create an insight entry:

| Field | Description |
|-------|-------------|
| Pattern | Short description of what was detected |
| Evidence | List of specific issue numbers and/or commit hashes |
| Confidence | Low (1 evidence point), Medium (2 points), High (3+ points) |
| Category | Workflow Gap / Friction Point / Usage Pattern / Knowledge Decay |
| Suggestion | Concrete, actionable improvement proposal |

## Phase 4: Evaluate Prior Actions (skip if no prior report)

For each action applied in the most recent prior evolve report, evaluate whether it worked:

### Evaluation Method

| Prior Action Type | How to Evaluate | Verdict |
|-------------------|-----------------|---------|
| CLAUDE.md rule added | Search commits for violations after it was added | **Effective** if no violations; **Partially effective** if reduced; **Ineffective** if same rate |
| Command updated | Check if the command's workflow improved (fewer fix commits) | Count fix commits before vs after |
| Convention added | Search for files/commits that violate the convention | Count violations |
| Test case added | Check if the test has been passing consistently | Review test results |

### Evaluation Output

    ## Prior Action Effectiveness (since [prior report date])

    | # | Prior Action | Verdict | Evidence |
    |---|-------------|---------|----------|
    | 1 | [action description] | Effective / Partial / Ineffective / Too early | [specific evidence] |

**Verdicts:**
- **Effective** — Zero or near-zero violations/recurrences
- **Partially effective** — Reduced but not eliminated
- **Ineffective** — Same rate; consider strengthening
- **Too early** — Not enough data yet (< 2 weeks); flag for next run

If an action was **Ineffective**, promote a follow-up fix to High priority in Phase 5.

## Phase 5: Propose Actions

Group all suggestions into these action categories:

1. **CLAUDE.md Updates** — Sections to add, update, or remove
2. **New Commands** — Name, purpose, draft outline (only if Medium+ confidence)
3. **Command Updates** — Modifications to existing command files
4. **Story/Test Gaps** — Missing stories or test coverage
5. **Memory Updates** (optional) — Project memories worth persisting

For each action, note:
- Priority: Critical / Important / Nice-to-have
- Effort: Small (minutes) / Medium (under an hour) / Large (multi-step)
- Risk: None / Low / Medium

## Phase 6: Output Report

Present findings as a structured report:

### Report Structure

    ## Evolve Report — [DATE]

    ### Summary
    - Time range analyzed: [range]
    - Issues analyzed: [count]
    - Commits analyzed: [count]
    - Insights found: [count] (High: N, Medium: N, Low: N)
    - Prior report: [date] or "First run"

    ### Prior Action Effectiveness
    (Include only if a prior report exists)

    | # | Prior Action | Verdict | Evidence |
    |---|-------------|---------|----------|
    | 1 | ... | Effective / Partial / Ineffective / Too early | ... |

    **Scorecard:** N effective, N partial, N ineffective, N too early out of N total

    ### High-Confidence Insights
    [Insights with 3+ evidence points, sorted by category]

    ### Medium-Confidence Insights
    [Insights with 2 evidence points]

    ### Proposed Actions
    [Numbered list grouped by category, with priority and effort]

    ### Low-Confidence Observations
    [Insights with 1 evidence point — for awareness only]

    ### Patterns to Monitor
    [Carry forward unresolved patterns + add new ones from this run.
     Each entry: pattern name, what to check, success criteria.]

## Phase 7: Apply (with confirmation)

After presenting the report, ask the user which actions to apply:

- **"apply all"** — Apply all proposed actions
- **"apply 1, 3, 5"** — Apply specific numbered actions
- **"save"** — Save report only (no actions applied)
- **"none"** — Discard report

When applying actions:
- Make changes incrementally, one action at a time
- Show a brief summary of each change after applying

### Always Save the Report

After applying actions (or if user chooses "save"), **always** save the report:

1. **Save to `docs/evolve/[YYYY-MM-DD]_evolve_report.md`** (create directory if needed)
   - Include the full report with all sections
   - Append an "Actions Applied" table showing which actions were applied vs skipped
   - Include a "Patterns to Monitor" section carried forward for the next run

2. **Update project memory** (if the project uses a memory system):
   - Record the report date, insight count, and key actions taken
   - Update "Patterns to Monitor" — carry forward unresolved items
```
