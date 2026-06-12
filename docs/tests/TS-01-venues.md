---
id: TS-01
title: Venue read and lifecycle management
namespace: ruckus1-mcp
story: STORY-021
story_hash: 7c0b75b40f84862cfcc3100d69e35172550efe80e3431fcb5bafa6f034748c87
status: green
---

## Why this scenario exists

Venues are the root container every other RUCKUS One resource hangs off (AP groups, Wi-Fi
activation, settings). These cases prove the venue surface an agent depends on: that it can
**list** venues, **page** through them, and run a venue **create → update → verify → delete**
lifecycle where a partial update preserves the fields it didn't touch.

> **Pilot note (STORY-028 #153).** This is the doc-first pilot for one resource area. The
> `story:` anchor is STORY-021 (the venues service-fn story) as the *closest* existing story —
> a deliberate port-forward choice, not a backfilled mapping. The drift anchor still does its
> job: if STORY-021 changes, `qw-drift` flags this scenario `stale` for a re-check.

### TC-01: List all venues

- **Objective:** `get_ruckus_venues` returns the tenant's venue list with a total count.
- **Script:** cicd/tests/testcases/integration/TC-INT-003.yml
- **Preconditions:** valid RUCKUS One credentials in the environment.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | List all venues (`get_ruckus_venues`) | response carries a `totalCount` and no error |

### TC-02: List venues with pagination

- **Objective:** venue listing honours page / pageSize parameters.
- **Script:** cicd/tests/testcases/integration/TC-INT-102.yml
- **Preconditions:** valid RUCKUS One credentials.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Query venues with page and pageSize (`get_ruckus_venues`) | paged response carries a `totalCount` and no error |

### TC-03: Venue CRUD lifecycle (create → partial-update → verify → delete)

- **Objective:** a venue can be created, partially updated (only `address.city`) with other
  fields preserved, verified, and deleted — the retrieve-then-merge update contract.
- **Script:** cicd/tests/testcases/integration/TC-INT-201.yml
- **Preconditions:** valid RUCKUS One credentials; async activities reachable.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create a test venue (`create_ruckus_venue`, name namespaced by `TEST_RUN_ID`) | activity reaches `completed` |
| 2 | Find the created venue's ID in the venue list | the namespaced venue name appears |
| 3 | Partial update — change only `address.city` (retrieve-then-merge) | activity reaches `completed` |
| 4 | Get the venue — verify the city changed and untouched fields are preserved | city reads `Osaka` |
| 5 | Delete the test venue | activity reaches `completed` |
| 6 | Verify the venue is gone from the list | response `totalCount` no longer includes it |

### TC-04: Venue settings — merged shape and category filter

- **Objective:** `get_venue_settings` returns the merged AP-level settings, and a category
  filter narrows the response to just that category (the folded getter from STORY-020).
- **Script:** cicd/tests/testcases/integration/TC-INT-004.yml
- **Preconditions:** valid RUCKUS One credentials; async activities reachable.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create a test venue (namespaced by `TEST_RUN_ID`) | activity reaches `completed` |
| 2 | Capture the venue's ID from the venue list | the namespaced venue name appears |
| 3 | `get_venue_settings` with no filter (all categories) | merged shape includes `radio` |
| 4 | `get_venue_settings` with `categories=[radio]` | only the `radio` category is returned |
| 5 | Delete the test venue | activity reaches `completed` |

### TC-05: Create venue with a missing required field returns an error

- **Objective:** creating a venue without the required `city` field surfaces an error rather
  than silently succeeding — a negative test (`expectError`).
- **Script:** cicd/tests/testcases/integration/TC-INT-302.yml
- **Preconditions:** valid RUCKUS One credentials.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create a venue without the required `city` field | the call surfaces an error (`isError`); the step passes *because* it failed (`expectError`) |

### TC-06: Delete venue with an invalid venueId returns an error

- **Objective:** deleting a venue with a non-existent `venueId` surfaces an error rather than
  silently succeeding — a negative test (`expectError`).
- **Script:** cicd/tests/testcases/integration/TC-INT-303.yml
- **Preconditions:** valid RUCKUS One credentials.

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Delete a venue with a non-existent `venueId` | the call surfaces an error (`isError`); the step passes *because* it failed (`expectError`) |
