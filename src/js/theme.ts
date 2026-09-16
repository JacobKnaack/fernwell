/**
 * Theme — toggles `data-theme="dark"` on <html>, remembers the choice, and
 * falls back to the OS preference. Also carries the runtime token API
 * (`setTokens` / `resetTokens` / `getToken`) for retheming Fernwell's colour
 * tokens on the fly — per-tenant branding, a user-picked accent, a live
 * preview — without touching a stylesheet.
 *
 *   <button class="fw-btn fw-btn-ghost" data-fw-theme-toggle
 *           data-fw-theme-label-dark="☀️ Light" data-fw-theme-label-light="🌙 Dark">🌙 Dark</button>
 *
 * init() never animates the theme it applies on load (toggling and live OS
 * changes still do) — but to also avoid a flash of the *wrong* theme's
 * colours before this script runs at all, inline this before your CSS:
 *   <script>document.documentElement.dataset.theme=localStorage.getItem('fw-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')</script>
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fw-theme';
const EVENT = 'fw:themechange';
const TOKEN_PREFIX = '--fw-';
const TOKEN_STYLE_ATTR = 'data-fw-tokens';
const INIT_ATTR = 'data-fw-theme-init';

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The theme currently applied to <html>, or the system preference if none is set. */
export function get(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply a theme, persist it, and update every toggle button on the page. */
export function set(theme: Theme, { persist = true }: { persist?: boolean } = {}): void {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) store()?.setItem(STORAGE_KEY, theme);
  document.querySelectorAll<HTMLElement>('[data-fw-theme-toggle]').forEach((btn) => syncToggle(btn, theme));
  document.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
}

export function toggle(): Theme {
  const next: Theme = get() === 'dark' ? 'light' : 'dark';
  set(next);
  return next;
}

function syncToggle(btn: HTMLElement, theme: Theme): void {
  btn.setAttribute('aria-pressed', String(theme === 'dark'));
  const label = theme === 'dark' ? btn.dataset.fwThemeLabelDark : btn.dataset.fwThemeLabelLight;
  if (label !== undefined) btn.textContent = label;
}

/** Wait two animation frames — long enough for a `transition: none` frame to actually paint. */
function afterPaint(cb: () => void): void {
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 16);
  raf(() => raf(cb));
}

/** Apply the stored / system theme and wire every `[data-fw-theme-toggle]` under `root`. */
export function init(root: ParentNode = document): void {
  const stored = store()?.getItem(STORAGE_KEY);
  const current: Theme = stored === 'dark' || stored === 'light' ? stored : get();

  // Applying the initial theme should never animate — only a later toggle or
  // OS change should. Suppress transitions for this one set() call.
  const html = document.documentElement;
  html.setAttribute(INIT_ATTR, '');
  set(current, { persist: false });
  afterPaint(() => html.removeAttribute(INIT_ATTR));

  root.querySelectorAll<HTMLElement>('[data-fw-theme-toggle]').forEach((btn) => {
    if (btn.dataset.fwBound) return;
    btn.dataset.fwBound = '1';
    syncToggle(btn, current);
    btn.addEventListener('click', () => toggle());
  });

  // Follow the OS only while the user hasn't chosen explicitly.
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    if (!store()?.getItem(STORAGE_KEY)) set(e.matches ? 'dark' : 'light', { persist: false });
  });
}

/* ---------------------------------------------------------------------- *
 * Runtime tokens — override any --fw-* custom property from JS, in both
 * themes or per-theme, scoped to :root or to any selector. Overrides render
 * into one <style data-fw-tokens> appended to <head>: being unlayered and
 * last, it wins over Fernwell's own @layer fw-tokens *and* any earlier
 * static override in the consumer's stylesheet.
 * ---------------------------------------------------------------------- */

/** Token name → CSS value. Bare names (`primary`) and full names (`--fw-primary`) both work. */
export type TokenOverrides = Record<string, string>;

/** Split form: set different values per theme instead of both at once. */
export interface TokenThemeOverrides {
  light?: TokenOverrides;
  dark?: TokenOverrides;
}

interface ScopeTokens {
  light: TokenOverrides;
  dark: TokenOverrides;
}

const tokenScopes = new Map<string, ScopeTokens>();

function normalizeTokenName(name: string): string {
  return name.startsWith('--') ? name : `${TOKEN_PREFIX}${name}`;
}

function isThemeSplit(tokens: TokenOverrides | TokenThemeOverrides): tokens is TokenThemeOverrides {
  // A token's own value is always a CSS string — so any object-valued entry
  // means this is the { light, dark } split form, not a flat token map.
  return Object.values(tokens).some((v) => v !== null && typeof v === 'object');
}

function declBlock(tokens: TokenOverrides): string {
  return Object.entries(tokens)
    .map(([name, value]) => `${normalizeTokenName(name)}:${value};`)
    .join('');
}

function tokenStyleEl(create: boolean): HTMLStyleElement | null {
  const existing = document.head.querySelector<HTMLStyleElement>(`style[${TOKEN_STYLE_ATTR}]`);
  if (existing || !create) return existing;
  const el = document.createElement('style');
  el.setAttribute(TOKEN_STYLE_ATTR, '');
  document.head.appendChild(el);
  return el;
}

function renderTokens(): void {
  if (tokenScopes.size === 0) {
    tokenStyleEl(false)?.remove();
    return;
  }
  const rules: string[] = [];
  tokenScopes.forEach(({ light, dark }, scope) => {
    if (Object.keys(light).length) rules.push(`${scope}{${declBlock(light)}}`);
    if (Object.keys(dark).length) {
      const darkSelector =
        scope === ':root' ? '[data-theme="dark"]' : `[data-theme="dark"] ${scope}, ${scope}[data-theme="dark"]`;
      rules.push(`${darkSelector}{${declBlock(dark)}}`);
    }
  });
  tokenStyleEl(true)!.textContent = rules.join('\n');
}

/**
 * Override Fernwell design tokens at runtime — every derived token (hovers,
 * tints, focus ring, glows) follows automatically, in both themes:
 *
 *   theme.setTokens({ primary: '#2266ff' });
 *
 * Pass `{ light, dark }` to set different values per theme, and `scope` to
 * theme a subtree instead of the whole page:
 *
 *   theme.setTokens({ light: { primary: '#2266ff' }, dark: { primary: '#5c9dff' } });
 *   theme.setTokens({ secondary: '#a33' }, { scope: '.tenant-acme' });
 *
 * Calls accumulate (merge into whatever overrides are already set for that
 * scope) — call `resetTokens()` to clear them.
 */
export function setTokens(tokens: TokenOverrides | TokenThemeOverrides, opts: { scope?: string } = {}): void {
  const scope = opts.scope ?? ':root';
  const entry = tokenScopes.get(scope) ?? { light: {}, dark: {} };
  if (isThemeSplit(tokens)) {
    Object.assign(entry.light, tokens.light);
    Object.assign(entry.dark, tokens.dark);
  } else {
    Object.assign(entry.light, tokens);
    Object.assign(entry.dark, tokens);
  }
  tokenScopes.set(scope, entry);
  renderTokens();
}

/** Clear runtime token overrides — for one `scope`, or every scope if omitted. */
export function resetTokens(scope?: string): void {
  if (scope) tokenScopes.delete(scope);
  else tokenScopes.clear();
  renderTokens();
}

/** The live, resolved value of a token (e.g. `getToken('primary')` → `'#ffc145'`), including runtime overrides. */
export function getToken(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(normalizeTokenName(name)).trim();
}
