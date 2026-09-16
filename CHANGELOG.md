# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] — 2026-09-16

### Changed (breaking)

- **`.fw-modal` markup requires a new `.fw-modal-scroll` wrapper around its head/body/foot.** `.fw-modal` itself now only holds the rounded shape (radius, shadow, clip); `.fw-modal-scroll` is the actual scrolling region (`max-height`, `overflow-y: auto`, padding). Splitting them keeps the custom scrollbar clipped to the panel's rounded corners instead of cutting through them — `overflow` on an element doesn't clip that same element's own scrollbar decoration.
- **`.fw-table-wrap` markup requires a new `.fw-table-scroll` wrapper around the `<table>`.** `.fw-table-wrap` now only holds the rounded card shape (border, radius, shadow, clip); `.fw-table-scroll` is the scrolling region and carries what used to live on `.fw-table-wrap` — `tabindex="0"`, `role="region"`, the horizontal `overflow-x: auto`, and (with `.fw-table-sticky`) `--fw-table-max-height`. Same clipping rationale as the Modal change above.

### Added

- **Icon component** (`src/css/components/icon.css`, `src/js/icon.ts`): a built-in set of ~45 SVG icons rendered into `[data-fw-icon="name"]` elements (`<span class="fw-icon" data-fw-icon="trash" aria-hidden="true">`), sized in `em` and colored via inherited `color` so an icon always matches the surrounding text. Decorative by default — give the accessible name to a wrapping interactive element (e.g. `aria-label` on a button). Exports `render(name)` and the `IconName` type; docs and other components (nav toggle, theme toggle, table actions, popover close button) now use it in place of emoji.
- **Popover component** (`src/css/components/popover.css`, `src/js/popover.ts`): a non-modal floating panel anchored to a trigger via `data-fw-popover-trigger="id"`, with `-placement` (`top`/`bottom`/`left`/`right` or a corner variant) and `-offset` options. Flips/shifts to stay in the viewport, closes on Escape, outside-click, focus-out, or `[data-fw-popover-close]`, and returns focus to the trigger. Renders `aria-modal="false"` per WAI-ARIA APG, so it does not trap Tab. Moves to the end of `<body>` while open so its `position: fixed` isn't broken by an ancestor with `transform`/`filter`/`contain`. Emits `fw:open` / `fw:close`. Exports `popover()`, `PopoverOptions`, `PopoverInstance`.
- **Tooltip component** (`src/css/components/tooltip.css`, `src/js/tooltip.ts`): a short hover/focus annotation sourced from the trigger's `title` attribute (`data-fw-tooltip`), with `-placement`, `-offset`, and `-delay` options. A single shared bubble instance (like `toast.ts`) is hoverable and dismissible per WCAG 2.1 SC 1.4.13, and closes on Escape. Exports `tooltip()`, `TooltipOptions`, `TooltipInstance`.
- **Tabs component** (`src/css/components/tabs.css`, `src/js/tabs.ts`): a single-selection `role="tablist"` that switches `role="tabpanel"` visibility, authored via `aria-selected` and wired up by `data-fw-tabs`. Arrow-key, Home/End navigation with roving `tabindex`; `aria-orientation="vertical"` swaps to Up/Down; `data-fw-tabs-activation="manual"` switches from automatic (arrow keys select) to manual (arrow keys move focus, Space/Enter selects) activation. A tab may carry `aria-disabled="true"` to be skipped by navigation. Emits `fw:tabs-change`. Exports `TabsOptions`, `TabsInstance`, `TabsActivation`, `TabsChangeDetail`.
- **Divider component** (`src/css/components/divider.css`): `.fw-divider` (default `<hr>`), horizontal or vertical via `aria-orientation="vertical"` (both the semantic and visual trigger — no separate modifier class), `-dashed` / `-dotted` style variants, and a labeled variant (`.fw-divider-labeled`, with `-start` / `-end` alignment) for "── text ──" section breaks.
- **Spacer component** (`src/css/components/spacer.css`): `.fw-spacer`, a fixed-size empty box for manual gap control where `gap` on `.fw-row`/`.fw-grid-2` isn't applicable. `data-fw-axis` (`horizontal` / `both`, default vertical) and `data-fw-size` (`1`–`9`, or `auto` for a flex filler that absorbs remaining space) control direction and size via `--fw-sp-*` tokens.
- **Aspect-ratio component** (`src/css/components/aspect-ratio.css`): `.fw-aspect-ratio` crops a wrapped `<img>`/`<video>`/`<iframe>` (or `.fw-aspect-ratio-media`) to a fixed ratio via `object-fit: cover`. `data-fw-ratio` presets (`1:1`, `4:3`, `16:9`, `21:9`) or an inline `--fw-aspect-ratio` for arbitrary ratios; `data-fw-fit="contain"` switches the fit mode.
- **Token-colored custom scrollbars** (`src/css/components/scrollbar.css`): `.fw-root` and Fernwell's own internal scroll regions (`.fw-modal-scroll`, `.fw-drawer-body`, `.fw-table-scroll`) now render a thin, theme-aware scrollbar (`scrollbar-width`/`scrollbar-color`, with a `::-webkit-scrollbar-*` fallback for older WebKit/Chromium) instead of the browser default. New tokens: `--fw-scrollbar-thumb`, `--fw-scrollbar-thumb-hover`, `--fw-scrollbar-track` (Table overrides the track to `--fw-bg-dim` so its scrollbar reads as clearly present, since tabular data needs an obvious "more to scroll" cue). `.fw-tablist` also gets a static two-edge fade mask on its scroll axis as a discoverability cue for overflow tabs.
- Theme toggle (`theme.ts`) now supports a real icon instead of an emoji via `data-fw-theme-icon-dark` / `data-fw-theme-icon-light` (icon names from the new icon component), optionally alongside a `-label-` pair which is appended as text after the icon.
- `theme.init()` no longer animates the theme it applies on page load — only a later toggle or live OS change animates — so a themed page never flashes a cross-fade of its own initial colors.
- Docs: new **Popover**, **Tooltip**, and **Tabs** sections with live demos on the Components page; icon usage throughout the docs replaces the previous emoji placeholders.
- Dev workflow: `npm run dev` now runs `scripts/dev.mjs`, a hot-reloading dev server (previously a one-shot `build && docs`), watching source files and rebuilding/reloading automatically.

