# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
