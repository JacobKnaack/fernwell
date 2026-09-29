import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as tokens from './tokens';
import * as theme from './theme';

const css = () => document.head.querySelector('style[data-fw-tokens]')?.textContent ?? '';
const stored = () => localStorage.getItem('fw-tokens');
const storedCss = () => localStorage.getItem('fw-tokens-css');

beforeEach(() => {
  localStorage.clear();
  tokens.resetTokens();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  tokens.resetTokens();
  document.head.querySelectorAll('style[data-fw-tokens]').forEach((el) => el.remove());
});

describe('tokens — overrides', () => {
  it('is the same implementation theme.* re-exports', () => {
    expect(theme.setTokens).toBe(tokens.setTokens);
    expect(theme.resetTokens).toBe(tokens.resetTokens);
    expect(theme.getToken).toBe(tokens.getToken);
  });

  it('accepts bare and full token names and merges them', () => {
    tokens.setTokens({ primary: '#111' });
    tokens.setTokens({ '--fw-primary': '#222', secondary: '#333' });
    expect(css()).toBe(':root{--fw-primary:#222;--fw-secondary:#333;}\n[data-theme="dark"]{--fw-primary:#222;--fw-secondary:#333;}');
  });

  it('does not re-declare derived tokens at :root (they already resolve there)', () => {
    tokens.setTokens({ primary: '#2266ff' });
    expect(css()).not.toContain('--fw-primary-hover');
  });

  it('re-declares derived tokens on a scoped override, so they follow the seed', () => {
    tokens.setTokens({ primary: '#2266ff' }, { scope: '.tenant' });
    const out = css();
    expect(out).toContain('.tenant{');
    expect(out).toContain('--fw-primary-hover:color-mix(in srgb, var(--fw-primary), var(--fw-text) 12%);');
    expect(out).toContain('--fw-focus-ring:0 0 0 4px color-mix(in srgb, var(--fw-primary) 25%, transparent);');
    expect(out).toContain('--fw-primary:#2266ff;');
    // Only what actually reads `primary` — not the secondary tints.
    expect(out).not.toContain('--fw-secondary-hover');
  });

  it('uses each theme\'s own formula for scoped derived tokens', () => {
    tokens.setTokens({ primary: '#2266ff' }, { scope: '.tenant' });
    const [light, dark] = css().split('\n');
    expect(light).toContain('--fw-shadow-primary:0 6px 16px color-mix(in srgb, var(--fw-primary) 35%, transparent);');
    expect(dark).toContain('[data-theme="dark"] .tenant, .tenant[data-theme="dark"]{');
    expect(dark).toContain('--fw-shadow-primary:0 6px 16px color-mix(in srgb, var(--fw-primary) 22%, transparent);');
  });

  it('follows derived-of-derived chains and leaves explicit overrides alone', () => {
    tokens.setTokens({ 'text-soft': '#777', 'primary-hover': 'red' }, { scope: '.x' });
    const out = css();
    expect(out).toContain('--fw-scrollbar-thumb:var(--fw-text-soft);');
    expect(out).toContain('--fw-scrollbar-thumb-hover:');
    // The caller set primary-hover; it is declared once, with their value.
    expect(out.match(/--fw-primary-hover:/g)).toHaveLength(2); // light + dark rule
    expect(out).toContain('--fw-primary-hover:red;');
  });

  it('a light-only scoped override emits no dark rule (and so applies in dark too)', () => {
    tokens.setTokens({ light: { primary: '#a00' } }, { scope: '.x' });
    expect(css()).toContain('.x{');
    expect(css()).not.toContain('[data-theme="dark"]');
  });

  it('rejects values that could break out of a declaration, and bad names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tokens.setTokens({ primary: 'red;}body{display:none', secondary: '#333', 'bad name': 'x', text: '/* c */' });
    expect(css()).not.toContain('display:none');
    expect(css()).not.toContain('--fw-text');
    expect(css()).toContain('--fw-secondary:#333;');
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('rejects an invalid scope selector without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const undo = tokens.setTokens({ primary: '#333' }, { scope: 'a{}b' });
    expect(css()).toBe('');
    expect(warn).toHaveBeenCalled();
    expect(() => undo()).not.toThrow();
  });

  it('dispatches fw:tokenschange with the scope, and none on a full reset', () => {
    const seen: Array<string | undefined> = [];
    document.addEventListener('fw:tokenschange', (e) => seen.push((e as CustomEvent).detail.scope));
    tokens.setTokens({ primary: '#333' }, { scope: '.x' });
    tokens.resetTokens();
    expect(seen).toEqual(['.x', undefined]);
  });
});

