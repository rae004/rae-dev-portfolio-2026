# Follow-ups

Running list of known work that is deliberately deferred. Keep each item
short, say *why* it matters, and link the place it was noticed. Tick items
off rather than deleting them so the history stays readable.

## Deployment / infrastructure

- ⬜ **Automate WordPress theme deploys.** The `rae-portfolio` theme is only
  shipped by hand (`documentation/AWS_DEPLOYMENT_GUIDE.md` → "WordPress Theme
  Deploys"); CI runs PHPCS on it but never deploys it, so dev/prod can drift
  from `main`. Ideal state: a theme-deploy job in the same dev → prod
  environment flow as the frontend (SSM Run Command or SSH with a deploy-key
  secret; the Lightsail images have no `rsync`, so tar-over-SSH or SSM). Until
  then, after a theme change: tar over SSH, swap the directory, flush the WP
  cache **and restart php-fpm** (opcache held the old code on dev
  2026-10-03).
- ⬜ **Dev migration to the Lightsail WordPress blueprint before
  2026-11-19** (Bitnami image deprecation): snapshot dev; drop the
  `wordpressBlueprintId: 'wordpress'` pin in `infrastructure/bin/infrastructure.ts`;
  deploy; re-run first-run setup, `seed.sh dev`, media re-upload,
  plugin/options config; `wordpress/scripts/configure-instance.sh dev`;
  update `seed.sh` dev defaults and `TROUBLESHOOTING_QUICK_REFERENCE.md`.
- ⬜ Delete the old Vercel project (~1 week after the 2026-09 DNS cutover,
  once nothing points at it).
- ⬜ Rename the dev deploy role `github-deploy-dev` →
  `rae-portfolio-github-deploy-dev` (deploy dev stack → update the `dev`
  Environment's `AWS_DEPLOY_ROLE_ARN` → verify a dev deploy).
- ⬜ Prod WordPress still has the image's default `user` admin account —
  create the real admin, then drop/rotate `user`.
- ⬜ `sendmail` is missing on prod, so WordPress mail (password resets,
  contact-form notifications) silently fails. Pick SES or a mail plugin.
- ✅ (2026-10-03) WP Offload Media configured and backfilled on dev and
  prod. Root cause of the silent failure: the uploader IAM user couldn't
  read the bucket's ACL/public-access state, so the plugin sent ACLs the
  bucket rejects. Fixed in CDK (policy) and pinned `use-bucket-acls: false`
  on both. Procedure: `AWS_DEPLOYMENT_GUIDE.md` → "Media offload".
- ⬜ Dev's uploader user has **two** active access keys (2026-08-23); only
  one is in use. Identify the live one (`aws iam get-access-key-last-used`)
  and delete the other.
- ⬜ Move dev's Offload Media settings from the `tantan_wordpress_s3` option
  into an `AS3CF_SETTINGS` wp-config constant to match prod (natural moment:
  the dev blueprint migration).
- ⬜ Confirm `rae-dev.com` is listed on the reCAPTCHA key's allowed domains.

## Dependencies

- ⬜ Decide on Dependabot #132 (React 19.3 — merge solo and watch dev) and
  #122 (jest blocked by `@parcel/watcher` build script — add to
  `allowBuilds` or close).

## Features / content

- ⬜ **Media item gallery.** `MediaDetailPage.tsx` still renders hardcoded
  `picsum.photos` sample images. Plan: a "Gallery" meta box that picks
  ordered images from the media library (attachment IDs), API returns
  `{id,url,alt,caption}[]`, page drops the placeholders.
- ⬜ Album name on the turntable record label (fast-follow).
- ⬜ `songs.ts` album covers are hardcoded to
  `<api host>/wp-content/uploads/2026/09/<file>.webp` and so are served by
  the WordPress instance, not the media CDN. Deliberately left as-is
  (2026-10-03) until the turntable reads its songs from the media library.
  **Depends on Offload Media's `remove-local-file: false`** — flipping that
  deletes the local copies and 404s the covers. The CDN keys aren't
  predictable (object versioning adds a timestamp folder), so the fix is to
  resolve `source_url` from `/wp/v2/media` at runtime, not a host swap.
