---
paths:
  - "src/services/**/*.ts"
  - "src/mcpServer.ts"
  - "src/types/**/*.ts"
---

# MCP Tool Implementation Patterns

Concrete code templates for adding/modifying MCP tools in this repo. The `add-tool` skill describes the **process**; this file gives the **shapes**. Copy from the closest matching template — do not invent new structures.

## Operation Types

- **Read-only** (GET, Query): Synchronous. No retry parameters. No polling.
- **Async** (Create, Delete, Update): Returns `requestId`. Poll with `maxRetries=20`, `pollIntervalMs=5000`.
- **Pure builder** (no API call): Rare. See "Pure Builder Tool Pattern" — use only to shape complex discriminated-union configs for other tools.

## Read-Only Operations

### Standard Query Pattern

```typescript
// src/services/ruckusApiService.ts
export async function queryYourResource(
  token: string,               // ALWAYS first parameter
  region: string = '',         // ALWAYS this default
  filters: any = {},
  fields: string[] = ['id', 'name'],
  searchString: string = '',
  searchTargetFields: string[] = ['name'],
  page: number = 1,
  pageSize: number = 10,       // Or 10000 for internal tools (e.g. queryVenues uses 10000 to return all venues in one call)
  sortField: string = 'name',
  sortOrder: string = 'ASC'
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/query/endpoint`
    : 'https://api.ruckus.cloud/your/query/endpoint';

  const payload = {
    fields, searchString, filters, page, pageSize,
    defaultPageSize: 10, total: 0, sortField, sortOrder, searchTargetFields
  };

  const response = await makeRuckusApiCall({
    method: 'post', url: apiUrl, data: payload,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, 'Query operation name');

  return response.data;
}
```

### Simple GET Pattern

```typescript
export async function getYourResource(
  token: string,
  resourceId: string,
  region: string = ''
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/resource/${resourceId}`
    : `https://api.ruckus.cloud/your/resource/${resourceId}`;

  const response = await makeRuckusApiCall({
    method: 'get', url: apiUrl,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, 'Get operation name');

  return response.data;
}
```

### Exception: Client-Side Filtering (token-limit cases only)

Use **only** when: (1) API response > 25,000 tokens and (2) no server-side filter exists. Always prefer server-side filtering when available.

```typescript
export async function queryLargeResource(
  token: string,
  region: string = '',
  apiParam1: boolean = false,   // API parameters first
  filterField: string = '',     // Client-side filters last
  searchString: string = '',
  page: number = 1,
  pageSize: number = 100
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/your/endpoint`;
  const response = await makeRuckusApiCall({
    method: 'get', url,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, 'Query operation');

  let data = response.data;
  if (filterField?.trim()) {
    data = data.filter((item: any) => item.fieldName?.toLowerCase() === filterField.toLowerCase());
  }
  if (searchString?.trim()) {
    const s = searchString.toLowerCase();
    data = data.filter((item: any) => item.name?.toLowerCase().includes(s) || item.description?.toLowerCase().includes(s));
  }
  const startIndex = (page - 1) * pageSize;
  const paginated = data.slice(startIndex, startIndex + pageSize);
  return { data: paginated, pagination: { page, pageSize, total: data.length, totalPages: Math.ceil(data.length / pageSize) } };
}
```

## Async Operations

### Basic Template

```typescript
export async function yourNewToolWithRetry(
  token: string,
  requiredParam1: string,
  requiredParam2: string,
  region: string = '',
  maxRetries: number = 20,      // ALWAYS 20
  pollIntervalMs: number = 5000 // ALWAYS 5000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/your/endpoint`
    : `https://api.ruckus.cloud/your/endpoint`;

  const response = await makeRuckusApiCall({
    method: 'post', url: apiUrl, data: payload,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, 'Operation Name');

  const operationResponse = response.data;
  const activityId = operationResponse.requestId;

  if (!activityId) {
    return { ...operationResponse, status: 'completed', message: 'Operation completed successfully (synchronous operation)' };
  }
  // Then polling loop — see next section.
}
```

### Polling Loop — Pattern B (preferred for new code)

```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  console.log(`[RUCKUS] Polling attempt ${attempt}/${maxRetries}...`);
  const activityDetails = await getRuckusActivityDetails(token, activityId, region);
  if (activityDetails.status === 'COMPLETED' || activityDetails.status === 'SUCCESS') {
    return { status: 'completed', /* ... */ };
  }
  if (activityDetails.status === 'FAIL') {
    return { status: 'failed', /* ... */ };
  }
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}
return { status: 'timeout', /* ... */ };
```

### Polling Loop — Pattern A (older code — acceptable when modifying)

```typescript
let retryCount = 0;
while (retryCount < maxRetries) {
  const activityDetails = await getRuckusActivityDetails(token, activityId, region);
  const isCompleted = activityDetails.endDatetime !== undefined;
  if (isCompleted && activityDetails.status === 'SUCCESS') { return { status: 'completed', /* ... */ }; }
  if (activityDetails.status === 'FAIL') { return { status: 'failed', /* ... */ }; }
  retryCount++;
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}
return { status: 'timeout', /* ... */ };
```

## Pure Builder Tool Pattern

**When to use:** Agents can't reliably construct discriminated-union configs from a flat schema (and MCP clients render JSON Schema `oneOf` inconsistently). Use a `build_*` tool that accepts a `mode` discriminator and returns a ready-to-use config object.

**When NOT to use:**
- Never for anything that talks to RUCKUS (that's Read-only or Async).
- Never as a thin field-renamer. The builder must resolve a real discovery problem.
- Not for transformations callers can do themselves.

**Precedent:** `build_wifi_scheduler_config` — emits one of four scheduler shapes (ALWAYS_ON, LEGACY_CUSTOM, BASIC, ADVANCED). Output is passed as `scheduler` to `activate_wifi_network_at_venues` or `settings.scheduler` to `update_venue_wifi_network_settings`.

**Shape:**
- Tool name: `build_*` prefix — signals "no side effect".
- First input: `mode` enum (the discriminator).
- Other inputs: one nested object per mode, containing only that mode's valid fields.
- Output: `content[0].text = JSON.stringify(result, null, 2)`.
- No service function, no RUCKUS call, no token, no polling. Handler lives in `src/mcpServer.ts`.
- Validate required inputs for the selected mode and throw a clear error; let RUCKUS validate wire-level combinations.
- Update descriptions of consuming tools to say "call the builder first."

## MCP Registration Templates

### Read-Only (Query)

```typescript
{
  name: 'query_your_resource',
  description: 'Query your resource from RUCKUS One with filtering and pagination support',
  inputSchema: {
    type: 'object',
    properties: {
      filters: { type: 'object', description: 'Optional filters to apply' },
      fields: { type: 'array', items: { type: 'string' }, description: 'Fields to return (default: ["id", "name"])' },
      searchString: { type: 'string', description: 'Search string to filter resources' },
      searchTargetFields: { type: 'array', items: { type: 'string' }, description: 'Fields to search in (default: ["name"])' },
      page: { type: 'number', description: 'Page number (default: 1)' },
      pageSize: { type: 'number', description: 'Number of results per page (default: 10)' },
      sortField: { type: 'string', description: 'Field to sort by (default: "name")' },
      sortOrder: { type: 'string', description: 'Sort order - ASC or DESC (default: "ASC")' }
    },
    required: []
  }
}
```

### Read-Only (Simple GET)

```typescript
{
  name: 'get_your_resource',
  description: 'Get detailed information for a specific resource',
  inputSchema: {
    type: 'object',
    properties: {
      resourceId: { type: 'string', description: 'ID of the resource to get' }
    },
    required: ['resourceId']
  }
}
```

### Async

```typescript
{
  name: 'your_new_tool',
  description: 'Clear description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      requiredParam1: { type: 'string', description: 'Description' },
      requiredParam2: { type: 'string', description: 'Description' },
      maxRetries: { type: 'number', description: 'Maximum number of polling retries (default: 20)' },
      pollIntervalMs: { type: 'number', description: 'Polling interval in milliseconds (default: 5000)' }
    },
    required: ['requiredParam1', 'requiredParam2']
  }
}
```

> Writing the `description` text: see `.claude/rules/tool-descriptions.md`.

## MCP Handler Templates

### Read-Only (Query)

```typescript
case 'query_your_resource': {
  try {
    const {
      filters = {}, fields = ['id', 'name'], searchString = '',
      searchTargetFields = ['name'], page = 1, pageSize = 10,
      sortField = 'name', sortOrder = 'ASC'
    } = request.params.arguments as {
      filters?: any; fields?: string[]; searchString?: string;
      searchTargetFields?: string[]; page?: number; pageSize?: number;
      sortField?: string; sortOrder?: string;
    };

    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!, process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!, process.env.RUCKUS_REGION
    );

    const result = await queryYourResource(
      token, process.env.RUCKUS_REGION,
      filters, fields, searchString, searchTargetFields,
      page, pageSize, sortField, sortOrder
    );

    console.log('[MCP] Query response:', result);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    console.error('[MCP] Error querying resource:', error);
    let errorMessage = `Error querying resource: ${error}`;
    if (error.response) {
      errorMessage += `\nHTTP Status: ${error.response.status}`;
      errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data, null, 2)}`;
      errorMessage += `\nResponse Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
    } else if (error.request) {
      errorMessage += `\nNo response received: ${error.request}`;
    }
    return { content: [{ type: 'text', text: errorMessage }], isError: true };
  }
}
```

### Read-Only (Simple GET)

Same error-handling shape as Query; body:

```typescript
case 'get_your_resource': {
  try {
    const { resourceId } = request.params.arguments as { resourceId: string };

    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!, process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!, process.env.RUCKUS_REGION
    );

    const result = await getYourResource(token, resourceId, process.env.RUCKUS_REGION);
    console.log('[MCP] Get response:', result);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    // Same error handling as Query case above.
  }
}
```

### Async

```typescript
case 'your_new_tool': {
  try {
    const {
      requiredParam1, requiredParam2,
      maxRetries = 20, pollIntervalMs = 5000
    } = request.params.arguments as {
      requiredParam1: string; requiredParam2: string;
      maxRetries?: number; pollIntervalMs?: number;
    };

    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!, process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!, process.env.RUCKUS_REGION
    );

    const result = await yourNewToolWithRetry(
      token, requiredParam1, requiredParam2,
      process.env.RUCKUS_REGION, maxRetries, pollIntervalMs
    );

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    // COPY error handling exactly from existing tool — do not modify.
  }
}
```

## Enforcement Rules

**Read-only (Query/GET):**
- COPY patterns from `queryApGroups`, `getRuckusActivityDetails`, `queryAPs`.
- No retry params. No polling. No extra response fields.

**Async (Create/Delete/Update):**
- `maxRetries = 20`, `pollIntervalMs = 5000`. Do not change.
- COPY polling loop and error handling from an existing tool.
- No extra response metadata.
- Check if one of the Advanced Patterns below applies.

## Config-Object CRUD (preferred default for mutable resources) — STORY-023

For a resource with a create/update/delete lifecycle, **prefer** one config-object shape over hand-rolled per-field payloads. This is guidance to apply with judgment, not a mandate — see "When NOT to converge" below, and lean on the live wire over any rule here.

**The shape (one mental model — "send the slice you want to change"):**
- `create_<resource>(<resource>Config)` — the full config object in.
- `update_<resource>(id, <resource>Config)` — a **partial** of the *same* object; unspecified fields are preserved.
- `get_<resource>(id)` (id-scoped) + `query_<resource>` (list).

**Shared helpers (in `ruckusApiService.ts`) — delegate to these rather than re-implementing the POST/PUT/poll by hand:**
- `updateResourceWithMerge({ token, id, partial, getFn, putUrl, headers, resourceName, omitKeys?, maxRetries?, pollIntervalMs? })` — GET current via `getFn` → `applyMergePatch(current, partial)` (RFC 7386: objects merge recursively, arrays/scalars replace wholesale, `null` deletes a key) → PUT merged body → poll.
- `createResourceWithPoll({ token, config, postUrl, headers, resourceName, maxRetries?, pollIntervalMs? })` — POST the full config → poll.
- `pollActivities(token, region, requestIds, maxRetries, pollIntervalMs, { resource, action })` — consolidated polling; returns `{ status: "completed" | "failed" | "timeout", ... }` (failed/timeout surface as `isError` at the handler via `toolResult`).

A converged resource's service fn becomes a thin wrapper (build base URL + headers, delegate). Reference implementations: `update_radius_server_profile`, `create_ruckus_venue`, AP group, and `update_wifi_network` (the original).

**Verify the wire before adopting — do NOT assume GET == PUT.** Confirm against the live API or a GUI trace that the resource's GET body PUTs back. Common reshapes, each handled in the thin wrapper:
- PUT rejects read-only GET fields → list them in `omitKeys` (precedent: portal strips `id`, `networkIds` — `GUEST-400000`).
- The PUT needs a field the GET omits → inject it in the wrapper before delegating (precedent: AP group injects `venueId`).
- Secrets: confirm the GET returns them so the merge preserves them (RADIUS `sharedSecret`, directory `adminPassword` do; verify per resource).

**When NOT to converge (symmetry is the aim, not dogma — keep it specialized and document why):**
- The GET is status/telemetry that doesn't round-trip on PUT (precedent: access point — `clientCount`, `radioStatuses`, …).
- The operation has move/assignment semantics hitting a different endpoint (precedent: AP venue/group moves).
- The product itself does a full-replace PUT with no id-scoped GET (precedent: custom role — confirmed by GUI trace).
- Create carries genuine business logic the generic POST would drop (precedent: custom role permission-enrichment).

In those cases keep the existing specialized implementation and record the divergence with evidence (see STORY-023). Forcing the generic pattern there makes the code worse, not better.

**Discoverability tradeoff:** a free-form config object can't express per-field `required`/types in the MCP input schema — compensate with a thorough tool description (see `tool-descriptions.md`): enumerate the important fields, required-by-type fields, sub-resource association keys, and the producer tool for each ID.

## Advanced Async Patterns

### 1. Conditional async steps

When a multi-step async operation has steps that fire only under certain inputs.

```typescript
// Step 1: Always execute
const step1RequestId = (await makeRuckusApiCall({...}, 'Step 1')).data.requestId;

