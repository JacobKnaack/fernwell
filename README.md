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

Components never depend on global styles. If you *want* the system's page defaults — Cloud background, Ink text, Inter body, display-font headings with zero margins — add `fw-root` to `<body>`:

```html
<body class="fw-root">
```

The resets inside `.fw-root` use `:where()`, so any rule of yours wins.

## Dark theme

Set `data-theme="dark"` on `<html>` (or any ancestor) and every token flips. To remember the choice and honour the OS preference, drop a toggle anywhere:

```html
<button class="fw-btn fw-btn-ghost" data-fw-theme-toggle
        data-fw-theme-label-light="🌙 Dark" data-fw-theme-label-dark="☀️ Light">🌙 Dark</button>
```

To avoid a flash of the wrong theme, inline this in `<head>` before the stylesheet:

```html
<script>document.documentElement.dataset.theme=localStorage.getItem('fw-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')</script>
```

Dark mode is not a straight inversion: Marigold stays the same hex in both themes, neutrals go to a near-black that keeps a trace of Plum (never pure black), status colours lift a step lighter, and tinted backgrounds become low-opacity washes.

## Tokens

Every value in the system is a `--fw-*` custom property declared on `:root`. Override any of them after the stylesheet — never fork the CSS:

```css
:root { --fw-marigold: #f0b030; --fw-r-lg: 20px; }
```

The machine-readable source is `fernwell/tokens.json`.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--fw-ink` | `#1F2430` | `#F2F1EA` | primary text |
| `--fw-ink-soft` | `#565D6E` | `#9CA1B0` | secondary text — never pure gray |
| `--fw-ink-fixed` | `#1F2430` | `#1F2430` | text on Marigold; never flips |
| `--fw-cloud` | `#F5F6F1` | `#14161C` | page background |
| `--fw-cloud-dim` | `#EAEBE4` | `#2B2F3B` | dividers, input borders |
| `--fw-surface` | `#FFFFFF` | `#1D2029` | cards, panels |
| `--fw-marigold` / `-dk` / `-lt` | `#FFC145` / `#E8A521` / `#FFD988` | `#FFC145` / `#FFD166` / `#FFD988` | primary brand / CTA |
| `--fw-plum` / `-dk` / `-bg` | `#4C3A73` / `#392C58` / `#EEEAF6` | `#6B54A3` / `#7E68B5` / wash | secondary brand, nav |
| `--fw-meadow` / `-bg` | `#3FA672` / `#E6F5EC` | `#55D194` / wash | success |
| `--fw-coral` / `-bg` | `#E85B4F` / `#FCEAE8` | `#FF8478` / wash | error / danger |
| `--fw-sky` / `-bg` | `#3E8FD0` / `#E8F2FA` | `#6BB3E8` / wash | info |
| `--fw-pending-bg` | `#FFF3DC` | wash | pending / waiting |
| `--fw-on-brand` / `-soft` / `-fill` / `-line` | white + alphas | same | text and controls on Plum |
| `--fw-overlay` / `--fw-overlay-soft` | ink alphas | black alphas | modal / drawer backdrops |
| `--fw-focus-ring` | `0 0 0 4px rgba(255,193,69,.25)` | same | box-shadow focus ring |
| `--fw-font-display` / `-body` / `-mono` | Plus Jakarta Sans / Inter / IBM Plex Mono | | headlines / UI / numbers |
| `--fw-sp-1` … `--fw-sp-9` | `4 8 12 16 24 32 48 64 96` px | | 8pt spacing scale |
| `--fw-r-sm` / `-md` / `-lg` / `-xl` / `-full` | `10 16 24 32 999` px | | inputs / buttons / cards / modals / pills |
| `--fw-shadow-sm` / `-md` / `-lg` / `-marigold` / `-meadow` | ink-tinted | black | elevation |
| `--fw-border-w` | `1.5px` | | the one border weight |
| `--fw-motion-fast` / `-base` / `-ease` | `120ms` / `180ms` / `ease` | | controls / panels |

## Components

All class names are prefixed `fw-`; state classes are `is-*`. Each stylesheet in `src/css/components/` opens with the markup it expects.

