/**
 * Theme — toggles `data-theme="dark"` on <html>, remembers the choice, and
 * falls back to the OS preference.
 *
 *   <button class="fw-btn fw-btn-ghost" data-fw-theme-toggle
 *           data-fw-theme-label-dark="☀️ Light" data-fw-theme-label-light="🌙 Dark">🌙 Dark</button>
 *
 * To avoid a flash of the wrong theme on load, inline this before your CSS:
 *   <script>document.documentElement.dataset.theme=localStorage.getItem('fw-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')</script>
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fw-theme';
const EVENT = 'fw:themechange';

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

/** Apply the stored / system theme and wire every `[data-fw-theme-toggle]` under `root`. */
export function init(root: ParentNode = document): void {
  const stored = store()?.getItem(STORAGE_KEY);
  const current: Theme = stored === 'dark' || stored === 'light' ? stored : get();
  set(current, { persist: false });

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