// Step 2: Conditional
let step2RequestId: string | undefined;
if (condition) {
  step2RequestId = (await makeRuckusApiCall({...}, 'Step 2')).data.requestId;
}

// Collect all requestIds (conditional included only if executed)
const requestIds = [
  { id: step1RequestId, name: 'Step 1' },
  ...(step2RequestId ? [{ id: step2RequestId, name: 'Step 2' }] : []),
  { id: step3RequestId, name: 'Step 3' }
];
```

**Precedent:** `createWifiNetworkWithRetry` conditionally associates the portal service profile for guest networks. Use the spread-with-conditional idiom and include all requestIds (even undefined) in the response.

### 2. Retrieve-then-update for full config preservation

> **Prefer the shared `updateResourceWithMerge` helper** (see "Config-Object CRUD" above) for new/refactored update tools — it generalizes this pattern (GET → JSON Merge Patch → PUT → poll) and handles reshapes via `omitKeys`. The hand-rolled form below remains valid for resources that legitimately diverge (verify the wire first).

When an update must preserve **all** existing fields (not just specific ones).

Distinct from the AP update pattern:
- **AP update** (`updateApWithRetrieval`): preserves specific fields (name, venueId, apGroupId, description).
- **Full config**: spreads the entire retrieved config.

```typescript
// Step 0: Retrieve full resource config if not provided
let resourceConfig: any = fullConfigProvided
  ? fullConfigProvided
  : await getResource(token, resourceId, region);

