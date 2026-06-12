# STORY-027: Sync the agent-workflow toolkit and modernize the README

Two pieces of project hygiene that ship together: (1) re-sync `.claude/` (commands, skills, rules,
and `CLAUDE.md`) from the upstream **agent-workflow** toolkit so the dev/QA pipeline a contributor
sees here matches the canonical one, and (2) rewrite the public **README** to current open-source
best practice, with hand-authored diagrams (architecture, request lifecycle, resource graph, project
tree) that let a newcomer grasp the key areas of the project at a glance.

## User Story

As a **contributor or evaluator landing on this repo for the first time**,
I want **the workflow tooling to match the canonical agent-workflow toolkit, and the README to
explain the project visually and accurately**,
So that **I can understand what the server does and how to work on it without reading the source.**

## The Need

Two drifts have accumulated:

- **Tooling drift.** The bespoke `.claude/` skills (`add-tool`, `audit-tests`, `ci-run`,
  `dev-impl`, `dev-merge`, …) and the project-specific `CLAUDE.md` predate the current
  **agent-workflow** toolkit. They no longer match the gated `dw-*` / `qw-*` pipeline the team
  actually follows, so the in-repo tooling misleads anyone who tries to use it.
- **README drift.** The README is accurate prose but **text-only** — no picture of how a request
  flows from an MCP client through the server to RUCKUS One, no map of the resource surface, and a
  tool count that no longer matches the code. A first-time reader has to reconstruct the architecture
  from `docs/architecture.md` and the source.

## Success Looks Like

- The `.claude/` toolkit (commands, skills, rules, `CLAUDE.md`) reflects the agent-workflow toolkit:
  the obsolete bespoke skills are gone and the `dev-workflow` / `qa-workflow` commands, the
  `reviewing-*` skills, and the workflow rules are present.
- The README opens with a clear value statement and includes diagrams a newcomer can read at a
  glance — at minimum: the layered architecture, a request lifecycle flow, the resource graph, and
  the project tree — each rendered as its own committed image the reader sees inline, not only ASCII.
- Every factual claim in the README matches the code (notably the **tool count**).
- The README still passes the project's human-read doc review bar (phrasing + typography).

## Open Questions

- Diagram production method, file format, and the exact set of diagrams — settled during
  implementation.
- Whether any of the deleted bespoke skills cover a gap the agent-workflow toolkit does not — confirm
  none are still referenced before removal.

## Status

- Created: 2026-06-12
- Plan: #144
- Issues: #145, #146, #147
- PR: #148 (open)
