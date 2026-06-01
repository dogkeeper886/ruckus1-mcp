# STORY-025: SAML IdP Profile CRUD (`samlIdpProfiles`)

Adds the missing **SAML Identity Provider (IdP) profile** resource to the tool surface, under the
STORY-023 config-object CRUD contract. This is the companion-field gap flagged in STORY-017: the
`create_wifi_network` schema already accepts `type=saml`, but R1 `422`s without a SAML IdP profile to
bind — there was no tool to create one. Grounded in a live GUI + API trace (DEV tenant,
2026-06-01).

> **Scope.** Single source of truth for SAML support, tracking GitHub issue **#97**. Two parts that
> ship together: (1) the `samlIdpProfiles` resource (CRUD-5) so a SAML IdP can exist on the tenant,
> and (2) the `create_wifi_network` `type=saml` binding (`samlIdpProfileId`) that uses it. Together an
> agent can stand up a SAML captive-portal WLAN end to end — no GUI. **#97 is closed by part (2).**

## Goal

A SAML captive-portal WLAN, created entirely with the tools. Two pieces:

**A. `samlIdpProfiles` resource (CRUD-5):**
- `query_saml_idp_profiles` — list/filter.
- `get_saml_idp_profile(id [, includeServiceProviderMetadata])` — by id (stored IdP metadata +
  attribute mappings); with `includeServiceProviderMetadata=true` it **also** returns, under
  `serviceProviderMetadata`, the **SP** metadata XML (entityID + ACS) to register on the external IdP.
- `create_saml_idp_profile(profileConfig)` — full config in.
- `update_saml_idp_profile(id, profileConfig)` — **full-config replace** (documented divergence).
- `delete_saml_idp_profile(id)`.

The SP-metadata read is **folded into `get_saml_idp_profile`** (a flag) rather than a 6th standalone
tool — keeping the CRUD-5 surface (directory/RADIUS parity), per STORY-023 principle #3.

**B. SAML WLAN binding (#97):** `create_wifi_network` gains a top-level `samlIdpProfileId`; for
`type=saml` it binds the profile to the new WLAN. Mirrors the directory/WISPr/Cloudpath
companion-field pattern (#94/#95/#96).

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
`get_saml_idp_profile(id, includeServiceProviderMetadata=true)` returns these so the agent can
configure the external IdP (e.g. a Keycloak SAML client). The profile ID is stable across updates, so
the SP values don't churn on `update_saml_idp_profile`.

## Deliberate divergence — full-config PUT (principle #7)

`update_saml_idp_profile` is **not** retrieve-then-merge. Like custom role, R1 does a full-replace
PUT, and the id-scoped GET does **not** round-trip: it returns `metadata` (base64 IdP XML) +
`updatedDate` and **omits** `signingCertificateEnabled`/`encryptionCertificateEnabled`. A
GET→merge→PUT would therefore send a lossy body. Confirmed by the GUI trace (the product PUTs the
whole object). So the tool takes a full `profileConfig` and PUTs it verbatim (no `getFn`,
no `applyMergePatch`). Documented per STORY-023 "When NOT to converge".

## SAML WLAN binding (#97) — live wire

Confirmed by a fresh GUI trace (DEV, 2026-06-01): creating a `type=saml` captive-portal WLAN fires

- `POST /wifiNetworks` — base body with `guestPortal.guestNetworkType = "SAML"` and a **non-empty
  walled garden** (R1 returns `WIFI-10594 "Walled Garden is mandatory"` otherwise; the walled garden
  must allowlist the IdP host so the redirected client can reach it pre-auth).
- `PUT /wifiNetworks/{id}/portalServiceProfiles/{portalId}` — portal association.
- `PUT /wifiNetworks/{id}/samlIdpProfiles/{samlIdpProfileId}` — **empty body**, the SAML IdP binding,
  byte-identical pattern to the directory/portal/DPSK associations.

So `create_wifi_network` surfaces `samlIdpProfileId` as a top-level param;
`createWifiNetworkWithRetry` adds the conditional `PUT …/samlIdpProfiles/{id}` step and folds its
`requestId` into the consolidated poll (mirrors the directory Step-6 block). `guestNetworkType=SAML`
is already mapped by `PORTAL_TYPE_TO_WIRE` (STORY-017). The `FOR SAML:` clause names
`create_saml_idp_profile` + `query_portal_service_profiles` and the mandatory walled garden.

## Implementation

- Service (`src/services/ruckusApiService.ts`): `querySamlIdpProfiles`, `getSamlIdpProfile` (with the
  `includeServiceProviderMetadata` fold), `getSamlIdpServiceProviderMetadata` (now internal — called
  by the get), `createSamlIdpProfileWithRetry` (delegates to `createResourceWithPoll`),
  `updateSamlIdpProfileWithRetry` (direct PUT + `pollActivities`), `deleteSamlIdpProfileWithRetry`
  (DELETE + `pollActivities`); plus the `samlIdpProfileId` association step in
  `createWifiNetworkWithRetry`.
- Tools (`src/mcpServer.ts`): the **5** `samlIdpProfiles` registrations + handlers (CRUD-5), and the
  `samlIdpProfileId` param + `FOR SAML:` clause on `create_wifi_network`. Net **+5 tools**.

## Acceptance criteria

- [x] `query/get/create/update/delete` registered (CRUD-5); SP-metadata folded into `get` via
      `includeServiceProviderMetadata` (no 6th tool).
- [x] Create takes a full `profileConfig`; reuses the shared `createResourceWithPoll` helper.
- [x] Update is a full-config PUT; divergence documented in code + this story.
- [x] `create_wifi_network` accepts `samlIdpProfileId`; for `type=saml` it binds the profile via
      `PUT /wifiNetworks/{id}/samlIdpProfiles/{id}` (closes #97). `FOR SAML:` clause added.
- [x] `npm run build` green.
- [x] Integration tests pass live: **TC-INT-340** (profile CRUD + folded SP-metadata get) and
      **TC-INT-341** (full SAML WLAN lifecycle — create with binding → `captiveType=SAML` →
      activate/deactivate → cleanup).

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