describe('tokens — the function setTokens() returns', () => {
  it('undoes only that call', () => {
    tokens.setTokens({ primary: '#111' });
    const undo = tokens.setTokens({ primary: '#222', secondary: '#333' });
    undo();
    expect(css()).toContain('--fw-primary:#111;');
    expect(css()).not.toContain('--fw-secondary');
  });

  it('removes the style element when nothing is left, and is idempotent', () => {
    const undo = tokens.setTokens({ primary: '#111' }, { scope: '.x' });
    undo();
    undo();
    expect(document.head.querySelector('style[data-fw-tokens]')).toBeNull();
  });

  it('does not clobber a value a later call has since set', () => {
    const first = tokens.setTokens({ primary: '#111' });
    tokens.setTokens({ primary: '#222' });
    first();
    expect(css()).toContain('--fw-primary:#222;');
  });
});

describe('tokens — persistence', () => {
  it('persist: true saves state and pre-paint CSS to localStorage', () => {
    tokens.setTokens({ primary: '#2266ff' }, { persist: true });
    expect(JSON.parse(stored()!)).toEqual({
      v: 1,
      scopes: { ':root': { light: { '--fw-primary': '#2266ff' }, dark: { '--fw-primary': '#2266ff' } } },
    });
    expect(storedCss()).toBe(':root{--fw-primary:#2266ff;}\n[data-theme="dark"]{--fw-primary:#2266ff;}');
  });

  it('does not persist by default — an override is for this page only', () => {
    tokens.setTokens({ primary: '#2266ff' });
    expect(stored()).toBeNull();
    expect(storedCss()).toBeNull();
  });

  it('keeps page-only overrides out of the persisted copy, but renders both', () => {
    tokens.setTokens({ primary: '#2266ff' }, { persist: true });
    tokens.setTokens({ primary: '#a33', secondary: '#333' });
    expect(css()).toBe(
      [
        ':root{--fw-primary:#2266ff;}',
        '[data-theme="dark"]{--fw-primary:#2266ff;}',
        ':root{--fw-primary:#a33;--fw-secondary:#333;}',
        '[data-theme="dark"]{--fw-primary:#a33;--fw-secondary:#333;}',
      ].join('\n'),
    );
    expect(storedCss()).not.toContain('#a33');
    expect(stored()).not.toContain('secondary');
  });

  it('restoreTokens() applies what a previous page load persisted', () => {
    localStorage.setItem(
      'fw-tokens',
      JSON.stringify({ v: 1, scopes: { '.tenant': { light: { '--fw-primary': '#2266ff' }, dark: {} } } }),
    );
    tokens.restoreTokens();
    expect(css()).toContain('.tenant{');
    expect(css()).toContain('--fw-primary:#2266ff;');
  });

  describe('on a fresh page load', () => {
    // Module state is per page load, so use a fresh copy of the module for these.
    const persisted = () =>
      localStorage.setItem(
        'fw-tokens',
        JSON.stringify({ v: 1, scopes: { ':root': { light: { '--fw-primary': '#2266ff' }, dark: {} } } }),
      );
    const fresh = async () => {
      vi.resetModules();
      return import('./tokens');
    };

    it('init() restores persisted overrides into the pre-paint <style data-fw-tokens> instead of adding a second one', async () => {
      const pre = document.createElement('style');
      pre.setAttribute('data-fw-tokens', '');
      pre.textContent = ':root{--fw-primary:#000;}';
      document.head.appendChild(pre);
      persisted();
      (await fresh()).init();
      expect(document.head.querySelectorAll('style[data-fw-tokens]')).toHaveLength(1);
      expect(css()).toContain('#2266ff');
    });

    it('a setTokens() call before init() does not drop persisted overrides', async () => {
      persisted();
      (await fresh()).setTokens({ secondary: '#333' });
      expect(css()).toContain('--fw-primary:#2266ff;');
      expect(css()).toContain('--fw-secondary:#333;');
    });

    it('init() restores only once — a later init() does not undo an in-memory reset', async () => {
      persisted();
      const t = await fresh();
      t.init();
      t.resetTokens();
      persisted(); // storage has overrides again — a second init() must not re-read them
      t.init();
      expect(css()).toBe('');
    });
  });

  it('ignores malformed, wrong-version and hostile stored data', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('fw-tokens', '{not json');
    tokens.restoreTokens();
    expect(css()).toBe('');

    localStorage.setItem('fw-tokens', JSON.stringify({ v: 2, scopes: { ':root': { light: { primary: '#000' } } } }));
    tokens.restoreTokens();
    expect(css()).toBe('');

    localStorage.setItem(
      'fw-tokens',
      JSON.stringify({ v: 1, scopes: { 'a{}b': { light: { '--fw-primary': '#000' } }, ':root': { light: { '--fw-text': 'x;}b{c:d' } } } }),
    );
    tokens.restoreTokens();
    expect(css()).toBe('');
  });

  it('resetTokens(scope) removes just that scope from storage; resetTokens() removes it all', () => {
    tokens.setTokens({ primary: '#111' }, { persist: true });
    tokens.setTokens({ secondary: '#222' }, { persist: true, scope: '.x' });
    tokens.resetTokens('.x');
    expect(Object.keys(JSON.parse(stored()!).scopes)).toEqual([':root']);
    tokens.resetTokens();
    expect(stored()).toBeNull();
    expect(storedCss()).toBeNull();
  });

  it('undoing a persisted call updates storage', () => {
    const undo = tokens.setTokens({ primary: '#111' }, { persist: true });
    undo();
    expect(stored()).toBeNull();
  });

  it('still applies overrides when localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => tokens.setTokens({ primary: '#2266ff' }, { persist: true })).not.toThrow();
    expect(css()).toContain('--fw-primary:#2266ff;');
    expect(() => tokens.restoreTokens()).not.toThrow();
    expect(() => tokens.resetTokens()).not.toThrow();
  });
});

