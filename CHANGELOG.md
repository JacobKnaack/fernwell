# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed (breaking)
- **Colour tokens renamed from the default palette to semantic roles**, so a consumer never has to rename a token to retheme it. `src/tokens/tokens.json` and every component now speak in roles; the shipped values are unchanged, just renamed:
  - `--fw-ink` → `--fw-text`, `--fw-ink-soft` → `--fw-text-soft`, `--fw-ink-fixed` → `--fw-on-primary`
  - `--fw-cloud` → `--fw-bg`, `--fw-cloud-dim` → `--fw-bg-dim`
  - `--fw-marigold` → `--fw-primary`, `--fw-marigold-lt` → `--fw-primary-soft`
  - `--fw-marigold-dk` → `--fw-primary-hover` (button hover) or `--fw-warning` (pending tag/dot/toast — see below)
  - `--fw-plum` → `--fw-secondary`, `--fw-plum-dk` → `--fw-secondary-hover`, `--fw-plum-bg` → `--fw-secondary-bg`
  - `--fw-meadow` → `--fw-success`, `--fw-meadow-bg` → `--fw-success-bg`
  - `--fw-coral` → `--fw-danger`, `--fw-coral-bg` → `--fw-danger-bg`
  - `--fw-sky` → `--fw-info`, `--fw-sky-bg` → `--fw-info-bg`
  - `--fw-on-brand` / `-soft` / `-fill` / `-line` → `--fw-on-secondary` / `-soft` / `-fill` / `-line`
  - `--fw-pending-bg` → `--fw-warning-bg`
  - `--fw-shadow-marigold` → `--fw-shadow-primary`, `--fw-shadow-meadow` → `--fw-shadow-success`
  - `.fw-tag-plum` → `.fw-tag-secondary`
  - `--fw-marigold-dk` split into two roles because it did two jobs under one name (button hover *and* the pending/waiting accent) — a consumer retheming Primary to blue no longer accidentally turns pending tags blue too.
- `src/tokens/tokens.json` schema changed: `color.light` / `color.dark` (and `shadow.light` / `shadow.dark`) collapsed into one entry per token, `{ value }` (same both themes) or `{ light, dark? }`. A value can reference another token in the same group with `{name}`.

### Added
- **Derived tokens**: `--fw-primary-hover`, `--fw-primary-soft`, `--fw-secondary-hover`, `--fw-secondary-bg`, `--fw-success-bg`, `--fw-warning-bg`, `--fw-danger-bg`, `--fw-info-bg`, `--fw-on-secondary-soft/-fill/-line`, `--fw-focus-ring` and `--fw-shadow-primary/-success` are now computed from their seed colour with `color-mix()` instead of being separately hand-tuned hex/rgba values — override the seed (e.g. `--fw-primary`) and every derived token follows, in both themes, without needing to be redeclared.
- New `--fw-warning` / `--fw-warning-bg` tokens (the old `marigold-dk` pending accent, now independent of Primary).
- Generated `src/css/tokens.css` now wraps its rules in `@layer fw-tokens`, so a plain (unlayered) consumer override always wins over Fernwell's own `[data-theme="dark"]` re-declaration, regardless of selector specificity or source order — previously a `:root` override had to be repeated for `[data-theme="dark"]` or it was clobbered on theme toggle.
- `[data-theme="light"]` now also sets the light token block, so a light island inside a dark page (or vice versa) works.
- Runtime theming API on `theme`: `setTokens(tokens, { scope })`, `resetTokens(scope?)`, `getToken(name, el?)` — override tokens from JS (per-tenant branding, a user-picked accent), optionally scoped to a subtree or split by theme with `{ light, dark }`. Renders into one `<style data-fw-tokens>` that wins over both the `@layer fw-tokens` defaults and any static override.
- `docs/index.html`: new **Theming** section with a live palette editor (colour pickers for every seed role, wired to `setTokens`/`resetTokens`, with a live CSS preview) and a rewritten Color section showing role names alongside their default palette nicknames.
- Token lint (`npm run lint`) now fails on any retired pre-rename token or class name (`--fw-marigold`, `--fw-ink`, `.fw-tag-plum`, …), to guard against regressions.

## [0.1.0] — 2026-09-14

First standalone release. Extracted from the HunnyDo marketing site and app, where the system previously lived as two hand-synced copies.

### Added
- Design tokens as `--fw-*` custom properties (light + `[data-theme="dark"]`), generated from `src/tokens/tokens.json`, also shipped as `fernwell/tokens.json`.
- Components: button, icon button, card, tag/pill, eyebrow, field, checkbox/radio/toggle, combobox, alert, progress, spinner, nav, stat, empty state, modal, drawer, toast, list row, disclosure, pagination, layout helpers, opt-in `.fw-root` page defaults.
- JS enhancers (ESM, CJS, IIFE): `theme`, `combobox`, `modal` (modals + drawers), `nav`, `loading`, `toast`, and an idempotent `init()`.
- `docs/index.html` reference page.
- Token lint (`npm run lint`) that rejects raw colours, unprefixed variables and off-scale pixel values in component CSS.

### Changed (vs. the marketing/app copies)
- All tokens renamed with the `--fw-` prefix; `--white` → `--fw-surface`.
- All classes renamed with the `fw-` prefix; state classes are `is-*` (`.open` → `.is-open`, `.error` → `.is-error`, `.active` → `.is-active`).
- Checkbox checkmark is drawn with a CSS mask — no inline SVG needed in the markup.
- Modal and drawer are driven by `data-fw-open-modal` / `data-fw-open-drawer` and share one enhancer.
- New tokens: `--fw-focus-ring`, `--fw-border-w`, `--fw-motion-*`, `--fw-on-brand-*`, `--fw-overlay*`, `--fw-marigold-lt`.
