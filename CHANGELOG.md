# Changelog

## [0.1.4](https://github.com/rae004/rae-dev-portfolio-2026/compare/v0.1.3...v0.1.4) (2026-05-08)


### Bug Fixes

* **deploy:** tighten smoke test grep to verify actual portfolio title ([7f3b4d9](https://github.com/rae004/rae-dev-portfolio-2026/commit/7f3b4d97638e42d6ff71a6cb084dadee95af40f2))
* **deploy:** tighten smoke test grep to verify actual portfolio title ([2ea1b26](https://github.com/rae004/rae-dev-portfolio-2026/commit/2ea1b26f42f050e1fcbda6b68ff96a5ec5b7497f))

## [0.1.3](https://github.com/rae004/rae-dev-portfolio-2026/compare/v0.1.2...v0.1.3) (2026-05-07)


### Code Refactoring

* drop BucketDeployment, factor deploy into reusable workflow ([cf3efa7](https://github.com/rae004/rae-dev-portfolio-2026/commit/cf3efa7fa499918a269642f7615ba9af4d021a24))
* drop BucketDeployment, factor frontend deploy into reusable workflow ([56511cf](https://github.com/rae004/rae-dev-portfolio-2026/commit/56511cf2239cd2b79590f972221fa81f5835ac13))

## [0.1.2](https://github.com/rae004/rae-dev-portfolio-2026/compare/v0.1.1...v0.1.2) (2026-05-06)


### Bug Fixes

* **ci,release:** run CI on push to main + bump minor on feat pre-1.0 ([5dc88d8](https://github.com/rae004/rae-dev-portfolio-2026/commit/5dc88d870713ee3a67702ca9e90ea15365149104))
* **ci,release:** unblock codecov main-branch coverage and bump-minor-on-feat ([8ef69e5](https://github.com/rae004/rae-dev-portfolio-2026/commit/8ef69e58ab9d29959ab42e496dc84747f9f59de2))

## [0.1.1](https://github.com/rae004/rae-dev-portfolio-2026/compare/v0.1.0...v0.1.1) (2026-05-06)


### Features

* add frontend test suite and Codecov integration ([6d599a8](https://github.com/rae004/rae-dev-portfolio-2026/commit/6d599a80ebaef89159587c877ac91c6a98ba42ac))
* auto-deploy SPA to dev on release-please tag via OIDC ([a64bee5](https://github.com/rae004/rae-dev-portfolio-2026/commit/a64bee55a90320716fe180f6d55fb7b25bd57b3c))
* bootstrap CI and release-please workflow ([3ae9ded](https://github.com/rae004/rae-dev-portfolio-2026/commit/3ae9ded784dde514307c4775449ce153afdf3570))
* bootstrap CI/CD pipeline with auto-deploy to dev ([8e00277](https://github.com/rae004/rae-dev-portfolio-2026/commit/8e00277ea4677d26330bb83af92b1aa9fc23f0e7))
* **home:** show build version + env chip in home page footer ([6c52c88](https://github.com/rae004/rae-dev-portfolio-2026/commit/6c52c8803a3f63792daf7d1fcfaeabec9408db01))


### Bug Fixes

* **ci:** create frontend/dist placeholder before CDK synth/tests ([be991f9](https://github.com/rae004/rae-dev-portfolio-2026/commit/be991f9cde0d16c458c736533e75a48df58e5bc6))
* **infra:** correct .env.example DEV_DOMAIN to apex and blank prod placeholders ([3303575](https://github.com/rae004/rae-dev-portfolio-2026/commit/3303575ee3b810533d246f31eead84ba41946d67))