## [0.3.0] — 2026-09-15

### Added

- Docs: new **Components** page (`docs/components.html`) with a live demo and markup for every shipped component (Alert, Button, Card, Combobox, Disclosure, Drawer, Empty, Eyebrow, Field, List row, Menu, Modal, Nav, Pagination, Progress, Selection controls, Spinner, Stat, Table, Tag, Toast) plus layout utilities, linked from a new docs-wide page nav alongside the Overview page.

### Fixed

- **`.fw-table` no longer inflates the whole page's width on narrow viewports.** Below 560px it now switches to `table-layout: fixed` (was always `auto`): a wide table's content-driven intrinsic width was previously counted by mobile browsers' viewport-fit sizing even though `.fw-table-wrap`'s `overflow-x: auto` already scrolled that overflow locally, producing horizontal scroll on the entire document into blank space. `.fw-table-select` / `.fw-table-actions` get a small explicit width at that breakpoint (override via `--fw-table-select-w` / `--fw-table-actions-w`) instead of relying on the `width: 1%` shrink-trick, which behaves differently once the table stops sizing to content; other columns share the remaining space and wrap their text, except `.fw-table-num` cells (money, dates, IDs), which truncate with an ellipsis rather than break mid-value. Desktop (`>560px`) is unchanged.
- `.kit-toc` (docs on-page nav drawer) now also sizes with `100dvh`, fixing it rendering partially outside the viewport on iOS Safari when the address bar shows/hides.
- `.fw-drawer`'s mobile (`≤560px`) full-width rule no longer uses `100vw`, which could exceed the true viewport and contribute to page-level horizontal scroll.

