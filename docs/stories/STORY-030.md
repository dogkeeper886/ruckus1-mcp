# STORY-030: Surface marketing opt-in on guest pass credentials

## User Story

As an operator querying guest pass credentials through the MCP server,
I want each guest pass to show whether the guest opted in to marketing (and their full name),
So that I can see the same consent information the RUCKUS One dashboard shows and act on it.

## The Need

The RUCKUS One dashboard's Guest Pass Credentials page shows a marketing opt-in
column for each guest, but the MCP `query_guest_passes` tool never returns it. An
operator working through the MCP server therefore can't tell which guests consented
to marketing, even though the data exists upstream. The full name shown alongside it
in the dashboard is likewise missing.

This was confirmed against the live dashboard: for the same guests, it shows a
marketing opt-in value (and full name) that the MCP server does not surface — so the
information already exists upstream and is simply not reaching the operator.

## Success Looks Like

- Querying guest pass credentials through the MCP server returns each guest's
  marketing opt-in status and full name, matching what the dashboard shows for the
  same guests.
- Guests who never had these values (e.g. SelfSign passes) still come back cleanly,
  without errors or noise.

## Open Questions

- Should both fields be part of the default result, or only `marketingOptIn`?
- Naming: surface the field as the upstream `marketingOptIn`, or a friendlier name?
- Any existing tests / fixtures that assert the current field list and need updating?

## Status

- Created: 2026-06-13
- Completed: 2026-06-13
- Plan: #174
- Issues: #175
- PR: #176 (merged)