| Component | Classes |
| --- | --- |
| Button | `.fw-btn` + `.fw-btn-primary` `-secondary` `-ghost` `-danger` `-lg`; `.fw-btn-loading`; `.fw-icon-btn` |
| Card | `.fw-card` |
| Tag | `.fw-tag` + `-live` `-pending` `-error` `-info` `-plum`; `.fw-tag-pill` (compact, untilted) |
| Eyebrow | `.fw-eyebrow` |
| Field | `.fw-field` (`.fw-field-full`), `.fw-label`, `.fw-input`, `.fw-hint`, `.fw-error-msg`, `.fw-required`; `.is-error`, `.is-disabled` |
| Selection | `.fw-checkbox` / `.fw-radio` (`<input>` + `.fw-box`), `.fw-toggle` (`<input>` + `.fw-track > .fw-thumb`), `.fw-option-group` (`-inline`) |
| Combobox | `.fw-combobox` wrapper, `input[data-fw-combobox][list]` + `<datalist>` |
| Alert | `.fw-alert` + `-success` `-error` `-pending` `-info` `-with-action`; `.fw-alert-dot` `-title` `-body` |
| Progress | `.fw-progress` (`-sm`, `.is-indeterminate`, `.is-success`) > `.fw-progress-fill`; `.fw-progress-label` |
| Spinner | `.fw-spinner` + `-sm` `-md` `-lg` (colour from `currentColor`) |
| Nav | `.fw-nav` (`-sticky`), `-brand`, `-dot` / `-hex`, `-links`, `-right`, `-avatar`, `-btn`, `-toggle`, `-dropdown` (`-menu`) |
| Stat | `.fw-stat-label` `-value` (`-unit`) `-delta` (`.is-up` / `.is-down`) |
| Empty state | `.fw-empty`, `-blob`, `-title`, `-body` |
| Modal | `.fw-modal-overlay` > `.fw-modal` (`-wide`); `-head`, `-title`, `-sub`, `-foot` |
| Drawer | `.fw-drawer-overlay` + `.fw-drawer`; `-head`, `-eyebrow`, `-title`, `-body`, `-foot` |
| Toast | `.fw-toast` + `-error` `-info` `-pending` (created by `toast.show`) |
| List row | `.fw-list-row` (`.is-locked`), `-main`, `-title`, `-meta`; `.fw-sub-list` |
| Disclosure | `details.fw-disclosure`, `-chevron`, `-count`, `-body` |
| Pagination | `.fw-pagination`, `.fw-pag-info`, `.fw-pag-controls`, `.fw-pag-label`, `.fw-btn-page` |
| Layout | `.fw-wrap`, `.fw-row`, `.fw-grid-2`, `.fw-sr-only` |

## JavaScript

Everything is progressive enhancement over plain HTML. `init(root?)` is idempotent — call it again after injecting markup (HTMX, Turbo, fetch-and-insert) and only new elements get bound.

| Hook | What it does |
| --- | --- |
| `[data-fw-theme-toggle]` | flips `data-theme`, persists to `localStorage['fw-theme']`, sets `aria-pressed` |
| `input[data-fw-combobox]` | typeahead over the `<datalist>` in `list=` (↑ ↓ Enter Esc, `aria-activedescendant`) |
| `[data-fw-open-modal="id"]` / `[data-fw-close-modal]` | modal with backdrop-click (drag-safe), Escape, focus return, scroll lock |
| `[data-fw-open-drawer="id"]` / `[data-fw-close-drawer]` / `[data-fw-drawer-overlay="id"]` | same for drawers |
| `[data-fw-nav-toggle][aria-controls]` | dropdown open/close, outside-click and Escape |
| `form[data-fw-loading]` | submit button gets a spinner + `data-fw-loading-text` label on submit |

Programmatic API:

```js
import { theme, combobox, modal, nav, loading, toast } from 'fernwell';

theme.get(); theme.set('dark'); theme.toggle();
const cb = combobox(inputEl, { options: ['Seattle', 'Portland'], onSelect(v) {} }); cb.setOptions([...]); cb.destroy();
modal.open('confirm'); modal.close('confirm');           // works for drawers too
loading.setButtonLoading(btn, 'Sending…'); loading.resetButtonLoading(btn);
toast.show('That card was declined', { variant: 'error', duration: 6000 });
```

Events: `fw:themechange` on `document` (detail: `'light' | 'dark'`), `fw:open` / `fw:close` bubbling from the modal or drawer.

## Principles

**Colour.** Marigold carries the energy — one primary action per view, never decoration. Plum grounds navigation and headers. Ink and Cloud do 90% of the work. Status colours (Meadow, Coral, Sky) each pair a saturated foreground with a soft tint so status is never confusable with a CTA.

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
npm run docs      # serve the repo; open /docs/
```

`src/tokens/tokens.json` is the only place a value is defined; `src/css/tokens.css` is generated from it.

## Versioning

Semantic versioning, strictly: **major** for any rename or removal of a token, class, data attribute, or JS export; **minor** for additions; **patch** for fixes. Fernwell is `0.x` until HunnyDo's app and marketing site both consume it — expect breaking changes in minors until `1.0.0`.

**Deprecation policy (from 1.0):** a token or class slated for removal keeps working for at least one minor release, with a `/* @deprecated */` note in the CSS and an entry in the changelog naming the replacement. It's removed in the next major.

## License

MIT