## [0.2.0] — 2026-09-14

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

- **Table component** (`src/css/components/table.css`): a native `<table>` inside a scrolling card (`.fw-table-wrap`), with `.fw-table-striped`, `.fw-table-compact`, a sticky header (`.fw-table-sticky` on the wrapper, height via `--fw-table-max-height`), mono/right-aligned numeric cells (`.fw-table-num`), action and checkbox columns (`.fw-table-actions`, `.fw-table-select`), empty and loading rows (`.fw-table-empty`, `.fw-table-loading`, `[aria-busy="true"]`), and sort indicators driven purely by `aria-sort` on the `<th>`.
- **`table` JS enhancer** (`table[data-fw-table]`): client-side column sorting on `th[data-fw-sort]` (`td[data-fw-sort-value]` overrides cell text for numbers and dates), row selection via `[data-fw-select-row]` with a `[data-fw-select-all]` header checkbox that tracks checked / indeterminate state; exports `table.sort()`, `table.getSelected()`, `table.setRowSelected()`, `table.selectAll()` and the `SortDirection` / `SortDetail` / `SelectDetail` types; emits `fw:sort` and `fw:select`.
- **Collapsible menu component** (`src/css/components/menu.css`): a nestable menu built on native `<details>`/`<summary>` that reads as a nav tree or, with `.fw-menu-accordion`, as an accordion. `.fw-menu` > `.fw-menu-list` > `.fw-menu-item` rows are `.fw-menu-link` (`[aria-current="page"]` tint) or `details.fw-menu-group` > `.fw-menu-summary` (CSS-mask chevron, rotates on `[open]`); nested lists hang off an indent rail; `.fw-menu-split` puts a link and an icon-only toggle (`.fw-menu-summary-icon`) in one row so a parent can navigate *and* expand; `.fw-menu-panel` holds free-form accordion bodies. Config via `--fw-menu-indent` and `--fw-menu-row-h`. Works without JS.
- **`menu` JS enhancer** (`.fw-menu[data-fw-menu]`): opens every ancestor group of an `[aria-current]` link on init and marks a collapsed branch that holds it with `.is-current`; `data-fw-menu-exclusive` closes sibling groups when one opens; arrow-key navigation (↑ ↓ between visible rows, → opens / enters a group or jumps from a split link to its toggle, ← closes / returns to the parent, Home / End) without touching Tab order; exports `menu.open()`, `close()`, `toggle()`, `reveal()`, `expandAll()`, `collapseAll()` and the `ToggleDetail` type; emits `fw:toggle`.
- Docs: new **Collapsible menu** section (07e) with a three-level nav tree (split row, auto-revealed current page) and an exclusive FAQ accordion.
- Docs: an on-page navigation tree (`#kit-toc`, `docs/index.html`) built at runtime from the page's own `<h2>` sections, nesting the `<h3>` install methods as children — dogfoods the new `.fw-menu` component and calls `menu.init()` directly. Pinned open beside `.kit-wrap` on wide viewports (`min-width: 1600px`); below that it's an off-canvas drawer opened by a chevron `.kit-toc-toggle` button fixed to the left edge, reusing the `nav` enhancer (`data-fw-nav-toggle`) for outside-click / Escape / `aria-expanded`. Smooth-scrolls to the target heading (`docs/styles/index.css`, respects `prefers-reduced-motion`).
- `.fw-checkbox` now styles the `:indeterminate` state (a dash on Primary), so a select-all checkbox reads correctly when only some rows are ticked.
- Docs: new **Table** section (07d) with a sortable, selectable invoices table, a compact sticky-header table, and an empty state.
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
