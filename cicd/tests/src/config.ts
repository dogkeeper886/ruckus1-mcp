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
