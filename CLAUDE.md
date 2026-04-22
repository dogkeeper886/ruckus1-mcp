# CLAUDE.md

Guidance for Claude Code working in this repository. This is a **Model Context Protocol (MCP) server** for RUCKUS One network management, written in TypeScript.

## Core Commands

- **Build:** `npm run build` (TypeScript → `dist/`)
- **Run MCP server (dev):** `npm run mcp` (ts-node)
- **Run MCP server (prod):** `npm start` (from `dist/`)
- **Run integration tests:** `cd cicd/tests && npm test`
- **List available tests:** `cd cicd/tests && npm run list`

## Project Layout

```
src/
  mcpServer.ts                 # MCP entry point — tool registration + handlers
  services/ruckusApiService.ts # All RUCKUS One API calls
  services/tokenService.ts     # OAuth2 token + cache
  types/                       # TypeScript interfaces
  utils/                       # config, errorHandler, validation, tokenCache
cicd/tests/
  src/                         # Test framework (cli.ts, mcp-client.ts, judge/, reporter/)
  testcases/                   # YAML test cases (build/, integration/, e2e/)
docs/
  stories/                     # STORY-XXX.md source of truth
.claude/
  skills/                      # Workflow skills (add-tool, dev-*, ci-*, evolve, session-summary, audit-tests)
  rules/                       # Path-scoped code patterns (loaded on file match)
```

## Environment

- Credentials via `.env`.
- Required: `RUCKUS_TENANT_ID`, `RUCKUS_CLIENT_ID`, `RUCKUS_CLIENT_SECRET`.
- Optional: `RUCKUS_REGION` (defaults to global).

## Architecture Notes

- OAuth2 client-credentials flow; JWT reused across calls via `tokenCache`.
- Regional API endpoints built dynamically from `RUCKUS_REGION` (`https://api.${region}.ruckus.cloud/...`, or `https://api.ruckus.cloud/...` when empty).
- Async operations (create/delete/update) return `requestId`; service-layer functions poll `getRuckusActivityDetails` until `SUCCESS`/`COMPLETED`/`FAIL` or timeout.
- `update_ruckus_ap` uses a **retrieve-then-update** pattern to preserve name/venueId/apGroupId/description when only some fields change.

## Workflow — What to Use When

Skills live in `.claude/skills/*/SKILL.md`. Invoke them by name:

| When | Skill |
|---|---|
| User pitches a new feature | `dev-story` |
| Story exists, needs breakdown | `dev-tasks` |
| Issues exist, need implementation | `dev-impl` |
| Implementation done, needs PR | `dev-create-pr` |
| PR open, needs review | `dev-review-pr` |
| PR approved | `dev-merge` |
| Adding a new MCP tool from an API log | `add-tool` |
| Story needs test coverage | `ci-testcase` |
| Running tests | `ci-run` |
| End-of-session wrap | `session-summary` |
| Accumulated friction to analyze | `evolve` |
| Pre-PR audit of YAML test assertions for weaknesses | `audit-tests` |

## Adding a New MCP Tool (summary)

Full process: use the **`add-tool`** skill. Concrete code templates: `.claude/rules/mcp-tool-patterns.md` (auto-loaded when editing files under `src/`).

Short version:
1. Create or update a story file (`docs/stories/STORY-XXX.md`) — single source of truth.
2. `dev-tasks` to create GitHub issues.
3. Implement in `src/services/ruckusApiService.ts` + register in `src/mcpServer.ts`. Follow the patterns in `.claude/rules/mcp-tool-patterns.md`.
4. `npm run build`.
5. `ci-testcase` + `ci-run` to add and execute YAML tests.
6. `dev-create-pr` → `dev-review-pr` → `dev-merge`.

## Test Case Pattern

YAML test cases under `cicd/tests/testcases/` call tools via `mcp-client.ts`:

```yaml
id: TC-INT-XXX
name: Descriptive test name
suite: integration
story: STORY-XXX
priority: 1
timeout: 30000
dependencies: []

steps:
  - name: Call the tool
    command: npx tsx cicd/tests/src/mcp-client.ts tool_name '{"arg":"value"}'
    expectPatterns:
      - "expected_field"
    rejectPatterns:
      - "isError"

criteria: |
  What this test verifies in plain language.
```

**Pattern-matching gotcha:** `mcp-client.ts` returns double-encoded JSON (the tool's JSON is inside a `text` field). Use **bare strings** in patterns (e.g., `networkId`) — quoted forms like `'"networkId"'` won't match the escaped output `\"networkId\"`. For the same reason, **do not** add `'"status": "failed"'` as a reject pattern — it cannot match the double-encoded stdout and is a dead assertion (see SO-1 in `docs/audit/2026-04-22_audit_report.md`). Use bare `isError` for the real failure signal.

**Fixture naming — always suffix with `{{TEST_RUN_ID}}`:** Any named fixture created by a test (venue, AP group, portal profile, WiFi network, identity group, DPSK service, etc.) must carry the `{{TEST_RUN_ID}}` suffix in every `command:` and `capture:` reference. The test framework auto-injects `TEST_RUN_ID` (GITHUB_RUN_ID in CI; a short random string locally) so each run creates uniquely-named fixtures. Example: `name:"mcp-test-venue-crud-{{TEST_RUN_ID}}"` and `capture.venueId: "data[name=mcp-test-venue-crud-{{TEST_RUN_ID}}].id"`. This prevents cross-run duplicate-name collisions when tenant residue lingers (see the TC-INT-203 RCA on 2026-04-22). For backend-derived companion names (e.g., `-owe-tr`, `-dpsk3-wpa2` suffixes), insert `{{TEST_RUN_ID}}` before the companion suffix: `mcp-test-wifi-owe-{{TEST_RUN_ID}}-owe-tr`. Bare name prefixes still work in `expectPatterns` / `rejectPatterns` because pattern matching is substring-based and the prefix remains present after substitution.

## MCP Integration Notes

- Transport: stdio. The server runs as a subprocess of the MCP client (Claude Desktop, Claude Code, etc.).
- Client configuration (`mcp.json`) is the caller's concern — not tracked in this repo.
- Registered resources: `ruckus://auth/token`, `ruckus://venues/list`.

## Pointers to Deeper Guidance

- **Code patterns** (templates, polling loops, 6 advanced async patterns): `.claude/rules/mcp-tool-patterns.md`.
- **Tool-description writing style** (PREREQUISITE/REQUIRED/FOR X: conventions): `.claude/rules/tool-descriptions.md`.
- **Workflows**: `.claude/skills/*/SKILL.md`.
