/**
 * Project configuration for the test framework.
 */

export const SUITES = ['build', 'integration', 'e2e'] as const;
export type Suite = typeof SUITES[number];

export const CONFIG = {
  projectName: 'ruckus1-mcp',
  sessionPrefix: 'ruckus1-session',
  defaultTimeout: 60000,
  defaultStepTimeout: 30000,

  // LLM judge — a reserved, opt-in second opinion. The operative verdict is the
  // simple (deterministic, model-free) judge; set LLM_JUDGE_MODE=dual to also run
  // this. Reaches its model through the Anthropic SDK, so any Anthropic-compatible
  // endpoint (hosted or local) is configuration, not code. Kept dormant by default
  // on purpose — see issue #74 (the LLM judge produced no catches and caused
  // false-greens when it was on the default path).
  llm: {
    mode: process.env.LLM_JUDGE_MODE || 'simple', // 'simple' (default) | 'dual'
    baseUrl: process.env.LLM_JUDGE_URL || undefined,
    apiKey: process.env.ANTHROPIC_API_KEY || 'local',
    model: process.env.LLM_JUDGE_MODEL || 'claude-haiku-4-5-20251001',
    timeout: 300000,
    stdoutLimit: 1000,
    stderrLimit: 500,
    logsLimit: 3000,
  },

  logs: {
    cleanupAge: 24 * 60 * 60 * 1000,
    maxBuffer: 50 * 1024 * 1024,
  },
};

export const ERROR_PATTERNS: RegExp[] = [
  /\bError executing\b/i,
  /\bUnknown tool\b/i,
  /\bconnection refused\b/i,
  /\btimeout\b/i,
];

export const ERROR_EXCLUSIONS: RegExp[] = [
  /error.*handled/i,
  /expected.*error/i,
  /rejectPatterns/i,
  /_idleTimeout/i,
];
