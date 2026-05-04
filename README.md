# Rae Dev Portfolio 2026

[![CI](https://github.com/rae004/rae-dev-portfolio-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/rae004/rae-dev-portfolio-2026/actions/workflows/ci.yml)
[![Release](https://github.com/rae004/rae-dev-portfolio-2026/actions/workflows/release-please.yml/badge.svg)](https://github.com/rae004/rae-dev-portfolio-2026/actions/workflows/release-please.yml)
[![Version](https://img.shields.io/github/package-json/v/rae004/rae-dev-portfolio-2026?filename=frontend%2Fpackage.json&color=blue&label=version)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![WordPress](https://img.shields.io/badge/WordPress-6.8-21759B?logo=wordpress&logoColor=white)](https://wordpress.org/)
[![Node.js](https://img.shields.io/badge/Node-22-brightgreen?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![AWS CDK](https://img.shields.io/badge/AWS%20CDK-2-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/cdk/)

Portfolio site for Robert Engel: a headless WordPress backend feeding a React + TypeScript SPA, deployed to AWS via CDK.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite 7 + TanStack Router/Query/Form + Tailwind 3 + DaisyUI 4.12.10
- **Backend**: WordPress 6.8.x with a custom modular theme (`rae-portfolio`, v1.7.1) — REST API only
- **Infrastructure**: AWS CDK v2 — S3 + CloudFront for the SPA, LightSail + CloudFront for WordPress, ACM wildcard cert, Route 53 aliases, Lambda automation for static-IP attachment and WordPress URL configuration
- **Local dev**: Docker Compose (WordPress + MySQL 8 + phpMyAdmin)

```
dev.rae-dev.com      → CloudFront (EY6SKG56NXSIP) → S3 (rae-portfolio-dev-...)
api-dev.rae-dev.com  → CloudFront (E30OWCNPNLLE11) → LightSail (44.216.72.226)
```

## Repository layout

```
frontend/        # React SPA (Vite, TanStack stack, DaisyUI)
wordpress/       # WordPress install; custom theme under wp-content/themes/rae-portfolio
infrastructure/  # AWS CDK app (RaePortfolioDev / RaePortfolioProd stacks)
scripts/         # WordPress HTTPS configuration helpers (manual recovery)
documentation/   # Implementation plans and operational guides
docker-compose.yml + Dockerfile.wordpress
```

The custom WP theme is split into modular `class-rae-*` files under `wordpress/wp-content/themes/rae-portfolio/includes/` (post types, REST API controllers, admin meta boxes, options pages, theme setup, CORS, utilities). PHPCS is wired up via Composer with a project ruleset.

## Prerequisites

- Node.js 22+ (Vite 7 / TanStack stack); 18.16+ works but is not recommended
- PNPM 8.6+ for the frontend; the infrastructure app also uses PNPM
- Docker + Docker Compose for the local WordPress stack
- AWS CLI configured (the `infrastructure/package.json` `cdk` script targets `--profile rae_dev`)

## Quick start

```bash
docker-compose up -d                     # WordPress + MySQL + phpMyAdmin
cd frontend && pnpm install && pnpm dev  # SPA on :5173
```

Local access points:

- React app: http://localhost:5173
- WordPress admin: http://localhost:8080/wp-admin (admin / admin123456)
- phpMyAdmin: http://localhost:8081
- WordPress REST root: http://localhost:8080/?rest_route=/wp/v2/

WordPress runs without pretty permalinks in Docker, so REST endpoints use `?rest_route=` rather than `/wp-json/...`.

## Frontend scripts

```bash
pnpm dev          # Vite dev server (mode: development)
pnpm build:local  # build with VITE_ENV unset (local API)
pnpm build:dev    # build pointing at api-dev.rae-dev.com
pnpm build:prod   # build pointing at api.rae-dev.com
pnpm lint         # ESLint
pnpm format       # Prettier write
pnpm routes:generate  # regenerate TanStack Router tree
```

Environment selection is build-time only — values are injected via Vite `define` from `frontend/src/config/environment.ts`. There are no runtime `.env` files in `frontend/`.

## WordPress REST endpoints

Custom post types and admin-options endpoints exposed by the theme:

- `/wp/v2/resume` — resume items (with employment dates + skill relations)
- `/wp/v2/skills` — skill taxonomy items with category grouping
- `/wp/v2/software-projects` — software project posts (with skill relations)
- `/wp/v2/media-projects` — media/music projects (with skill relations + streaming links)
- `/wp/v2/social-links` — admin-configured social profiles
- `/wp/v2/recaptcha/status` and `/wp/v2/recaptcha/verify` — reCAPTCHA v3 config + verification

Two WordPress admin Settings pages back this: **Settings → Social Links** and **Settings → Google reCAPTCHA v3 options**.

## reCAPTCHA v3

Site-wide protection is implemented as a single `ReCaptchaGate` component wrapping the router (`frontend/src/components/ReCaptchaGate.tsx`), backed by `frontend/src/utils/recaptcha.ts` and `frontend/src/hooks/useReCaptchaForm.ts`. One `page_view` verification runs per session, cached in component state for 5 minutes; scores below the WordPress-configured threshold redirect to `BlockedPage`. Theme switching is handled via a `MutationObserver` that re-renders the badge against Google's light or dark theme based on the active DaisyUI theme.

## Infrastructure

```bash
cd infrastructure
pnpm install
pnpm cdk:diff RaePortfolioDev
pnpm cdk:deploy RaePortfolioDev
```

`infrastructure/.env` (see `.env.example`) supplies `DEV_CERTIFICATE_ARN`, `DEV_DOMAIN`, `CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`. The CDK app defines both `RaePortfolioDev` and `RaePortfolioProd`; only the dev stack is currently deployed.

After a deploy, build and sync the SPA:

```bash
cd frontend && pnpm build:dev
aws s3 sync dist/ s3://rae-portfolio-dev-233416806179 --delete
aws cloudfront create-invalidation --distribution-id EY6SKG56NXSIP --paths '/*'
```

For full deploy procedure (including the manual WordPress URL/HTTPS steps and recovery via `claude-working-wp-config.php`), see `documentation/AWS_DEPLOYMENT_GUIDE.md` and `documentation/TROUBLESHOOTING_QUICK_REFERENCE.md`.

## Constraints worth knowing

- **Do not upgrade DaisyUI past v4.12.10** — v5 breaks the theme system this project relies on.
- **No ACF.** Earlier ACF use caused REST 500s; the theme uses native `register_post_type` / `register_meta` only.
- **Block Editor is disabled** for custom post types (Classic Editor) to avoid REST 404s.
- **CORS** is enforced in two layers: WordPress (`class-rae-cors-handler.php`) and a CloudFront response-headers policy.
- **CloudFront → LightSail** uses nip.io to give the static IP a hostname for the origin config.

## Documentation

Operational:
- `documentation/AWS_DEPLOYMENT_GUIDE.md`
- `documentation/TROUBLESHOOTING_QUICK_REFERENCE.md`
- `infrastructure/DEPLOYMENT.md`
- `scripts/README.md`

Implementation plans (historical, features have shipped):
- `documentation/google_recaptcha_v3_plan.md`
- `documentation/verify_captcha_all_pages_and_cache_plan.md`
- `documentation/social_links_config_plan.md`
- `documentation/software_projects_build_plan.md`
- `documentation/media_page_build_plan.md`
- `documentation/media_page_skills_relationship_build_plan.md`
- `documentation/resume_item_page_implementation_plan.md`
- `documentation/skills_item_implementation_plan.md`
- `documentation/code_cleanup_and_optimization_plan.md`

## License

Private portfolio project — all rights reserved.
