# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Add entries under the section headings below as you land PRs.
Sections: Added, Changed, Deprecated, Removed, Fixed, Security -->

### Added

### Changed

- Bumped `vite` 7 → 8 and `@vitejs/plugin-react` 4 → 6 (paired major upgrade — plugin-react 6 requires vite 8). Vite 8 ships with Rolldown as the default bundler; chunk output shifted (`router-vendor`, `http-vendor`, and the empty `sentry-*` chunks are now consolidated into `core` and `components`). All chunks remain within the budgets enforced by `scripts/check-bundle-size.mjs`. The `manualChunks` function in `vite.config.ts` may be worth re-tuning for Rolldown's id format in a follow-up.
- Bumped `typescript` 5 → 6. Removed deprecated `baseUrl: "."` from `tsconfig.app.json` and made `paths` values explicitly relative (`"./src/*"`) — TS 6 requires this when `baseUrl` is unset. `typescript-eslint@8` already supports TS 6, no change needed there.
- Bumped `@eslint/js` 9 → 10, `react-router-dom` 7.15 → 7.16, `eslint-plugin-prettier` 5.5.5 → 5.5.6.

### Deprecated

### Removed

### Fixed

- `src/store/store.ts` now uses an inline Promise-wrapped `localStorage` adapter instead of importing `redux-persist/lib/storage`. Vite 8 / Rolldown's CJS-interop produced a runtime `storage.getItem is not a function` from `getStoredState` regardless of which import form we tried; sidestepping the dependency removes the moving piece entirely. Same SSR-safe noop fallback as the upstream module.

### Changed (follow-up to Vite 8 upgrade)

- Removed the hand-rolled `manualChunks` function in `vite.config.ts`. Under Vite 8 / Rolldown the rules were silently merged into one 468 KB `react-core` chunk because Rolldown treats `manualChunks` return values as hints, not guarantees. Letting Rolldown auto-split produces a healthier layout: route-based dynamic chunks (`login.screen`, `dashboard.screen`, `not-found.screen`), the Sentry dynamic import on its own chunk (`esm-*.js`, ~457 KB, out of the critical path), `web-vitals` on its own chunk, and the main entry (~400 KB).
- Reset per-chunk budgets in `scripts/check-bundle-size.mjs` to match the new natural layout (`index`, `esm`, `web-vitals`, default). Old vendor-name budgets (`react-core`, `react-dom`, `router-vendor`, etc.) removed — those chunks no longer exist.

### Security

## [0.1.2] - 2026-05-29

### Fixed

- Bumped `eslint-plugin-security` 3.0.1 → 4.0.0. v3 used the removed `context.getSourceCode()` API and broke under ESLint 10.

## [0.1.1] - 2026-05-29

### Changed

- `CONTRIBUTING.md` clarified that Conventional Commits are enforced at commit time via `commitlint`.

## [0.1.0] - 2026-05-28

First tagged release of the hardened boilerplate.

### Added

- Pre-push hook (`.husky/pre-push`) runs `npm test -- --run` before every push.
- Conventional Commits enforcement via `@commitlint/cli` + `@commitlint/config-conventional`, configured in `commitlint.config.js`, wired through `.husky/commit-msg`.
- SAST/security linting via `eslint-plugin-security` (recommended preset; noisy `detect-object-injection` disabled).
- `npm run audit` / `npm run audit:ci` scripts for dependency vulnerability scanning.
- Web Vitals capture (`web-vitals` library) via `src/core/perf/reportWebVitals.ts` — console in dev, Sentry breadcrumbs in production.
- Bundle analysis: `rollup-plugin-visualizer` wired conditionally on `vite build --mode analyze` (`npm run build:analyze`).
- Per-chunk bundle-size budgets enforced by `scripts/check-bundle-size.mjs` (`npm run size:check`).
- Persisted-state encryption: `redux-persist-transform-encrypt` for the auth slice, keyed by `VITE_PERSIST_ENCRYPT_KEY`. Fail-closed if the key is unset.
- Application logger at `src/core/log/logger.ts` with `debug/info/warn/error` levels — console in dev, Sentry breadcrumbs in production, `error` calls also `captureException`.
- Typed feature-flags helper at `src/core/featureFlags/flags.ts` exposing build-time `VITE_ENABLE_*` flags as a single `flags` object.
- Dependabot config (`.github/dependabot.yml`) — weekly npm + GitHub Actions updates with sensible groupings.
- Security CI workflow (`.github/workflows/security.yml`) — `npm audit:ci` + TruffleHog secret scan on PRs, pushes to `main`, and weekly cron.
- Release workflow (`.github/workflows/release.yml`) — on `v*.*.*` tag: build, package `dist/` as a tarball, create a GitHub Release with the matching `CHANGELOG.md` section.
- Production deploy workflow (`.github/workflows/production-deploy.yml`) — push to `production` branch builds with prod env vars, enforces bundle budgets, then runs a `deploy` job with commented-out blocks for S3+CloudFront, Netlify, Vercel, and GitHub Pages.
- `release:patch` / `release:minor` / `release:major` npm scripts with `preversion` (lint + tests + build) gate and `postversion` push.
- `CONTRIBUTING.md` documenting branching strategy, branch naming, commit messages, daily workflow, PR flow, deployments, and the Semantic-Versioning-based release flow.
- `DEPLOYMENT.md` documenting environments, required secrets per host, wiring steps, promotion flow, verification, and rollback.
- `docs/OBSERVABILITY.md` documenting the tooling map, required Sentry alert rules, dashboards, and day-to-day team expectations.
- `.github/pull_request_template.md` with summary / type / test plan / risk / checklist.
- `.github/CODEOWNERS` with per-path required reviewers (placeholder team handles).
- Vitest coverage thresholds (`vitest.config.ts`): statements 80 / lines 80 / functions 60 / branches 50. `@` alias resolved for tests.
- Initial test examples covering a component (`ErrorDisplay`), a slice reducer (`auth.slice`), and a util (`featureFlags`).

### Changed

- Bumped major versions: `@sentry/react` 9 → 10, `vitest` / `@vitest/*` 3 → 4, `jsdom` 26 → 29, `eslint-plugin-react-hooks` 5 → 7, `eslint-plugin-react-refresh` 0.4 → 0.5, `globals` 16 → 17, `@types/node` 24 → 25.
- Modernized husky hooks to v9 format (dropped deprecated shebang + `husky.sh` source).
- `src/store/store.ts` refactored to use `PersistConfig<RootReducerState>` so the conditional encryption path doesn't break `persistReducer` inference.
- `package.json` version `0.0.0` → `0.1.0`.

### Removed

- `@sentry/tracing@7.x` — deprecated; tracing is bundled into `@sentry/react` v8+. Dead chunk reference removed from `vite.config.ts`.

### Security

- Auth tokens persisted to `localStorage` are now AES-encrypted at rest. Persistence is disabled outright when `VITE_PERSIST_ENCRYPT_KEY` is not configured (no plaintext fallback).
- Conventional Commit messages enforced on every commit, preventing PRs from landing with messages that can't be parsed by changelog/release tooling later.

[Unreleased]: https://github.com/OutCode-Software/bentigration-Frontend/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/OutCode-Software/bentigration-Frontend/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/OutCode-Software/bentigration-Frontend/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/OutCode-Software/bentigration-Frontend/releases/tag/v0.1.0
