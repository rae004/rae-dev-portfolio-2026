# Production Deployment Plan

Source of truth for taking `rae-dev.com` from Vercel to the AWS stack that
already serves `dev.rae-dev.com`, and for the release pipeline that keeps it
fed afterwards.

Status legend: ⬜ todo · 🔄 in progress · ✅ done

## Decisions (agreed 2026-09-27)

| Topic | Decision |
|---|---|
| Prod domain | `rae-dev.com` apex, `www.rae-dev.com` aliased to it. `raeengel.dev` was a placeholder and is gone. |
| Current site | The existing portfolio on Vercel is what we're replacing. Vercel stays up as a fallback for a short period after cutover, then is decommissioned. |
| Promotion | Manual approval gate on the GitHub `prod` Environment (required reviewer). No prod deploy happens without a human click. |
| Release candidates | Every real-change PR builds an RC and deploys it to dev. Dependabot / release-please / any bot PR never mints an RC. |
| Tag flow | A release tag deploys to **dev first** (automatically), then to prod after approval — prod only ever ships an artifact that has run on dev. |
| release-please token | Keep the default `GITHUB_TOKEN` and accept one "Approve and run" click per release PR, rather than adding a long-lived PAT. Revisit if the click gets annoying. |

## Target release flow

```
feature PR opened / pushed
  └─► CI + RC build (x.y.z-rc.<PR#>.<sha7>) → dev          auto, real changes only
        │ merge
        ▼
release-please updates "chore(main): release x.y.z" PR     accumulates features
        │ merge (one "Approve and run" click for its CI)
        ▼
tag vX.Y.Z
  ├─► tagged build → dev                                    auto
  └─► tagged build → prod                                   after approval on `prod` env
```

"Real changes only" for RCs means all of: `pull_request` event (not draft);
head branch not `dependabot/**` or `release-please--**`; actor not
`dependabot[bot]` / `github-actions[bot]`; the diff touches `frontend/**`.
Concurrency group `preview-dev` with cancel-in-progress, so a new push
supersedes an in-flight RC deploy. The workflow comments on the PR with the
RC version that is live on dev.

Security: RC deploys use `pull_request` — **never `pull_request_target`**
(see `supply_chain_hardening.md`). Same-repo PRs may use the `dev`
Environment's OIDC role; fork PRs receive no secrets and simply can't deploy.

## Current state (2026-09-27)

Already in place:

- `RaePortfolioProd` stack defined in `infrastructure/bin/infrastructure.ts`:
  `micro_3_0` LightSail, retained S3 buckets, `api.<domain>` / `media.<domain>`,
  its own contact-form Lambda + HTTP API, `github-deploy-prod` OIDC role
  scoped to GitHub Environment `prod`, Route 53 records for apex / `www` / `api`.
- Frontend `production` config → `https://api.rae-dev.com`; `pnpm build:prod`.
- WordPress CORS allowlists `https://rae-dev.com`.
- release-please → tag → `deploy-frontend.yml` (dev) works end to end.
- `wordpress/scripts/seed.sh` can seed a remote Bitnami LightSail WP over SSH
  (idempotent, upserts by slug).

Gaps:

1. `rae-dev.com` A → Vercel (`76.76.21.21`); `www` CNAME → Vercel. The prod
   stack would try to create the apex record and fail on the conflict.
2. CDK prod default domain is `raeengel.dev`.
3. Prod stack never deployed: no instance, `api.rae-dev.com` doesn't resolve,
   no prod content or media (incl. the 8 album covers).
4. Certificate: must cover apex **and** `*.rae-dev.com` (wildcard alone does
   not cover the apex). Reported as already the case — confirm in Phase 1.
5. `deploy-frontend.yml` is dev-only (hard-coded bucket, distribution, build
   script, smoke URL).
6. Cover-art URLs in `songs.ts` hard-coded to `api-dev.rae-dev.com`.
7. `production.contactApiUrl` is empty pending the prod stack output.
8. reCAPTCHA v3 key must list `rae-dev.com` in its allowed domains.

