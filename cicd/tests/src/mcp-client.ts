#!/usr/bin/env npx tsx
/**
 * Lightweight MCP client CLI for integration testing.
 * Spawns the MCP server, calls a tool, prints the result as JSON.
 *
 * Usage: npx tsx cicd/tests/src/mcp-client.ts <tool_name> '<json_args>'
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const [toolName, argsJson] = process.argv.slice(2);
if (!toolName) {
  console.error('Usage: mcp-client.ts <tool_name> [json_args]');
  process.exit(1);
}

const args = argsJson ? JSON.parse(argsJson) : {};

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcpServer.js'],
  env: { ...process.env } as Record<string, string>,
});

const client = new Client({ name: 'test-client', version: '1.0.0' });
await client.connect(transport);

const result = await client.callTool({ name: toolName, arguments: args });
console.log(JSON.stringify(result, null, 2));

await client.close();

// Reveal tool failure via exit code so the harness can't treat a failed call
// as a step pass. The server sets isError:true for sync 4xx (catch) and for
// async failed/timeout results (see toolResult in mcpServer.ts, #106). Exit 2
// distinguishes a tool-level failure from a usage error (1) or a transport/
// crash (also non-zero). Tests that intentionally trigger an error mark the
// step `expectError: true` so the runner expects this non-zero exit. (#107)
if ((result as { isError?: boolean }).isError === true) {
  process.exit(2);
}
