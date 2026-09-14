/**
 * Nav dropdown — the hamburger toggle in `.fw-nav` (and any other
 * button-controls-panel pair).
 *
 *   <button data-fw-nav-toggle aria-controls="menu" aria-expanded="false">…</button>
 *   <div class="fw-nav-dropdown" id="menu">…</div>
 *
 * Closes on outside click and Escape.
 */
const OPEN = 'is-open';

export function open(toggle: HTMLElement): void {
  const panel = panelFor(toggle);
  if (!panel) return;
  panel.classList.add(OPEN);
  toggle.setAttribute('aria-expanded', 'true');
}

export function close(toggle: HTMLElement): void {
  const panel = panelFor(toggle);
  if (!panel) return;
  panel.classList.remove(OPEN);
  toggle.setAttribute('aria-expanded', 'false');
}

function panelFor(toggle: HTMLElement): HTMLElement | null {
  const id = toggle.getAttribute('aria-controls');
  return id ? document.getElementById(id) : null;
}

export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-nav-toggle]').forEach((toggle) => {
    if (toggle.dataset.fwBound) return;
    toggle.dataset.fwBound = '1';
    const panel = panelFor(toggle);
    if (!panel) return;
    const container = toggle.closest<HTMLElement>('.fw-nav') ?? toggle.parentElement ?? toggle;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      (panel.classList.contains(OPEN) ? close : open)(toggle);
    });
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node) && !panel.contains(e.target as Node)) close(toggle);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close(toggle);
    });
  });
}
