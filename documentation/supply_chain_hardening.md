# Supply Chain Hardening Plan

## Context

On 2026-05-11 (19:20–19:26 UTC), an attacker exploited a `pull_request_target`
CI pattern in TanStack's release workflow and published 84 malicious versions
across 42 `@tanstack/*` packages to npm during a ~6-minute window. The payload
used `optionalDependencies` to trigger a postinstall script that fetched a
~2.3 MB second stage from `litter.catbox.moe` and exfiltrated credentials via
`getsession.org`.

This project was **not affected** — the forensic audit on 2026-05-14 confirmed
all lockfiles and `node_modules` mtimes predate the attack window by 24+ hours
and zero indicators of compromise are present on disk. The audit also surfaced
that we run pinned-caret versions of the targeted router family
(`@tanstack/react-router` and friends), so a fresh `pnpm install` without
`--frozen-lockfile` *could* have resolved onto a poisoned version had timing
been different.

This document specifies the hardening posture we are adopting to make the
project resilient against this class of attack going forward.

## Threat Model

The TanStack incident required three conditions to coincide:

1. A poisoned package version is published to npm.
2. Someone runs `install` during a narrow window before the version is
   unpublished or flagged.
3. The poisoned package's postinstall script executes, fetching a second-stage
   payload and exfiltrating credentials.

Each layer below denies one of those conditions independently. The design
intent is defense in depth — any single layer can fail without catastrophe.

| Threat | Defensive layer | Tools |
|---|---|---|
| Be the first to install a poisoned version | Time | pnpm `minimum-release-age=7d`, Renovate `minimumReleaseAge`, pinned `packageManager` |
| Silent drift onto a poisoned version that falls inside a caret range | Integrity | exact pins for router family, `--frozen-lockfile` everywhere, lockfile pre-commit guard |
| Payload executes at install time even if a bad package lands on disk | Containment | pnpm `allowBuilds` allowlist in `pnpm-workspace.yaml`, npm `ignore-scripts=true` for lambdas |
| Known-bad version slips in via PR | Detection | `actions/dependency-review-action`, `pnpm audit` gate, Dependabot alerts, secret scanning |
| Our own CI gets compromised the way TanStack's was | Workflow | pin Actions by SHA, minimum-permission `permissions:` blocks, audit `pull_request_target` use |
| Stale deps because cooldown blocks routine updates | Process | Renovate with matching cooldown + auto-merge for safe-listed patch bumps |

## Current State (2026-05-15)

- **pnpm**: 9.15.9 locally; CI workflows pin `version: 9` via `pnpm/action-setup`.
- **Lockfiles**: `frontend/pnpm-lock.yaml` (pre-attack mtime), `infrastructure/pnpm-lock.yaml`, plus three npm `package-lock.json` files in `infrastructure/lambda/*`.
- **`--frozen-lockfile`**: already enforced in all three CI workflows (`ci.yml`, `deploy-frontend.yml`, `release-please.yml`).
- **`.npmrc`**: none — neither project-level nor user-level.
- **Pre-commit hooks**: none.
- **GitHub Actions**: all third-party Actions referenced by `@v4` tag (mutable).
- **Permissions**: `ci.yml` has no explicit `permissions:` block (inherits broad repo defaults). `deploy-frontend.yml` and `release-please.yml` already set minimum permissions correctly.
- **Lambda deploys**: `lambda.Code.fromAsset('./lambda/<name>')` zips the directory contents as-is. Lambdas use npm with small dep trees (`@aws-sdk/*` clients plus `node-fetch`).
- **Router family pins**: `^1.132.41` in `frontend/package.json` (caret, allows drift).

## Implementation Phases

### Phase 1 — Local & lockfile hardening

**1.1 Upgrade pnpm to 11.x and pin via Corepack**

- Add `"packageManager": "pnpm@11.3.0+sha512.<integrity>"` to `frontend/package.json` and `infrastructure/package.json`. The `+sha512.<hash>` suffix triggers Corepack's cryptographic integrity check — Corepack will refuse to run a pnpm binary whose tarball hash does not match, eliminating both toolchain drift between contributors and CI and a class of attacks that swap the pnpm binary on the registry. The current pinned version is **11.3.0** with integrity `sha512.2c403d6594527287672b1f7056343a1f7c3634036a67ffabfcc2b3d7595d843768f8787148d1b57cf7956c90606bbd192857c363af19e96d2d0ec9ec5741d215` (hex-encoded SHA-512 of the npm tarball; Corepack expects hex, not the base64 SRI that the registry returns).
- Locally: `corepack enable && corepack prepare pnpm@11.3.0 --activate`.
- **Do not run `pnpm install` until Phase 1 is fully staged** — we want a single controlled re-install after the `.npmrc` and `pnpm-workspace.yaml allowBuilds` configs are in place.