// Step 1: Merge full config with updates
const updatePayload = {
  ...resourceConfig,
  fieldToUpdate: newValue,
  id: resourceId // always include
};
```

**Precedent:** `activateWifiNetworkAtVenuesWithRetry` retrieves full network config before updating with venues. Accept optional `fullConfig` parameter for advanced callers.

### 3. Optional payload (empty body)

When an endpoint accepts both an empty body and a payload, with different behavior.

```typescript
const payload = (param1 === false && param2 === false)
  ? undefined            // empty body
  : { param1, param2 };
```

Use `undefined`, not `{}`. **Precedent:** `updateWifiNetworkRadiusServerProfileSettingsWithRetry` uses empty payload when both `enableAccountingProxy` and `enableAuthProxy` are false.

### 4. Type-based conditional logic

Different resource types need different payload fields but share the overall flow.

```typescript
const resourceType = resourceConfig.type || resourceConfig.nwSubType;
const isSpecialType = resourceType === 'special';

const payload: any = {
  name: config.name,
  type: config.type,
  ...(isSpecialType ? {
    specialField: config.specialField,
    specialConfig: config.specialConfig
  } : {
    standardField: config.standardField
  })
};
```

Detect type early. Use `type || nwSubType` for fallback. **Precedent:** Guest pass vs PSK RADIUS payloads (`enableAuthProxy: true` vs `false`).

### 5. Multi-step operations with conditional steps

Combines patterns 1 and 4. Same polling loop for all requestIds.

```typescript
const step1RequestId = (await makeRuckusApiCall({...}, 'Step 1')).data.requestId;