## Phase 0 — code & pipeline prep (branch `feature/production-deployment`)

- ✅ `PROD_DOMAIN` default → `rae-dev.com` (README / DEPLOYMENT.md updated).
- ✅ Stack prop `manageApexDns` (env `PROD_MANAGE_APEX_DNS`, default on): when
  off, the prod stack creates `api` / `media` records but **not** apex or
  `www`, so it can be deployed while Vercel still owns those names. Prod
  stack now covered by CDK assertion tests.
- ✅ Cover-art base URL derived from the environment's `wpApiBase` (local dev
  keeps pointing at dev's media library, which is where the files live).
- ✅ `deploy-frontend.yml` parameterized by environment: reusable workflow
  takes `environment` (`dev` | `prod`) and reads bucket / distribution /
  site URL / build target from that Environment's variables.
- ✅ `release-please.yml`: on tag → deploy to `dev`, then `prod` (the
  Environment's required-reviewer rule is the gate).
- ✅ New `preview.yml`: RC build + deploy to dev on qualifying PRs, with the
  version stamp and sticky PR comment described above.
- ✅ RC version stamping: `APP_VERSION_SUFFIX` build env → `__APP_VERSION__`
  = `<package version>-rc.<PR#>.<sha7>` (shows in the footer badge).
- ✅ `supply_chain_hardening.md` §2.7: preview workflow trigger rules and the
  Environment-scoped OIDC roles.

**⚠️ Ordering note:** `deploy-frontend.yml` now reads its targets from
Environment variables. Until the `dev` Environment has `S3_BUCKET`,
`CLOUDFRONT_DISTRIBUTION_ID`, `SITE_URL`, `BUILD_TARGET` set (Phase 1), the
next tag would fail to deploy to dev. Set them **before** merging this
branch.

## Phase 1 — stand up prod (needs `aws sso login --profile rae_dev`)

- ✅ ACM cert `da62c8c8-…` SANs: `rae-dev.com`, `*.rae-dev.com` (same cert as
  dev). `infrastructure/.env` created locally (gitignored). CDK bootstrap
  upgraded v25 → v32 so change-set validation errors are readable.
- ✅ `cdk deploy RaePortfolioProd` with `PROD_DOMAIN=rae-dev.com` and
  `PROD_MANAGE_APEX_DNS=false` — succeeded on the 6th attempt after the
  prod-only fixes listed under "Open items / risks".
- ✅ Stack outputs (2026-09-27):

  | Output | Value |
  |---|---|
  | `GithubDeployRoleArn` | `arn:aws:iam::233416806179:role/rae-portfolio-github-deploy-prod` |
  | `WebsiteBucketName` | `rae-portfolio-prod-233416806179` |
  | `FrontendDistributionId` | `E3T2EFYDWBXP0` |
  | `FrontendDistributionDomainName` | `d5d2mv203pdq9.cloudfront.net` |
  | `ContactApiUrl` | `https://9h15swpj41.execute-api.us-east-1.amazonaws.com/contact` |
  | `WordPressPublicIP` | `100.52.156.202` |
  | `WordPressInstanceName` | `rae-portfolio-wp-prod` |
  | `WordPressDistributionId` | `EGRZJN8Q3MIWO` |
  | `MediaBucketName` | `rae-portfolio-media-prod-233416806179` |
  | `MediaUploaderUserName` | `rae-portfolio-media-uploader-prod` |

- ✅ GitHub Environment `prod` (required reviewer set): secret
  `AWS_DEPLOY_ROLE_ARN` = `GithubDeployRoleArn` above; variables
  `S3_BUCKET=rae-portfolio-prod-233416806179`,
  `CLOUDFRONT_DISTRIBUTION_ID=E3T2EFYDWBXP0`, `SITE_URL=https://rae-dev.com`,
  `BUILD_TARGET=prod`. **Note for Phase 3:** `SITE_URL` drives the smoke
  test and still points at Vercel until cutover — set it temporarily to
  `https://d5d2mv203pdq9.cloudfront.net` for the first prod frontend deploy,
  then back to `https://rae-dev.com` at Phase 4.
- ✅ GitHub Environment `dev`: variables set.
- ✅ `production.contactApiUrl` ← `ContactApiUrl` output.

## Phase 2 — populate prod WordPress

- ⬜ First-run WordPress setup on the prod instance (admin user, permalinks
  as required by the API's `?rest_route=` convention, theme active).
- ⬜ Settings: reCAPTCHA keys (+ add `rae-dev.com` to the key's domains),
  social links, any options the dev site carries.
- ⬜ Content: extend `seed.sh` with a `prod` target (same SSH mechanism) and
  run it; verify resume / skills / software / media endpoints.
- ⬜ Media: copy `wp-content/uploads/2026/09/*.webp` dev → prod and register
  with `wp media import --skip-copy` so the URLs match dev's paths exactly
  (`songs.ts` relies on the same `/wp-content/uploads/2026/09/` path).
- ⬜ Health: `curl -I https://api.rae-dev.com/wp-admin/`, REST endpoints
  return JSON, CORS headers present for `https://rae-dev.com`.

## Phase 3 — verify prod without touching public DNS

- ⬜ Deploy the current release tag to prod via the parameterized workflow
  (manual dispatch → approval).
- ⬜ Test against the CloudFront domain (`FrontendDistributionDomainName`)
  and/or a hosts-file override for `rae-dev.com`: turntable end to end
  (covers, labels, playback), contact form + reCAPTCHA, resume / projects /
  media pages, theme switching, 404 routing.

## Phase 4 — cutover

- ⬜ Lower TTLs on the Vercel-pointing records a day ahead.
- ⬜ Delete the manual apex A and `www` CNAME records in Route 53.
- ⬜ Redeploy prod with `PROD_MANAGE_APEX_DNS=true` → Route 53 ALIAS records
  to CloudFront.
- ⬜ Verify from outside (fresh DNS, mobile network), watch CloudFront /
  Lambda logs for the first hour.
- ⬜ Keep the Vercel project alive but unlinked for ~1 week; then delete it.

## Phase 5 — steady state

- Release: merge feature PR → merge release PR (one CI approval click) → tag
  auto-deploys to dev → approve `prod` → same artifact ships.
- Hotfix: `workflow_dispatch` the deploy workflow with a tag/SHA and the
  target environment; prod still requires the approval.
- Dependabot: never touches dev or prod on its own. CI only.

## Open items / risks

- **Prod-only bugs found on first deploy (all fixed in code)**: duplicate
  CORS origin when `frontendFqdn` equals the apex; `github-deploy-prod` role
  name already taken by another project; lambdas zipped from source without
  compiled JS (now esbuild-bundled `NodejsFunction`s). Dev never hit these
  because its names differ and it was deployed from a machine that had the
  compiled lambda output lying around.
- **Deploy role naming**: the account also hosts `rae004/ai-security-digest`,
  which owns the bare `github-deploy-prod` role. This project's prod role is
  therefore `rae-portfolio-github-deploy-prod`. Dev still uses the legacy
  `github-deploy-dev`; renaming it to `rae-portfolio-github-deploy-dev` is a
  deliberate follow-up (deploy dev stack → update the `dev` Environment's
  `AWS_DEPLOY_ROLE_ARN` → verify a dev deploy) so it can't break releases.

- **DNS conflict at cutover** is the one step that can't be rehearsed; the
  `manageApexDns` flag keeps everything else deployable ahead of time.
- **Media path parity**: prod must serve covers at the same
  `/wp-content/uploads/2026/09/` path or `songs.ts` needs per-file URLs from
  the media API (the eventual state anyway).
- **Shared preview environment**: RC deploys are last-push-wins on dev. Fine
  for a solo repo; per-PR previews (`pr-<n>.dev.rae-dev.com`) are a later
  option if ever needed.
