# STORY-025: SAML IdP Profile CRUD (`samlIdpProfiles`)

Adds the missing **SAML Identity Provider (IdP) profile** resource to the tool surface, under the
STORY-023 config-object CRUD contract. This is the companion-field gap flagged in STORY-017: the
`create_wifi_network` schema already accepts `type=saml`, but R1 `422`s without a SAML IdP profile to
bind — there was no tool to create one. Grounded in a live GUI + API trace (DEV tenant,
2026-06-01).

> **Scope / status (correction).** This story is the **dependency/prerequisite only** — the SAML IdP
> profile resource that issue **#97** is blocked on (#97 requires a test SAML IdP fixture before the
> WLAN binding can be traced and surfaced). It does **NOT** achieve the #97 goal: an agent still
> cannot create a SAML WLAN with the tools, because `create_wifi_network` has no parameter to bind a
> SAML IdP profile. **#97 remains OPEN**; the binding + `FOR SAML:` clause + WLAN integration test
> are tracked there (see STORY-026). Also note this story shipped **6** tools; the SP-metadata read
> should be folded into `get_saml_idp_profile` to return to the CRUD-5 norm (directory/RADIUS).

## Goal

Expose the five CRUD operations plus the SP-metadata read for `samlIdpProfiles`, so an agent can
stand up a SAML captive-portal WLAN end to end:

- `query_saml_idp_profiles` — list/filter.
- `get_saml_idp_profile` — by id (stored IdP metadata + attribute mappings).
- `get_saml_idp_service_provider_metadata` — the **SP** metadata XML (entityID + ACS) to configure
  on the external IdP.
- `create_saml_idp_profile(profileConfig)` — full config in.
- `update_saml_idp_profile(id, profileConfig)` — **full-config replace** (documented divergence).
- `delete_saml_idp_profile(id)`.

## Evidence — live wire (DEV, 2026-06-01)

Base `https://api.<region>.ruckus.cloud`. All mutations async (`202 {requestId}` → poll activities).

| Op | Method + path | Status | Notes |
|---|---|---|---|
| Create | `POST /samlIdpProfiles` | `202` | resp `{requestId, response:{id}}` |
| List | `POST /samlIdpProfiles/query` | `200` | `{data:[{id,name,signingCertificateEnabled,encryptionCertificateEnabled,wifiNetworkIds}], totalCount}` |
| Get | `GET /samlIdpProfiles/{id}` | `200` | `{name, metadata(base64 IdP XML), metadataUrl, attributeMappings[], updatedDate}` |
| SP metadata | `GET /samlIdpProfiles/{id}/serviceProviderMetadata` | `200` | SP `EntityDescriptor` XML (`Accept: text/xml`) |
| Update | `PUT /samlIdpProfiles/{id}` | `202` | **full-config replace** → `{requestId}` |
| Delete | `DELETE /samlIdpProfiles/{id}` | `202` | `{requestId}` |

Create/Update body:
```json
{
  "name": "keycloak-saml-jack",
  "signingCertificateEnabled": false,
  "encryptionCertificateEnabled": false,
  "attributeMappings": [
    {"name": "displayName",  "mappedByName": "displayName"},
    {"name": "email",        "mappedByName": "email"},
    {"name": "phoneNumber",  "mappedByName": "phone"}
  ],
  "metadataUrl": "https://<idp-host>/realms/<realm>/protocol/saml/descriptor"
}
```
- `attributeMappings[].name` = the R1 identity attribute (`displayName` | `email` | `phoneNumber`);
  `mappedByName` = the claim the IdP sends.
- IdP metadata supplied as `metadataUrl` (R1 fetches it **server-side**) **or** raw `metadata` XML.

## SP ↔ IdP relationship (why this matters)

R1 derives the SP identity from the 32-hex profile ID:
`SP entityID = https://<r1-host>/saml/{profileId}`,
`ACS = https://<r1-host>/g/ext/api/saml/{profileId}/callback`.
`get_saml_idp_service_provider_metadata` returns these so the agent can configure the external IdP
(e.g. a Keycloak SAML client). The profile ID is stable across updates, so the SP values don't churn
on `update_saml_idp_profile`.

## Deliberate divergence — full-config PUT (principle #7)

`update_saml_idp_profile` is **not** retrieve-then-merge. Like custom role, R1 does a full-replace
PUT, and the id-scoped GET does **not** round-trip: it returns `metadata` (base64 IdP XML) +
`updatedDate` and **omits** `signingCertificateEnabled`/`encryptionCertificateEnabled`. A
GET→merge→PUT would therefore send a lossy body. Confirmed by the GUI trace (the product PUTs the
whole object). So the tool takes a full `profileConfig` and PUTs it verbatim (no `getFn`,
no `applyMergePatch`). Documented per STORY-023 "When NOT to converge".

## Implementation

- Service (`src/services/ruckusApiService.ts`): `querySamlIdpProfiles`, `getSamlIdpProfile`,
  `getSamlIdpServiceProviderMetadata`, `createSamlIdpProfileWithRetry` (delegates to
  `createResourceWithPoll`), `updateSamlIdpProfileWithRetry` (direct PUT + `pollActivities`),
  `deleteSamlIdpProfileWithRetry` (DELETE + `pollActivities`).
- Tools (`src/mcpServer.ts`): the six registrations + handlers, mirroring the directory/radius
  profile tools. Net **+6 tools**.

## Acceptance criteria

- [x] `query/get/create/update/delete` + `get_saml_idp_service_provider_metadata` registered.
- [x] Create takes a full `profileConfig`; create reuses the shared `createResourceWithPoll` helper.
- [x] Update is a full-config PUT; divergence documented in code + this story.
- [x] `npm run build` green.
- [ ] Integration test: create (with a reachable IdP `metadataUrl`) → query asserts it exists →
      `get_saml_idp_service_provider_metadata` returns an `EntityDescriptor` → delete. (Fixture needs
      a reachable SAML IdP — see the firewall/Keycloak setup runbook in `r1-test-cases`.)
- [ ] Wire the new profile into a `type=saml` `create_wifi_network` path (companion-field follow-up
      to STORY-017).

## Risks / fixture dependency

- **R1 fetches `metadataUrl` server-side.** The IdP must be reachable from R1's backend or create
  fails async with `EXT-AUTH-10400`. The DEV Keycloak fixture required opening the IdP's firewall to
  R1's egress IP at two layers (GCP VPC + host) — see the runbook
  `r1-test-cases/docs/guides/R1_SAML_IdP_Keycloak_Setup_Guide.md`.
- **Enabling request signature / response encryption** makes a signing/encryption certificate
  required; the minimal create leaves both `false`.

## References

- STORY-023 (config-object CRUD; "When NOT to converge" — custom role full-config precedent).
- STORY-017 (portal types; SAML companion-field gap).
- `r1-test-cases/docs/guides/R1_SAML_IdP_Keycloak_Setup_Guide.md` — IdP + firewall fixture runbook.
- `.claude/rules/mcp-tool-patterns.md`, `.claude/rules/tool-descriptions.md`.
