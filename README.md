# Fernwell

The design system behind [HunnyDo](https://hunnydo.cloud) — design tokens, CSS components, and a handful of small vanilla-JS enhancers. Framework-agnostic: works with a `<script>` tag, an npm bundler, or as plain CSS. No build step required on your side.

Warm, rounded, and legible — built to feel approachable to a first-time consumer trial and sturdy enough for the team running their business through it every day.

**Reference page:** [`docs/index.html`](docs/index.html) — every component, live, in both themes.

## Install

### 1. `<script>` tag / CDN — no build step

```html
<link rel="stylesheet" href="https://unpkg.com/fernwell/dist/fernwell.min.css">
<script src="https://unpkg.com/fernwell/dist/fernwell.iife.js"></script>
```

This exposes `window.Fernwell` and calls `Fernwell.init()` on `DOMContentLoaded`. Add `data-fw-no-init` to the script tag to wire things up yourself.

### 2. npm + bundler

```bash
npm install fernwell
```

```js
import 'fernwell/css';                       // or 'fernwell/css/min'
import { init, toast, theme } from 'fernwell';

init();                                      // wires every data-fw-* hook on the page
toast.show('Invoice sent');
```

ESM and CommonJS are both provided; types are included.

### 3. CSS only

```css
@import 'fernwell/css';          /* tokens + base + every component */
@import 'fernwell/tokens.css';   /* just the custom properties */
```

### Fonts

Fernwell doesn't bundle fonts. Add the three faces (or self-host them) — the tokens carry system fallbacks either way:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
```

### Page defaults (optional)

Components never depend on global styles. If you *want* the system's page defaults — Background colour, Text colour, Inter body, display-font headings with zero margins — add `fw-root` to `<body>`:

```html
<body class="fw-root">
```

The resets inside `.fw-root` use `:where()`, so any rule of yours wins.

## Dark theme

Set `data-theme="dark"` on `<html>` (or any ancestor) and every token flips. A `data-theme="light"` ancestor re-asserts light inside a dark page (a light card in a dark app, say). To remember the choice and honour the OS preference, drop a toggle anywhere:

```html
<button class="fw-btn fw-btn-ghost" data-fw-theme-toggle
        data-fw-theme-label-light="🌙 Dark" data-fw-theme-label-dark="☀️ Light">🌙 Dark</button>
```

`init()` never animates the theme it applies on load (toggling and live OS changes still do), but to also avoid a flash of the *wrong* theme's colours before that script runs at all, inline this in `<head>` before the stylesheet:

```html
<script>document.documentElement.dataset.theme=localStorage.getItem('fw-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')</script>
```

Dark mode is not a straight inversion: Primary stays the same hex in both themes by default, neutrals go to a near-black that keeps a trace of Secondary (never pure black), status colours lift a step lighter, and tinted backgrounds become low-opacity washes.

## Tokens

Every value in the system is a `--fw-*` custom property, named by **role** (`primary`, `success`, `text`…), not by the default palette (Marigold, Meadow, Ink…) — so retheming never means renaming. The machine-readable source is `fernwell/tokens.json`; a value can reference another token in the same group with `{name}`, resolved to `var(--fw-name)` when the CSS is generated.

### Seeds — override these

Declared literally per theme (or once, for the handful that don't flip). Overriding a seed reflows every derived token below it, in both themes:

```css
:root { --fw-primary: #2266ff; --fw-r-lg: 20px; }
```

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--fw-text` | `#1F2430` | `#F2F1EA` | primary text |
| `--fw-text-soft` | `#565D6E` | `#9CA1B0` | secondary text — never pure gray |
| `--fw-bg` | `#F5F6F1` | `#14161C` | page background |
| `--fw-bg-dim` | `#EAEBE4` | `#2B2F3B` | dividers, input borders |
| `--fw-surface` | `#FFFFFF` | `#1D2029` | cards, panels |
| `--fw-primary` | `#FFC145` (Marigold) | same | primary brand / CTA |
| `--fw-secondary` | `#4C3A73` (Plum) | `#6B54A3` | secondary brand, nav |
| `--fw-success` | `#3FA672` (Meadow) | `#55D194` | success |
| `--fw-warning` | `#E8A521` | `#FFD166` | pending / waiting — independent of Primary |
| `--fw-danger` | `#E85B4F` (Coral) | `#FF8478` | error / danger |
| `--fw-info` | `#3E8FD0` (Sky) | `#6BB3E8` | info |
| `--fw-on-primary` | `#1F2430` | same | text on Primary surfaces; never flips |
| `--fw-on-secondary` | `#FFFFFF` | same | text on Secondary / brand surfaces (nav, footer, banners) |
| `--fw-overlay` / `--fw-overlay-soft` | text-tinted alphas | black alphas | modal / drawer backdrops |
| `--fw-shadow-sm` / `-md` / `-lg` | text-tinted | black | elevation |
| `--fw-font-display` / `-body` / `-mono` | Plus Jakarta Sans / Inter / IBM Plex Mono | | headlines / UI / numbers |
| `--fw-sp-1` … `--fw-sp-9` | `4 8 12 16 24 32 48 64 96` px | | 8pt spacing scale |
| `--fw-r-sm` / `-md` / `-lg` / `-xl` / `-full` | `10 16 24 32 999` px | | inputs / buttons / cards / modals / pills |
| `--fw-border-w` | `1.5px` | | the one border weight |
| `--fw-motion-fast` / `-base` / `-ease` | `120ms` / `180ms` / `ease` | | controls / panels |

### Derived — follow automatically

Computed from the seeds above with `color-mix()`. Never override these directly — override the seed they're built from instead:

| Token | Formula | Role |
| --- | --- | --- |
| `--fw-primary-hover` | mix of Primary + Text | button hover / active — darkens in light, brightens in dark |
| `--fw-primary-soft` | mix of Primary + white | highlight (empty-state blob gradient) |
| `--fw-secondary-hover` | mix of Secondary + Text | secondary button hover |
| `--fw-secondary-bg` / `-success-bg` / `-warning-bg` / `-danger-bg` / `-info-bg` | mix of the role colour + Surface (light) / transparent (dark) | tag / alert / toast tints — opaque pastel in light, low-opacity wash in dark |
| `--fw-on-secondary-soft` / `-fill` / `-line` | Secondary-text alphas | secondary text / control fill / border on Secondary surfaces |
| `--fw-focus-ring` | `0 0 0 4px` mix of Primary + transparent | box-shadow focus ring |
| `--fw-shadow-primary` / `-success` | mix of the role colour + transparent | CTA / success glow |

## Theming

Override any **seed** token and every derived token follows automatically, in both themes — no need to fork the CSS or hand-tune the tokens it feeds.

**CSS — static.** Redeclare a seed after the stylesheet; it wins over `[data-theme="dark"]` too, so you don't need to repeat it per theme:

```css
:root { --fw-primary: #2266ff; }
/* only if you want a *different* value in dark: */
[data-theme="dark"] { --fw-primary: #5c9dff; }
```

This works because Fernwell's own token declarations live in `@layer fw-tokens` — an unlayered rule (yours, unless you also use `@layer`) always beats a layered one, regardless of selector specificity or source order. If your app declares its own CSS layers, list them (e.g. `@layer reset, base, components;`) before importing Fernwell's CSS so `fw-tokens` isn't implicitly nested inside one of them.

**JS — runtime.** For per-tenant branding, a user-picked accent, or a live preview:

```js
import { theme } from 'fernwell';

theme.setTokens({ primary: '#2266ff' });                                    // both themes
theme.setTokens({ light: { primary: '#2266ff' }, dark: { primary: '#5c9dff' } }); // per theme
theme.setTokens({ secondary: '#a33' }, { scope: '.tenant-acme' });           // one subtree
theme.getToken('primary');                                                  // live resolved value, e.g. '#2266ff'
theme.resetTokens();                                                        // clear every runtime override
```

Runtime overrides render into one `<style data-fw-tokens>` appended to `<head>` and win over both the `@layer fw-tokens` defaults and any static override, so `setTokens` always has the last word.

**Browser support.** `color-mix()` and `@layer` need Chrome 111+, Safari 16.2+, Firefox 113+. There's no polyfill shipped — on an older browser the seed tokens still apply, but derived tokens fall back to whatever the browser does with an unsupported `color-mix()` value (typically the property's initial value), so hovers/tints/focus rings may go missing rather than mis-colour.

## Components

All class names are prefixed `fw-`; state classes are `is-*`. Each stylesheet in `src/css/components/` opens with the markup it expects.

| Component | Classes |
| --- | --- |
| Button | `.fw-btn` + `.fw-btn-primary` `-secondary` `-ghost` `-danger` `-lg`; `.fw-btn-loading`; `.fw-icon-btn` |
| Card | `.fw-card` |
| Tag | `.fw-tag` + `-live` `-pending` `-error` `-info` `-secondary`; `.fw-tag-pill` (compact, untilted) |
| Eyebrow | `.fw-eyebrow` |
| Field | `.fw-field` (`.fw-field-full`), `.fw-label`, `.fw-input`, `.fw-hint`, `.fw-error-msg`, `.fw-required`; `.is-error`, `.is-disabled` |
| Selection | `.fw-checkbox` / `.fw-radio` (`<input>` + `.fw-box`; checkbox styles `:indeterminate`), `.fw-toggle` (`<input>` + `.fw-track > .fw-thumb`), `.fw-option-group` (`-inline`) |
| Combobox | `.fw-combobox` wrapper, `input[data-fw-combobox][list]` + `<datalist>` |
| Alert | `.fw-alert` + `-success` `-error` `-pending` `-info` `-with-action`; `.fw-alert-dot` `-title` `-body` |
| Progress | `.fw-progress` (`-sm`, `.is-indeterminate`, `.is-success`) > `.fw-progress-fill`; `.fw-progress-label` |
| Spinner | `.fw-spinner` + `-sm` `-md` `-lg` (colour from `currentColor`) |
| Nav | `.fw-nav` (`-sticky`), `-brand`, `-dot` / `-hex`, `-links`, `-right`, `-avatar`, `-btn`, `-toggle`, `-dropdown` (`-menu`) |
| Stat | `.fw-stat-label` `-value` (`-unit`) `-delta` (`.is-up` / `.is-down`) |
| Empty state | `.fw-empty`, `-blob`, `-title`, `-body` |
| Modal | `.fw-modal-overlay` > `.fw-modal` (`-wide`); `-head`, `-title`, `-sub`, `-foot` |
| Drawer | `.fw-drawer-overlay` + `.fw-drawer`; `-head`, `-eyebrow`, `-title`, `-body`, `-foot` |
| Popover | `.fw-popover` (`role="dialog"`, non-modal); `-head`, `-title`, `-body` |
| Tooltip | `.fw-tooltip` (`role="tooltip"`, singleton, created on first show) |
| Toast | `.fw-toast` + `-error` `-info` `-pending` (created by `toast.show`) |
| List row | `.fw-list-row` (`.is-locked`), `-main`, `-title`, `-meta`; `.fw-sub-list` |
| Disclosure | `details.fw-disclosure`, `-chevron`, `-count`, `-body` |
| Pagination | `.fw-pagination`, `.fw-pag-info`, `.fw-pag-controls`, `.fw-pag-label`, `.fw-btn-page` |
| Table | `.fw-table-wrap` (`.fw-table-sticky` + `--fw-table-max-height`) > `.fw-table` (`-striped`, `-compact`); cells `.fw-table-num`, `.fw-table-actions`, `.fw-table-select`; `th[aria-sort] > .fw-table-sort`; rows `.fw-table-empty`, `.fw-table-loading`, `.is-selected`; `[aria-busy="true"]` dims the body |
| Collapsible menu | `.fw-menu` (`-accordion`) > `.fw-menu-list` > `.fw-menu-item` (`.fw-menu-split`) > `.fw-menu-link` or `details.fw-menu-group` > `.fw-menu-summary` (`-icon`, `.is-current`) + nested `.fw-menu-list` or `.fw-menu-panel`; `[aria-current="page"]` marks the current link; `--fw-menu-indent`, `--fw-menu-row-h` |
| Layout | `.fw-wrap`, `.fw-row`, `.fw-grid-2`, `.fw-sr-only` |

## JavaScript

Everything is progressive enhancement over plain HTML. `init(root?)` is idempotent — call it again after injecting markup (HTMX, Turbo, fetch-and-insert) and only new elements get bound.

| Hook | What it does |
| --- | --- |
| `[data-fw-theme-toggle]` | flips `data-theme`, persists to `localStorage['fw-theme']`, sets `aria-pressed` |
| `input[data-fw-combobox]` | typeahead over the `<datalist>` in `list=` (↑ ↓ Enter Esc, `aria-activedescendant`) |
| `[data-fw-open-modal="id"]` / `[data-fw-close-modal]` | modal with backdrop-click (drag-safe), Escape, focus return, scroll lock |
| `[data-fw-open-drawer="id"]` / `[data-fw-close-drawer]` / `[data-fw-drawer-overlay="id"]` | same for drawers |
| `[data-fw-popover-trigger="id"]` (+ `-placement`, `-offset`) / `[data-fw-popover-close]` | non-modal floating panel: flip/shift to stay in the viewport, Escape, outside-click, focus-out, and close-button dismissal, focus return to trigger |
| `[data-fw-tooltip]` (+ `-placement`, `-offset`, `-delay`) | hover (with delay) or focus (instant) tooltip sourced from the trigger's `title`; hoverable per WCAG 1.4.13, dismisses on Escape |
| `[data-fw-nav-toggle][aria-controls]` | dropdown open/close, outside-click and Escape |
| `form[data-fw-loading]` | submit button gets a spinner + `data-fw-loading-text` label on submit |
| `table[data-fw-table]` with `th[data-fw-sort]`, `input[data-fw-select-all]` / `[data-fw-select-row]` | client-side column sort (cycles `aria-sort`, honours `td[data-fw-sort-value]`), row selection with select-all + indeterminate, `.is-selected` / `aria-selected` on rows |
| `.fw-menu[data-fw-menu]` (+ `data-fw-menu-exclusive`) | nestable `<details>` menu: opens the ancestors of `[aria-current]` on init, `.is-current` on a collapsed branch holding it, ↑ ↓ → ← Home End between rows, exclusive mode closes sibling groups |

Programmatic API:

```js
import { theme, combobox, modal, nav, loading, toast, table, menu, popover, tooltip } from 'fernwell';

theme.get();
theme.set('dark');
theme.toggle();
theme.setTokens({ primary: '#2266ff' }); theme.resetTokens(); theme.getToken('primary'); // see Theming

const cb = combobox(inputEl,
  {
    options: ['Seattle', 'Portland'],
    onSelect(v) {} 
  }
);
cb.setOptions([...]);
cb.destroy();
modal.open('confirm');
modal.close('confirm'); // works for drawers too
loading.setButtonLoading(btn, 'Sending…');
loading.resetButtonLoading(btn);
toast.show('That card was declined', { variant: 'error', duration: 6000 });
table.sort(tableEl, 2, 'descending');   // column index, 'ascending' | 'descending'
table.getSelected(tableEl);             // HTMLTableRowElement[]
table.selectAll(tableEl, false);
menu.open(groupEl); menu.close(groupEl); menu.toggle(groupEl);   // groupEl = details.fw-menu-group
menu.reveal(linkEl);                    // open every ancestor group of an element
menu.expandAll(menuEl); menu.collapseAll(menuEl);
const pop = popover(triggerEl, panelEl, { placement: 'bottom', offset: 8 });
pop.open(); pop.close(); pop.toggle(); pop.destroy();
const tip = tooltip(triggerEl, { placement: 'top', delay: 400 });
tip.show(); tip.hide(); tip.destroy();
```

Events: `fw:themechange` on `document` (detail: `'light' | 'dark'`), `fw:open` / `fw:close` bubbling from the modal, drawer, or popover, `fw:sort` (detail: `{ column, direction, th }`) and `fw:select` (detail: `{ rows, all }`) bubbling from the table, `fw:toggle` (detail: `{ group, open }`) bubbling from a `.fw-menu-group`.

## Principles

**Colour.** Primary (Marigold by default) carries the energy — one action per view, never decoration. Secondary (Plum) grounds navigation and headers. Text and Background do 90% of the work. Status colours (Success/Meadow, Warning, Danger/Coral, Info/Sky) each pair a saturated foreground with a soft tint so status is never confusable with a CTA. All of it is retheme-able — see [Theming](#theming).

**Type.** Plus Jakarta Sans for anything that should feel like a voice; Inter for anything read quickly and often; Plex Mono for numbers and IDs.

**Shape.** One rounding scale: the bigger the surface, the softer the corner. Inputs 10 · buttons 16 · cards 24 · modals 32.

**Motion.** 120ms ease and a 1px lift on controls, no bounce. 180ms fade + rise for panels, no scale-up. A ~300ms checkmark draw-in is the single expressive exception. `prefers-reduced-motion` drops every transform to an opacity fade.

**Voice.** Buttons name the action ("Send invoice", not "Submit"). Errors say what happened and what to do next, without apologising. Empty states are invitations. Confirmations echo the verb on the button.

**Icons.** Outline only, 16–20px box, 1.3–1.4px stroke, round caps and joins, `currentColor`. No fills — except a checkmark on a completed item.

## Development

```bash
npm install
npm run build     # tokens.json → tokens.css, lint, esbuild → dist/, tsc → .d.ts
npm run lint      # fails on raw hex / rgb / unprefixed vars / off-scale px in component CSS
npm run docs      # serve docs/ (self-contained: build copies dist/ into docs/dist/)
```

`src/tokens/tokens.json` is the only place a value is defined; `src/css/tokens.css` is generated from it.

## Versioning

Semantic versioning, strictly: **major** for any rename or removal of a token, class, data attribute, or JS export; **minor** for additions; **patch** for fixes. Fernwell is `0.x` until HunnyDo's app and marketing site both consume it — expect breaking changes in minors until `1.0.0`.

**Deprecation policy (from 1.0):** a token or class slated for removal keeps working for at least one minor release, with a `/* @deprecated */` note in the CSS and an entry in the changelog naming the replacement. It's removed in the next major.

## Releasing to npm

Publishing a GitHub Release triggers [`.github/workflows/publish-npm.yml`](.github/workflows/publish-npm.yml), which builds the package and runs `npm publish --provenance` via npm's OIDC trusted publishing (no token stored in the repo). To ship a new version:

1. Bump `version` in `package.json`.
2. Move the `## [Unreleased]` section in `CHANGELOG.md` to a new dated heading, e.g. `## [0.2.0] — 2026-09-14`.
3. Commit both and merge into `main` branch.
4. Create a GitHub Release tagged `vX.Y.Z` (matching the version from step 1) targeting `main`:

   ```bash
   gh release create v0.2.0 --title v0.2.0 --notes-from-tag
   ```

   or via the GitHub UI: **Releases → Draft a new release**, tag `vX.Y.Z`, target `main`, then **Publish release**.

Publishing the release fires the workflow, which checks the tag matches `package.json`'s version and that the version isn't already on the registry before publishing. Mark a release **pre-release** to cut a tag without triggering an npm publish. The workflow can also be run manually from the Actions tab (`workflow_dispatch`), which defaults to a `npm publish --dry-run` so the pipeline can be sanity-checked without shipping anything.

## License

MIT

## Docs deployment

`docs/` is published to GitHub Pages by [`.github/workflows/deploy-docs.yml`](.github/workflows/deploy-docs.yml) on every push to `main`. Because `docs/dist/` is generated (and gitignored), the workflow runs `npm run build` first and uploads the resulting `docs/` folder as the Pages artifact — so the deployed page always matches the built package.

One-time setup in the GitHub repo: **Settings → Pages → Source → "GitHub Actions"** (not "Deploy from a branch").