let step2RequestId: string | undefined;
if (isSpecialType && optionalParam) {
  step2RequestId = (await makeRuckusApiCall({...}, 'Step 2')).data.requestId;
}

const step3RequestId = (await makeRuckusApiCall({...}, 'Step 3')).data.requestId;

const requestIds = [
  { id: step1RequestId, name: 'Step 1' },
  ...(step2RequestId ? [{ id: step2RequestId, name: 'Step 2' }] : []),
  { id: step3RequestId, name: 'Step 3' }
];
// ... standard polling across requestIds
```

**Precedent:** `createWifiNetworkWithRetry`: create + (conditional) portal association + RADIUS.

### 6. Type-based early return (different flows)

Different resource types need **completely different** flows — not just different fields.

```typescript
const networkType = networkConfig.type || networkConfig.nwSubType;
const isEnterpriseType = networkType === 'aaa';

if (isEnterpriseType) {
  console.log('[RUCKUS] Enterprise type - using simple flow');
  const requestIds: Array<{ id: string; name: string }> = [];
  for (const item of items) {
    const response = await makeRuckusApiCall({...});
    if (response.data.requestId) {
      requestIds.push({ id: response.data.requestId, name: `Operation for ${item}` });
    }
  }
  // Poll and return early
  return { status: 'completed', /* ... */ };
}

