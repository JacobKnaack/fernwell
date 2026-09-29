/**
 * Tokens — override any `--fw-*` design token from JS, for the whole app or
 * for one page or subtree, in both themes or per-theme. Every derived token
 * (hovers, tints, focus ring, glows) follows the seed it is built from.
 *
 *   tokens.setTokens({ primary: '#2266ff' });                                  // both themes
 *   tokens.setTokens({ light: { primary: '#2266ff' }, dark: { primary: '#5c9dff' } });
 *   tokens.setTokens({ secondary: '#a33' }, { scope: '.tenant-acme' });       // one subtree
 *   const undo = tokens.setTokens({ primary: '#a33' });  undo();               // route-scoped
 *   tokens.setTokens({ primary: '#2266ff' }, { persist: true });               // app-wide
 *
 * Overrides render into one `<style data-fw-tokens>` appended to `<head>`:
 * being unlayered and last, it wins over Fernwell's own `@layer fw-tokens`
 * *and* any earlier static override in the consumer's stylesheet.
 *
 * Persistence — `persist: true` saves the scope to localStorage so every page
 * of the app (and every reload) gets it. Without it an override lives only
 * for the current page load, which is what "this page only" means in a
 * multi-page app. Persisted overrides sit *below* page-level ones, so a page
 * can still tweak an app-wide value. To apply them before first paint, inline
 * this ahead of your CSS (next to the theme snippet — see theme.ts):
 *   <script>try{var c=localStorage.getItem('fw-tokens-css');if(c){var s=document.createElement('style');s.setAttribute('data-fw-tokens','');s.textContent=c;document.head.appendChild(s)}}catch(e){}</script>
 *
 * Declarative hooks (wired by `init()`):
 *
 *   <script type="application/json" data-fw-theme-tokens>{"primary":"#2266ff"}</script>
 *   <script type="application/json" data-fw-theme-tokens data-fw-scope=".tenant-acme" data-fw-persist>{…}</script>
 *   <section data-fw-theme-scope='{"secondary":"#a33"}'>…</section>
 *
 * The `<script>` form takes the same shapes as `setTokens()` (flat map or
 * `{ light, dark }`); `data-fw-scope` and `data-fw-persist` are optional. The
 * element form themes that element's subtree only, and is never persisted.
 * Both are undone on the next `init()` after their element is removed from
 * the page; call the function `setTokens()` returns, or `resetTokens(scope)`,
 * to undo one sooner.
 *
 * Events (on `document`): `fw:tokenschange` { scope } — `scope` is absent
 * when every scope changed (a reset or a restore).
 */
import { DERIVED, type TokenName } from './_tokenData.js';

/** A token to override: a known name (autocompletes), a bare custom name, or a full `--fw-*` / `--custom` property. */
export type TokenKey = TokenName | (string & {});

/** Token name → CSS value. Bare names (`primary`) and full names (`--fw-primary`) both work. */
export type TokenOverrides = Partial<Record<TokenName, string>> & Record<string, string>;

/** Split form: set different values per theme instead of both at once. */
export interface TokenThemeOverrides {
  light?: TokenOverrides;
  dark?: TokenOverrides;
}

export interface SetTokensOptions {
  /** A CSS selector to theme a subtree instead of the whole page. Default `:root`. */
  scope?: string;
  /** Save this scope to localStorage so it applies on every page and reload. Default `false`. */
  persist?: boolean;
}

export interface TokensChangeDetail {
  scope?: string;
}

const TOKEN_PREFIX = '--fw-';
const STYLE_ATTR = 'data-fw-tokens';
const STORE_TOKENS = 'fw-tokens';
const STORE_CSS = 'fw-tokens-css';
const EVENT = 'fw:tokenschange';
const ROOT = ':root';

type Theme = 'light' | 'dark';
type Flat = Record<string, string>;
interface ScopeTokens {
  light: Flat;
  dark: Flat;
}
type Layer = Map<string, ScopeTokens>;

// Two layers, rendered in this order so equal-specificity rules resolve
// persisted → page: `saved` is what goes to localStorage, `live` is this page only.
const saved: Layer = new Map();
const live: Layer = new Map();
let hydrated = false;
let scopeSeq = 0;

// Declarative hooks that applied non-persisted tokens, so they can be undone
// when their element leaves the page. `swept` remembers elements that were
// undone that way, so putting the same node back re-applies its hook.
interface Hook {
  scope: string;
  undo: () => void;
}
const hooks = new Map<Element, Hook>();
const swept = new WeakSet<Element>();

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeTokenName(name: string): string {
  return name.startsWith('--') ? name : `${TOKEN_PREFIX}${name}`;
}