**1.2 Create `.npmrc` files**

`frontend/.npmrc` and `infrastructure/.npmrc` (pnpm workspaces):

```ini
minimum-release-age=10080          # 7 days, in minutes
minimum-release-age-exclude=       # leave empty; populate only for emergency CVE bypass
frozen-lockfile=true               # belt-and-suspenders with CI flag
verify-deps-before-run=true        # pnpm refuses to run scripts if lockfile drifted from store
auto-install-peers=true
fund=false
```

Note: `strict-peer-dependencies=true` is *not* included in the initial rollout — it can fail installs on legitimate peer-dep mismatches and is unrelated to supply chain. Revisit as a separate hygiene pass if peer-dep drift becomes a problem.

`infrastructure/lambda/*/.npmrc` (npm syntax, no cooldown setting on npm):

```ini
ignore-scripts=true                # SDK clients + node-fetch have no legitimate postinstall need
fund=false
```

Cooldown for the lambda workspaces is enforced via Renovate (Phase 4) instead of `.npmrc`.

**1.3 Postinstall script allowlist (pnpm 11)**

pnpm 11's default is to refuse install scripts unless explicitly allowed.
After the first install on pnpm 11, pnpm prints which packages requested
scripts. Capture that list and add to a `pnpm-workspace.yaml` at each
pnpm-managed project root.

Important: in pnpm 11, the `pnpm` key in `package.json` is **no longer
read**. Settings moved to `pnpm-workspace.yaml`, which is also the
per-project config file in pnpm 11 even for non-workspace projects. The
correct syntax is `allowBuilds:` (boolean per package), not the older
`onlyBuiltDependencies` list:

```yaml
# pnpm-workspace.yaml at project root
allowBuilds:
  esbuild: true
```

**Actual list captured during Phase 1 rollout:**

- `frontend/`: only `esbuild` requested scripts (used by Vite and `tsx`).
- `infrastructure/`: no packages requested scripts — CDK + AWS SDK deps are
  pure JS. No `pnpm-workspace.yaml` needed for `infrastructure/`.

Do not add packages to `allowBuilds` that pnpm did not explicitly surface.
When a future dep is added that requests scripts, pnpm 11 will print
`ERR_PNPM_IGNORED_BUILDS: Ignored build scripts: <pkg>@<ver>`. Decide
per the rubric in the Operational Notes section before allowing it.

**1.4 Exact-pin the router family in `frontend/package.json`**

The router family was the actual attack target. Until the GHSA's patched-version
list is fully confirmed and the dust settles, replace caret with exact:

| Package | Before | After |
|---|---|---|
| `@tanstack/react-router` | `^1.132.41` | `1.132.41` |
| `@tanstack/router-cli` | `^1.132.41` | `1.132.41` |
| `@tanstack/router-devtools` | `^1.132.41` | `1.132.41` |

Other tanstack deps (`react-query`, `react-form`) are in confirmed-clean
families per the postmortem and keep caret.

**Trade-off**: Full exact-pinning across all deps adds maintenance toil
without much marginal safety once cooldown + frozen-lockfile are in place.
Reserve exact pins for: (a) packages with prior incidents (router family),
(b) GitHub Actions (Phase 2.2).

**1.5 Pre-commit guard**

Add `.githooks/pre-commit` to refuse commits that change a lockfile without
also touching its corresponding `package.json`. Catches lockfile-only
tampering (a common supply chain technique where an attacker mutates only
the lockfile in a PR to swap resolved versions).

```bash
#!/usr/bin/env bash
set -euo pipefail
declare -A pairs=(
  [frontend/pnpm-lock.yaml]=frontend/package.json
  [infrastructure/pnpm-lock.yaml]=infrastructure/package.json
)
for lambda in infrastructure/lambda/*/; do
  pairs["${lambda}package-lock.json"]="${lambda}package.json"
done
staged=$(git diff --cached --name-only)
for lock in "${!pairs[@]}"; do
  pkg="${pairs[$lock]}"
  if grep -qxF "$lock" <<<"$staged" && ! grep -qxF "$pkg" <<<"$staged"; then
    echo "Refusing: $lock changed but $pkg did not." >&2
    exit 1
  fi
done
```

Wire via `git config core.hooksPath .githooks` (committed to repo so
contributors pick it up on clone).

### Phase 2 — CI workflow hardening

**2.1 Bump pnpm in all workflows**