// Standard types: existing multi-step flow
```

**Precedent:** 802.1x activation/deactivation — 1 API call per venue, vs. PSK/guest multi-step flows.

## Pre-Implementation Checklist

- [ ] Determined operation type (read-only vs async vs builder).
- [ ] Picked a similar existing tool to copy from (read-only: `queryApGroups` / `getRuckusActivityDetails`; async: `createVenueWithRetry`).
- [ ] Parameter order, defaults, and error handling match the pattern.
- [ ] For a create/update on a mutable resource: considered **Config-Object CRUD** first (delegate to `updateResourceWithMerge` / `createResourceWithPoll`); verified the GET→PUT wire shape; or documented why the resource diverges.
- [ ] For async: checked which advanced patterns apply:
  - [ ] Multi-step operation with conditional steps? (pattern 1 / 5)
  - [ ] Type-based conditional logic in the payload? (pattern 4)
  - [ ] Full config preservation required (retrieve-then-update)? (pattern 2)
  - [ ] Optional payload / empty body support needed? (pattern 3)
  - [ ] Type-based early return for completely different flows? (pattern 6)

## Activity Status Values

RUCKUS API returns these statuses for async operations:

- `'SUCCESS'` — completed successfully
- `'COMPLETED'` — completed (alias for SUCCESS on some endpoints)
- `'FAIL'` — failed
- `'INPROGRESS'` — still running

```typescript
if (activityDetails.status === 'COMPLETED' || activityDetails.status === 'SUCCESS') {
  // Success
} else if (activityDetails.status === 'FAIL') {
  // Failed
}
// Otherwise: still in progress, continue polling
```
