# Add New MCP Tool from API Log

Add a new MCP tool to this server based on API logs, following the project's established patterns and guidelines.

## Process Overview

This command guides you through a systematic process to:
1. Analyze API logs to understand the operation
2. Study existing codebase patterns
3. Implement consistent code following project guidelines
4. Review for compliance with project standards
5. Stop and ask questions when clarification is needed

---

## Phase 1: Understand the Project

### Study Project Guidelines
- Read the project's CLAUDE.md file to understand architectural patterns
- Identify the distinction between operation types (read-only vs async)
- Review parameter ordering conventions
- Understand error handling patterns
- Note any specific naming conventions

### Study Existing Implementation
- Search for similar existing tools in the services layer
- Examine how existing tools are registered in the MCP server
- Review how existing tools handle errors
- Identify polling and retry patterns for async operations
- Find examples of read-only operations

**Action:** Use file search tools to locate similar implementations before writing any code.

---

## Phase 2: Gather Requirements

### Request API Log from User
Ask for:
- HTTP method and endpoint
- Request headers and payload structure
- Response structure and status codes
- Whether response includes async operation indicators
- Business purpose of the operation

### Analyze Operation Characteristics
Determine:
- Is this a read-only operation (GET, query) or a modifying operation (CREATE, UPDATE, DELETE)?
- Does it return an async tracking identifier?
- What parameters are required vs optional?
- What are the default values?
- Does it support pagination, filtering, or searching?

**Action:** Explicitly confirm operation type with the user before proceeding.

---

## Phase 3: Pattern Analysis

### Find Similar Existing Tools
Search the codebase for:
- Functions with similar operation types
- Functions calling similar API endpoints
- Functions with retry/polling logic (if async)
- Functions with query/filter patterns (if read-only)

### Extract Pattern Details
From the similar tool, identify:
- Parameter order and types
- Default values used
- API URL construction approach
- Request/response handling
- Error handling structure
- Polling logic structure (if applicable)

**Action:** Read the complete implementation of the most similar tool to use as a template.

---

## Phase 4: Implementation Planning

### Create Implementation Checklist
Use the todo tracking tool to plan:
1. Implement service layer function
2. Register tool in MCP server
3. Implement request handler
4. Review against project guidelines
5. Additional steps as needed

### Identify Potential Issues
Before coding, consider:
- Are there any unique aspects not covered by existing patterns?
- Does the API require new authentication approaches?
- Are there data transformation needs?
- Will responses exceed size limits requiring pagination?

**Action:** Stop and ask questions if the API log reveals patterns not seen in existing code.

---

## Phase 5: Service Layer Implementation

### Implement Core Function
Follow the pattern from similar existing tool:
- Use exact parameter ordering from the pattern
- Use exact default values from the pattern
- Copy API URL construction logic
- Copy request structure
- Copy error handling approach

### For Async Operations
If the operation is async:
- Copy polling loop exactly from existing async tool
- Do not modify retry defaults without approval
- Do not modify polling interval without approval
- Preserve activity tracking logic

### For Read-Only Operations
If the operation is read-only:
- Do not add retry parameters
- Do not add polling logic
- Return response data directly
- Follow query/filter patterns if applicable

**Action:** Add function to the appropriate service file, maintaining alphabetical or logical ordering.

---

## Phase 6: MCP Tool Registration

### Register Tool Schema
Following existing tool registration patterns:
- Define tool name following project naming conventions
- Write clear description including operation behavior
- Define input schema matching function parameters
- Mark required vs optional parameters correctly
- Include parameter descriptions
- Add retry parameters only for async operations

**Action:** Add tool definition to the tools array in the MCP server file.

---

## Phase 7: Request Handler Implementation

### Implement Handler Case
Following existing handler patterns:
- Add case statement for the new tool
- Destructure parameters with correct defaults
- Obtain authentication token using existing pattern
- Call service function with parameters in correct order
- Return response in standard format
- Copy error handling exactly from similar handler

### Error Handling
Ensure error handling includes:
- Try-catch structure matching existing handlers
- Logging following project conventions
- HTTP status code extraction if available
- Response data formatting
- Proper error response structure

**Action:** Add handler case to the request handler switch statement.

---

## Phase 8: Compliance Review

### Review Against Guidelines
Systematically verify:
- Parameter order matches project standards
- Default values match project standards
- Error handling matches existing patterns
- Response structure matches existing patterns
- No additional fields added beyond API response
- Polling logic unchanged (if async operation)
- Naming conventions followed