describe('tokens — declarative hooks', () => {
  it('<script data-fw-theme-tokens> applies a flat map to :root for this page only', () => {
    document.body.innerHTML = '<script type="application/json" data-fw-theme-tokens>{"primary":"#2266ff"}</script>';
    tokens.init();
    expect(css()).toContain(':root{--fw-primary:#2266ff;}');
    expect(stored()).toBeNull();
  });

  it('<script data-fw-theme-tokens> takes the { light, dark } split, data-fw-scope and data-fw-persist', () => {
    document.body.innerHTML = `<script type="application/json" data-fw-theme-tokens data-fw-scope=".tenant" data-fw-persist>
      {"light":{"primary":"#fff"},"dark":{"primary":"#000"}}</script>`;
    tokens.init();
    expect(css()).toContain('.tenant{--fw-primary-hover:');
    expect(css()).toContain('[data-theme="dark"] .tenant, .tenant[data-theme="dark"]{');
    expect(Object.keys(JSON.parse(stored()!).scopes)).toEqual(['.tenant']);
  });

  it('data-fw-theme-scope themes just that element, and is never persisted', () => {
    document.body.innerHTML = `<section data-fw-theme-scope='{"secondary":"#a33"}' id="a"></section><section id="b"></section>`;
    tokens.init();
    const a = document.getElementById('a')!;
    const id = a.getAttribute('data-fw-scope-id')!;
    expect(id).toMatch(/^fw-s\d+$/);
    expect(document.getElementById('b')!.hasAttribute('data-fw-scope-id')).toBe(false);
    expect(css()).toContain(`[data-fw-scope-id="${id}"]{`);
    expect(css()).toContain('--fw-secondary:#a33;');
    expect(css()).toContain('--fw-secondary-hover:');
    expect(stored()).toBeNull();
  });

  it('is idempotent, and picks up markup added later', () => {
    document.body.innerHTML = '<script type="application/json" data-fw-theme-tokens>{"primary":"#111"}</script>';
    tokens.init();
    const once = css();
    tokens.init();
    expect(css()).toBe(once);

    document.body.insertAdjacentHTML('beforeend', `<div data-fw-theme-scope='{"info":"#09f"}'></div>`);
    tokens.init();
    expect(css()).toContain('--fw-info:#09f;');
    expect(css()).toContain('--fw-primary:#111;');
  });

  it('warns and skips a hook whose JSON is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = `<script type="application/json" data-fw-theme-tokens>{oops</script><div data-fw-theme-scope="[1]"></div>`;
    expect(() => tokens.init()).not.toThrow();
    expect(css()).toBe('');
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
