# frontend

React 19 + TypeScript + Vite 7 SPA. TanStack Router/Query/Form, Tailwind 3, DaisyUI 4.12.10. The site root is gated by `ReCaptchaGate`, which performs a single page-view verification against the WordPress reCAPTCHA endpoint and caches it for 5 minutes; sub-threshold scores route to `BlockedPage`.

The repo-level `README.md` covers architecture, deployment, and constraints. This file documents the frontend package only.

## Scripts

```bash
pnpm dev          # Vite dev server on :5173 (mode: development)
pnpm build        # tsc -b && vite build
pnpm build:local  # build with VITE_ENV unset (local API)
pnpm build:dev    # VITE_ENV=development → api-dev.rae-dev.com
pnpm build:prod   # VITE_ENV=production  → api.rae-dev.com
pnpm preview      # vite preview
pnpm lint         # eslint .
pnpm lint:fix     # eslint . --fix
pnpm format       # prettier --write .
pnpm format:check # prettier --check .
pnpm routes:generate  # tsr generate (regenerate routeTree.gen.ts)
pnpm routes:watch     # tsr watch
```

## Source layout

```
src/
  App.tsx, main.tsx          # Query client + ReCaptchaGate + Router bootstrap
  config/environment.ts      # build-time env constants (no .env files)
  routes/                    # TanStack Router file routes; routeTree.gen.ts is generated
  pages/                     # Page components for each route
  components/
    ReCaptchaGate.tsx        # Site-wide reCAPTCHA gate (page_view verification + theme observer)
    SocialLinks.tsx          # Connect-with-me block, conditional on configured links
    icons/                   # Reusable SVG icon components
    ui/                      # LoadingSpinner and other shared UI primitives
    ...                      # Navigation, ThemeSwitcher, Skill/Resume/Media/Software cards
  hooks/
    useWordPress.ts          # TanStack Query hooks for all WordPress data
    useReCaptchaForm.ts      # Form-submission reCAPTCHA token helper
  services/wordpress.ts      # WordPress API service layer
  utils/
    recaptcha.ts             # Script loader, theme detection, badge cleanup, executeReCaptcha
    mediaProjectUtils.ts, softwareProjectUtils.ts, skillMatching.ts, themeDebug.ts
  styles/
    index.css, recaptcha.css # Tailwind entry + reCAPTCHA badge theme overrides
  types/wordpress.ts         # WordPress API TypeScript types
```

## Environment configuration

There is no `.env` file. `VITE_ENV` is read at build time and resolved in `src/config/environment.ts` to one of `local` / `development` / `production`, which selects the WordPress API base URL, reCAPTCHA enable flag, and threshold default. Per-mode builds use the `build:local` / `build:dev` / `build:prod` scripts above.

## Constraints

- DaisyUI must stay on **v4.12.10** — v5 is not API-compatible with the theme system this app uses.
- Tailwind stays on **v3.x** for the same reason.
- Run `pnpm routes:generate` after adding or moving a file in `src/routes/`. CI does not regenerate.