In `ci.yml` and `deploy-frontend.yml`, change `pnpm/action-setup@v4`
`version: 9` to read from `packageManager` (remove the `with: version:` block;
the Action reads `package.json` automatically when no version is specified).
Single source of truth.

**2.2 Pin third-party Actions by SHA**

Replace every `@v4` reference with the full commit SHA plus a `# v4.x.y`
comment for readability. Tag references are mutable; a compromise of an
upstream Action repo can flip a tag silently. Renovate (Phase 4) keeps these
up to date. This is precisely the class of defense TanStack's own
postmortem recommends — the incident started with a malicious Action.

Actions to pin: `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`,
`aws-actions/configure-aws-credentials`, `codecov/codecov-action`,
`googleapis/release-please-action`, `shivammathur/setup-php`,
`actions/dependency-review-action` (added below).

**2.3 Minimum permissions**

Add explicit top-level `permissions:` to `ci.yml`:

```yaml
permissions:
  contents: read
```

`deploy-frontend.yml` and `release-please.yml` already do this correctly.

**2.4 Add `actions/dependency-review-action` on PRs**

New job in `ci.yml`, only runs on `pull_request`:

```yaml
dependency-review:
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@<sha>
    - uses: actions/dependency-review-action@<sha>
      with:
        fail-on-severity: high
        comment-summary-in-pr: on-failure
```

Fails the PR if it introduces a known-vulnerable dep. Free for public repos;
requires GHAS for private. If GHAS is not available, fall back to
`pnpm audit --audit-level=high` step in the existing lint job (covered in 2.5
anyway).

**2.5 Audit step in CI**

Add to both `frontend-lint` and `cdk-synth` jobs after install:

```yaml
- name: Audit dependencies
  working-directory: ./frontend   # or ./infrastructure
  run: pnpm audit --prod --audit-level=high
```

`--prod` excludes devDeps from the gate — devDep vulns are lower-risk and
create noise. Tunable.

**2.6 `pull_request_target` policy**

None of our current workflows use `pull_request_target`. Document in CLAUDE.md
that this trigger requires explicit security review before being introduced,
since it grants write tokens to workflows running unreviewed PR code — the
exact vector that compromised TanStack.

### Phase 3 — Lambda packaging follow-up

`infrastructure/lib/rae-portfolio-stack.ts` uses
`lambda.Code.fromAsset('./lambda/<name>')`, which zips the directory as-is.
This means whatever `node_modules` is on local disk gets baked into the
Lambda. Currently the CI `cdk-synth` job runs `pnpm install` only in
`infrastructure/`, not in each lambda subdirectory.

**Follow-up recommendation** (not strictly part of this hardening pass):
migrate the three lambdas to `aws-cdk-lib/aws-lambda-nodejs` `NodejsFunction`,
which bundles via esbuild from source. The lambda's `package.json` deps
become bundling input only — no npm install happens at deploy time,
eliminating the lambda npm install attack surface entirely.

Flagged here so it is not forgotten; tracked separately.

### Phase 4 — Automated update tooling (Renovate)

Cooldown without an update tool means dep rot. Renovate solves both with one
config. The committed config lives at `.github/renovate.json`.

Effective behavior:

- **All deps wait 7 days before Renovate proposes an upgrade** (matches the
  pnpm `.npmrc` cooldown, so PRs are never blocked at install time).
- **Router family** (`@tanstack/react-router`, `@tanstack/router-*`):
  exact-pinned via `rangeStrategy: pin`, 14-day cooldown. Locked down until
  GHSA-g7cv-rxg3-hmpx's patched-version list is fully stable.
- **GitHub Actions**: SHA-pinned digests (`pinDigests: true`), 14-day
  cooldown. Renovate keeps the SHA and the version comment in sync on bump.
- **Patch bumps of `devDependencies`**: auto-merge after CI passes
  (`platformAutomerge: true`). Reduces toil; runtime deps still need manual
  review. Trade-off discussion in the plan doc's Operational Notes.
- **Lambda npm workspaces**: grouped into a single "lambda dependencies" PR
  per cycle so we get one PR per cooldown window instead of three.
- **CVE patches bypass cooldown** (`vulnerabilityAlerts.minimumReleaseAge: 0`).
  This is the only acceptable bypass: it matches a real disclosed advisory,
  not a freshly-published version.
- **Weekly lockfile maintenance** (Mondays before 06:00): refreshes
  transitive deps without raising any range. Manual review required —
  no auto-merge here because lockfile-only changes are high-leverage.