/** `--fw-primary` → `primary`; anything else (a custom property) is returned as-is. */
function bareName(name: string): string {
  return name.startsWith(TOKEN_PREFIX) ? name.slice(TOKEN_PREFIX.length) : name;
}

function warn(message: string): void {
  console.warn(`fernwell: ${message}`);
}

/** Is this a selector the browser accepts? Guards the rule we build from it. */
function validScope(scope: string): boolean {
  try {
    document.querySelector(scope);
    return true;
  } catch {
    return false;
  }
}

/**
 * Are every `(` and quote in this value closed? An unclosed one is not a
 * syntax error CSS recovers from at `;` — it swallows the rules that follow.
 */
function balanced(value: string): boolean {
  let depth = 0;
  let quote = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\') i++;
    else if (quote) {
      if (c === quote) quote = '';
      else if (c === '\n') return false;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')' && --depth < 0) return false;
  }
  return depth === 0 && !quote;
}

/** Keep only `name → string` pairs that can't break out of a declaration; names are normalised. */
function sanitize(tokens: unknown): Flat {
  const out: Flat = {};
  if (tokens === null || typeof tokens !== 'object') return out;
  for (const [name, value] of Object.entries(tokens)) {
    if (!/^(--)?[\w-]+$/.test(name)) {
      warn(`ignoring token with invalid name "${name}"`);
    } else if (typeof value !== 'string' || /[{};]|\/\*/.test(value) || !balanced(value)) {
      warn(`ignoring invalid value for token "${name}"`);
    } else {
      out[normalizeTokenName(name)] = value.trim();
    }
  }
  return out;
}

function isThemeSplit(tokens: TokenOverrides | TokenThemeOverrides): tokens is TokenThemeOverrides {
  // A token's own value is always a CSS string — so any object-valued entry
  // means this is the { light, dark } split form, not a flat token map.
  return Object.values(tokens).some((v) => v !== null && typeof v === 'object');
}

/** Split a selector list on its top-level commas — not those inside `:is(a, b)`, `[x="a,b"]` or a string. */
function splitSelectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === '\\') i++;
    else if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts.filter(Boolean);
}

/** The dark-theme selector for `scope`: the scope inside a dark root, or itself marked dark — per list item. */
function darkSelector(scope: string): string {
  if (scope === ROOT) return '[data-theme="dark"]';
  return splitSelectors(scope)
    .map((part) => `[data-theme="dark"] ${part}, ${part}[data-theme="dark"]`)
    .join(', ');
}

function declBlock(tokens: Flat): string {
  return Object.entries(tokens)
    .map(([name, value]) => `${name}:${value};`)
    .join('');
}

/**
 * Derived tokens are declared on :root, and `var()` resolves where it is
 * declared — so a seed overridden on a *scoped* selector would leave every
 * token computed from it (hover, tint, focus ring…) stuck on the root value.
 * Re-declare, at the scope, each derived token that reads an overridden one
 * (directly or through another derived token). Anything the caller set
 * explicitly is left alone.
 */
function derivedAt(overrides: Flat, theme: Theme): Flat {
  const explicit = new Set(Object.keys(overrides).map(bareName));
  const affected = new Set(explicit);
  const out: Flat = {};
  for (let grew = true; grew; ) {
    grew = false;
    for (const d of DERIVED) {
      if (explicit.has(d.name) || `${TOKEN_PREFIX}${d.name}` in out) continue;
      if (d.deps.some((dep) => affected.has(dep))) {
        out[`${TOKEN_PREFIX}${d.name}`] = d[theme];
        affected.add(d.name);
        grew = true;
      }
    }
  }
  return out;
}

function rulesFor(layer: Layer): string[] {
  const rules: string[] = [];
  layer.forEach(({ light, dark }, scope) => {
    const root = scope === ROOT;
    const l = root ? light : { ...derivedAt(light, 'light'), ...light };
    const d = root ? dark : { ...derivedAt(dark, 'dark'), ...dark };
    if (Object.keys(l).length) rules.push(`${scope}{${declBlock(l)}}`);
    if (Object.keys(d).length) {
      rules.push(`${darkSelector(scope)}{${declBlock(d)}}`);
    }
  });
  return rules;
}

