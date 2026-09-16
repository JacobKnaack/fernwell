import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as theme from './theme';

function stubMatchMedia(matches = false): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-fw-theme-init');
  window.localStorage.clear();
  theme.resetTokens();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('theme', () => {
  it('set() applies data-theme, persists it, and dispatches fw:themechange', () => {
    const onChange = vi.fn();
    document.addEventListener('fw:themechange', onChange);

    theme.set('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('fw-theme')).toBe('dark');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as CustomEvent).detail).toBe('dark');
  });

  it('set() with persist: false does not touch storage', () => {
    theme.set('dark', { persist: false });
    expect(window.localStorage.getItem('fw-theme')).toBeNull();
  });

  it('get() reads the current data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(theme.get()).toBe('dark');
  });

  it('toggle() flips between light and dark', () => {
    theme.set('light');
    expect(theme.toggle()).toBe('dark');
    expect(theme.toggle()).toBe('light');
  });

  it('init() applies the stored theme and syncs [data-fw-theme-toggle] buttons', () => {
    window.localStorage.setItem('fw-theme', 'dark');
    document.body.innerHTML = `
      <button data-fw-theme-toggle
        data-fw-theme-label-dark="Light" data-fw-theme-label-light="Dark">Dark</button>
    `;

    theme.init();

    const btn = document.querySelector('[data-fw-theme-toggle]') as HTMLElement;
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.textContent).toBe('Light');
  });

  it('init() suppresses transitions for the first paint only', async () => {
    theme.init();
    expect(document.documentElement.hasAttribute('data-fw-theme-init')).toBe(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    expect(document.documentElement.hasAttribute('data-fw-theme-init')).toBe(false);
  });

  it('toggle() does not suppress transitions', () => {
    theme.set('light');
    theme.toggle();
    expect(document.documentElement.hasAttribute('data-fw-theme-init')).toBe(false);
  });

  it('clicking a toggle button flips the theme and re-syncs itself', () => {
    document.body.innerHTML = `
      <button data-fw-theme-toggle
        data-fw-theme-label-dark="Light" data-fw-theme-label-light="Dark">Dark</button>
    `;
    theme.init();
    const btn = document.querySelector('[data-fw-theme-toggle]') as HTMLElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    btn.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.textContent).toBe('Light');
  });

  it('setTokens() renders a <style data-fw-tokens> in <head>; resetTokens() removes it', () => {
    theme.setTokens({ primary: '#2266ff' });

    const style = document.head.querySelector('style[data-fw-tokens]');
    expect(style?.textContent).toContain(':root{--fw-primary:#2266ff;}');

    theme.resetTokens();
    expect(document.head.querySelector('style[data-fw-tokens]')).toBeNull();
  });

  it('setTokens() with a light/dark split renders a dark-scoped rule', () => {
    theme.setTokens({ light: { primary: '#fff' }, dark: { primary: '#000' } });

    const style = document.head.querySelector('style[data-fw-tokens]');
    expect(style?.textContent).toContain(':root{--fw-primary:#fff;}');
    expect(style?.textContent).toContain('[data-theme="dark"]{--fw-primary:#000;}');
  });

  it('getToken() reads the resolved custom property value off an element', () => {
    document.documentElement.style.setProperty('--fw-primary', '#123456');
    expect(theme.getToken('primary')).toBe('#123456');
  });
});