- **PR rate limits**: max 5 concurrent open Renovate PRs, max 2 new PRs per
  hour. Keeps the review queue from drowning the developer.

**Enabling Renovate on the repo (one-time, requires repo admin):**

1. Install the Renovate GitHub App from
   <https://github.com/apps/renovate> on this repository.
2. Renovate detects `.github/renovate.json` and opens an onboarding PR with
   a preview of what it will do. Review and merge.
3. Future runs follow the schedule embedded in the config.

If you would rather not use the hosted App, the same config works against
self-hosted Renovate via the `renovatebot/github-action` GitHub Action.

### Phase 5 — Repo settings (one-time GitHub UI changes)

Not Claude-changeable; requires repo admin:

- Code security → enable Dependabot alerts + Dependabot security updates.
- Code security → enable Secret scanning + Push protection.
- Branches → require status checks (`ci`, `dependency-review`) before merge
  to `main`.
- Actions → restrict to "Allow `actions/*` and selected third parties" with
  an explicit allowlist.
- Actions → set default `GITHUB_TOKEN` permissions to "Read repository
  contents" (forces workflows to opt in to writes).

### Phase 6 — Documentation

- Update `CLAUDE.md` "Critical Technical Decisions" section with one line
  per posture choice and a reference back to this document.
- Keep this document current as the allowlist grows or pins are relaxed.

## Order of Operations

1. Phase 1.1–1.4 staged together (configs only, no install). Commit.
2. Single controlled `pnpm install` in `frontend/` then `infrastructure/` on
   pnpm 11. Capture the script-allowlist prompt. Update
   `allowBuilds` in `pnpm-workspace.yaml`. Verify `pnpm build` and `pnpm test` still
   work. Commit.
3. Phase 1.5 pre-commit hook. Commit.
4. Phase 2 CI changes on a branch. Open PR; observe CI runs green. Merge.
5. Phase 4 Renovate config. Doesn't affect anything until Renovate runs
   against the repo, which requires the GitHub App to be installed.
6. Phase 5 repo settings — manual.
7. Phase 6 docs.

## Operational Notes

### Growing the `allowBuilds` allowlist

When a new dep that needs install scripts is added, pnpm 11 will print:

```
The following packages have install scripts that were ignored:
  some-native-package@1.2.3
```

Decision rubric:

1. Does this package legitimately need to compile a native binding (e.g.
   esbuild prebuilt fetch)? Add to allowlist.
2. Is it a dev tool (analytics, telemetry, "thanks for installing" prints)?
   Leave blocked.
3. Unknown? Inspect the postinstall script in the package's repo. If it does
   anything other than build/fetch the package's own artifacts, do not allow.

### Emergency CVE bypass

If a real CVE drops and the 7-day cooldown blocks the patch:

1. Confirm the advisory in the GitHub Advisory Database or vendor postmortem.
2. Add the specific package to
   `minimum-release-age-exclude` in the affected `.npmrc`, e.g.
   `minimum-release-age-exclude=express,body-parser`.
3. Run `pnpm install` and verify the lockfile change matches expectation.
4. Remove the exclusion after the patched version is older than 7 days.

Renovate handles this automatically via
`vulnerabilityAlerts.minimumReleaseAge: 0` — the manual `.npmrc` exclusion
is only for cases where you want to install ahead of a Renovate PR landing.

### Relaxing exact pins on the router family

Once the GHSA-g7cv-rxg3-hmpx patched-version list is fully published and
stable (no further amendments for ~30 days), and Renovate has been running
against the repo for at least one update cycle, the router family pins can
be relaxed back to caret. Update both `frontend/package.json` and the
Renovate `packageRules` entry that pins this family.

## Out of Scope (for this pass)

- **Full exact-pinning of all deps**: maintenance cost outweighs marginal
  safety once cooldown + frozen-lockfile are in place.
- **Global `ignore-scripts=true` for pnpm**: too blunt — breaks esbuild and
  Vite. `pnpm-workspace.yaml`'s `allowBuilds` map is the right pnpm 11 tool.
- **Paid SCA tools (socket.dev, Snyk)**: free GitHub tooling plus Renovate
  gets us to a strong posture without a vendor relationship. Revisit if the
  project starts handling customer data.
- **`NodejsFunction` migration for lambdas**: high-value follow-up; tracked
  separately.

## References

- TanStack postmortem: https://tanstack.com/blog/npm-supply-chain-compromise-postmortem
- Incident follow-up: https://tanstack.com/blog/incident-followup
- GHSA-g7cv-rxg3-hmpx: https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx
- Forensic audit: in-conversation, 2026-05-14 (no IOCs, all installs pre-attack)