function styleEl(create: boolean): HTMLStyleElement | null {
  const existing = document.head.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`);
  if (existing) {
    // A pre-paint snippet inserts this element *ahead of* the consumer's
    // stylesheet; move it to the end so it wins, as documented.
    if (create && existing !== document.head.lastElementChild) document.head.appendChild(existing);
    return existing;
  }
  if (!create) return null;
  const el = document.createElement('style');
  el.setAttribute(STYLE_ATTR, '');
  document.head.appendChild(el);
  return el;
}

/** Write the persisted layer (state + pre-paint CSS) to localStorage, or clear it when empty. */
function persist(): void {
  const s = store();
  if (!s) return;
  try {
    if (saved.size === 0) {
      s.removeItem(STORE_TOKENS);
      s.removeItem(STORE_CSS);
      return;
    }
    const scopes: Record<string, ScopeTokens> = {};
    saved.forEach((entry, scope) => (scopes[scope] = entry));
    s.setItem(STORE_TOKENS, JSON.stringify({ v: 1, scopes }));
    s.setItem(STORE_CSS, rulesFor(saved).join('\n'));
  } catch {
    // Quota exceeded / storage blocked — the overrides still apply for this page.
  }
}

function render(scope?: string): void {
  const rules = [...rulesFor(saved), ...rulesFor(live)];
  if (rules.length === 0) styleEl(false)?.remove();
  else styleEl(true)!.textContent = rules.join('\n');
  document.dispatchEvent(new CustomEvent<TokensChangeDetail>(EVENT, { detail: { scope } }));
}

/** Set `values` on `target`, returning a function that puts back what it replaced. */
function assign(target: Flat, values: Flat): () => void {
  const previous = new Map(Object.keys(values).map((k) => [k, k in target ? target[k] : undefined]));
  Object.assign(target, values);
  return () =>
    previous.forEach((old, k) => {
      // Skip keys a later call has since changed — that call owns them now.
      if (target[k] !== values[k]) return;
      if (old === undefined) delete target[k];
      else target[k] = old;
    });
}

/**
 * Override Fernwell design tokens at runtime — every derived token (hovers,
 * tints, focus ring, glows) follows automatically, in both themes:
 *
 *   tokens.setTokens({ primary: '#2266ff' });
 *
 * Pass `{ light, dark }` to set different values per theme, `scope` to theme
 * a subtree instead of the whole page, and `persist` to keep the scope for
 * every page of the app:
 *
 *   tokens.setTokens({ light: { primary: '#2266ff' }, dark: { primary: '#5c9dff' } });
 *   tokens.setTokens({ secondary: '#a33' }, { scope: '.tenant-acme' });
 *   tokens.setTokens({ primary: '#2266ff' }, { persist: true });
 *
 * Calls accumulate (merge into whatever overrides are already set for that
 * scope) — call `resetTokens()` to clear them. The returned function undoes
 * just this call, e.g. when a route unmounts; call it in reverse order if
 * several calls touched the same token.
 */
export function setTokens(tokens: TokenOverrides | TokenThemeOverrides, opts: SetTokensOptions = {}): () => void {
  const scope = opts.scope ?? ROOT;
  if (!validScope(scope)) {
    warn(`ignoring tokens for invalid scope "${scope}"`);
    return () => {};
  }
  if (!hydrated) load();

  let light: Flat;
  let dark: Flat;
  if (isThemeSplit(tokens)) {
    light = sanitize(tokens.light);
    dark = sanitize(tokens.dark);
  } else {
    light = sanitize(tokens);
    dark = { ...light };
  }

  const layer = opts.persist ? saved : live;
  const entry = layer.get(scope) ?? { light: {}, dark: {} };
  const undoLight = assign(entry.light, light);
  const undoDark = assign(entry.dark, dark);
  layer.set(scope, entry);
  if (opts.persist) persist();
  render(scope);

  let done = false;
  return () => {
    if (done) return;
    done = true;
    undoLight();
    undoDark();
    if (!Object.keys(entry.light).length && !Object.keys(entry.dark).length && layer.get(scope) === entry) {
      layer.delete(scope);
    }
    if (layer === saved) persist();
    render(scope);
  };
}

/**
 * Clear runtime token overrides — for one `scope`, or every scope if
 * omitted. Persisted overrides are removed from localStorage too.
 */
export function resetTokens(scope?: string): void {
  if (!hydrated) load();
  hooks.forEach((hook, el) => {
    if (!scope || hook.scope === scope) hooks.delete(el);
  });
  const hadSaved = scope ? saved.delete(scope) : saved.size > 0;
  if (scope) live.delete(scope);
  else {
    saved.clear();
    live.clear();
  }
  if (hadSaved) persist();
  render(scope);
}

/**
 * Reload persisted overrides from localStorage, replacing whatever persisted
 * scopes are in memory. `init()` does this once for you; call it yourself
 * only if something else rewrote storage.
 */
export function restoreTokens(): void {
  load();
  render();
}

/** Read persisted overrides into `saved` without rendering — callers render once they've made their own changes. */
function load(): void {
  hydrated = true;
  saved.clear();
  let parsed: unknown = null;
  try {
    const raw = store()?.getItem(STORE_TOKENS);
    if (raw) parsed = JSON.parse(raw);
  } catch {
    // Malformed JSON — treat as nothing persisted.
  }
  const scopes = (parsed as { v?: unknown; scopes?: Record<string, Partial<ScopeTokens>> } | null)?.scopes;
  if ((parsed as { v?: unknown } | null)?.v === 1 && scopes && typeof scopes === 'object') {
    for (const [scope, entry] of Object.entries(scopes)) {
      if (!validScope(scope)) continue;
      const light = sanitize(entry?.light);
      const dark = sanitize(entry?.dark);
      if (Object.keys(light).length || Object.keys(dark).length) saved.set(scope, { light, dark });
    }
  }
}

/** The live, resolved value of a token (e.g. `getToken('primary')` → `'#ffc145'`), including runtime overrides. */
export function getToken(name: TokenKey, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(normalizeTokenName(name)).trim();
}

function parseJSON(source: string | null | undefined, what: string): TokenOverrides | TokenThemeOverrides | null {
  try {
    const value: unknown = JSON.parse(source ?? '');
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) return value as TokenOverrides;
  } catch {
    // fall through to the warning
  }
  warn(`${what} must be a JSON object of tokens`);
  return null;
}

/** Undo the hooks whose element has left the page — so route-scoped markup doesn't pile up rules. */
function sweep(): void {
  hooks.forEach((hook, el) => {
    if (el.isConnected) return;
    hooks.delete(el);
    swept.add(el);
    hook.undo();
  });
}

function isBound(el: HTMLElement): boolean {
  return !!el.dataset.fwTokensBound && !swept.has(el);
}

function bind(el: HTMLElement, scope: string, undo: () => void): void {
  el.dataset.fwTokensBound = '1';
  swept.delete(el);
  // A detached root (`init(fragment)`) has nothing to leave yet — don't track it.
  if (el.isConnected) hooks.set(el, { scope, undo });
}

/**
 * Restore persisted overrides (once), then apply every declarative hook
 * under `root` — `<script type="application/json" data-fw-theme-tokens>` and
 * `data-fw-theme-scope="{…}"`. Safe to call again after injecting markup.
 *
 * Bound elements are marked `data-fw-tokens-bound`, not the shared `fwBound`
 * the other enhancers use — a themed element is often also a table, modal or
 * menu root, and must still be picked up by that component's own `init()`.
 *
 * A hook that isn't persisted is undone on the next `init()` after its element
 * has been removed from the page, so route-scoped markup doesn't accumulate
 * rules. (`data-fw-persist` hooks are app-wide and stay until `resetTokens()`.)
 */
export function init(root: ParentNode = document): void {
  if (!hydrated) restoreTokens();
  sweep();

  root.querySelectorAll<HTMLElement>('script[type="application/json"][data-fw-theme-tokens]').forEach((el) => {
    if (isBound(el)) return;
    const tokens = parseJSON(el.textContent, 'data-fw-theme-tokens');
    el.dataset.fwTokensBound = '1';
    if (!tokens) return;
    const persist = el.hasAttribute('data-fw-persist');
    const scope = el.dataset.fwScope ?? ROOT;
    const undo = setTokens(tokens, { scope, persist });
    if (!persist) bind(el, scope, undo);
  });

  root.querySelectorAll<HTMLElement>('[data-fw-theme-scope]').forEach((el) => {
    if (isBound(el)) return;
    const tokens = parseJSON(el.getAttribute('data-fw-theme-scope'), 'data-fw-theme-scope');
    el.dataset.fwTokensBound = '1';
    if (!tokens) return;
    const id = el.getAttribute('data-fw-scope-id') ?? `fw-s${++scopeSeq}`;
    el.setAttribute('data-fw-scope-id', id);
    const scope = `[data-fw-scope-id="${id}"]`;
    bind(el, scope, setTokens(tokens, { scope }));
  });
}