### Check for Pattern Violations
Verify there are no:
- Custom retry defaults different from project standard
- Custom polling intervals different from project standard
- Modified error handling that differs from templates
- Additional response metadata not in API response
- Hardcoded values that should be configurable

**Action:** Re-read the project guidelines and verify each rule is followed.

---

## Phase 9: Validation and Questions

### Stop for Clarification If Needed

Ask the user when:
- API pattern doesn't match any existing tool patterns
- Default values in similar tools are inconsistent
- API response structure is ambiguous
- Required vs optional parameters are unclear
- New code patterns would need to be introduced
- Assumptions about async behavior need validation

### Request Additional Information

If the API log is incomplete:
- Request complete request/response examples
- Ask about edge cases and error scenarios
- Clarify parameter constraints
- Verify authentication requirements
- Confirm regional endpoint requirements

**Action:** Do not proceed with assumptions - always clarify ambiguities.

---

## Phase 9.5: Tool Description Review

### Review Tool Description for AI Agent Clarity

Before finalizing, ensure the tool description is clear and actionable for AI agents:

**Description Structure:**
- Start with clear action and purpose
- Include PREREQUISITE if applicable (with tool reference)
- Include REQUIRED section listing all required parameters
- Provide tool references for obtaining IDs (e.g., "use query_wifi_networks to get network ID")
- Mention special conditions or warnings
- Clarify single vs batch operations if applicable

**Good Description Pattern:**
```
[Action verb] [what it does]. [Additional context]. PREREQUISITE: [condition] (use [tool_name]). REQUIRED: [param1] (use [tool_name] to get [param1]) + [param2] (use [tool_name] to get [param2]). [Special notes].
```

**Examples of Good Descriptions:**
- `'Permanently delete a WiFi network from RUCKUS One. This removes the network globally and cannot be undone. PREREQUISITE: Network must be deactivated from all venues first (use deactivate_wifi_network_at_venues). REQUIRED: networkId (use query_wifi_networks to get network ID).'`
- `'Activate an existing WiFi network at one or more venues. This is a batch operation that activates the network at specified venues in a single call. The network must already be created using create_wifi_network. REQUIRED: networkId (use query_wifi_networks to get network ID) + venueConfigs array (use get_ruckus_venues to get venue IDs). FOR GUEST PASS NETWORKS: Must provide portalServiceProfileId (use query_portal_service_profiles to get ID). FOR PSK NETWORKS: Do not provide portalServiceProfileId. Can activate at a single venue or multiple venues.'`

**Parameter Descriptions:**
Each parameter should also include tool references:
- `'ID of the WiFi network to delete (use query_wifi_networks to find network ID)'`
- `'Array of venue IDs (use get_ruckus_venues to get venue IDs)'`
- `'Portal service profile ID (use query_portal_service_profiles to get ID)'`

**Common Issues to Avoid:**
- ❌ Vague descriptions without tool references
- ❌ Missing PREREQUISITE information for destructive operations
- ❌ Not mentioning what tool to use to get required IDs
- ❌ Unclear warnings about permanent actions
- ❌ Missing context about batch vs single operations

**Action:** Review and update tool description to ensure AI agents understand:
1. What the tool does
2. What prerequisites must be met
3. How to obtain all required parameters
4. What special conditions apply
5. What the operation's scope is (single/batch, permanent/reversible)

---

## Phase 10: Summary and Documentation

### Provide Implementation Summary
Report:
- Files modified and functions added
- Pattern/template used as basis
- Operation type and characteristics
- Any deviations from standard patterns (with justification)
- Line numbers or locations of changes

### Testing Guidance
Suggest:
- How to manually test the new tool
- Expected input parameters
- Expected output structure
- Edge cases to verify
- Error scenarios to test

---

## Key Principles

1. **Consistency First**: Always copy existing patterns exactly rather than inventing new approaches
2. **No Assumptions**: Stop and ask questions when unclear
3. **No Modifications**: Do not modify retry defaults, polling intervals, or error handling without explicit approval
4. **Pattern Matching**: Find the most similar existing tool and follow its structure exactly
5. **Guideline Adherence**: Every decision should align with project guidelines
6. **Question Everything**: If something seems inconsistent or unusual, investigate and ask

---

## Execution

1. Start by studying the project structure and guidelines
2. Request API log from user
3. Analyze and confirm operation type
4. Find similar existing tool
5. Create implementation plan
6. Implement following exact patterns
7. Review against guidelines
8. Ask questions if needed
9. Review tool description for AI agent clarity
10. Provide summary

Use todo tracking throughout to maintain visibility into progress.
