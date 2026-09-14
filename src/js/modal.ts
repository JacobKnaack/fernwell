/**
 * Modal & drawer overlays.
 *
 *   <button data-fw-open-modal="confirm">…</button>
 *   <div class="fw-modal-overlay" id="confirm" role="dialog" aria-modal="true"><div class="fw-modal">… <button data-fw-close-modal>Cancel</button></div></div>
 *
 *   <button data-fw-open-drawer="details">…</button>
 *   <div class="fw-drawer-overlay" data-fw-drawer-overlay="details"></div>
 *   <aside class="fw-drawer" id="details" role="dialog" aria-modal="true">… <button data-fw-close-drawer>×</button></aside>
 *
 * Closes on backdrop click (guarded — a text-selection drag that ends on the
 * backdrop does NOT close it), on Escape, and returns focus to the opener.
 */
const OPEN = 'is-open';
const LOCK = 'fw-scroll-lock';
const openStack: HTMLElement[] = [];
const openers = new WeakMap<HTMLElement, HTMLElement | null>();

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function resolve(target: string | HTMLElement): HTMLElement | null {
  return typeof target === 'string' ? document.getElementById(target) : target;
}

/** The backdrop element paired with a drawer (via `data-fw-drawer-overlay="<id>"`), if any. */
function backdropFor(el: HTMLElement): HTMLElement | null {
  if (el.classList.contains('fw-modal-overlay')) return el;
  const explicit = el.id ? document.querySelector<HTMLElement>(`[data-fw-drawer-overlay="${el.id}"]`) : null;
  if (explicit) return explicit;
  const prev = el.previousElementSibling;
  return prev instanceof HTMLElement && prev.classList.contains('fw-drawer-overlay') ? prev : null;
}

export function open(target: string | HTMLElement, opener: HTMLElement | null = (document.activeElement as HTMLElement) ?? null): void {
  const el = resolve(target);
  if (!el || el.classList.contains(OPEN)) return;
  el.classList.add(OPEN);
  backdropFor(el)?.classList.add(OPEN);
  openers.set(el, opener);
  openStack.push(el);
  document.body.classList.add(LOCK);
  el.dispatchEvent(new CustomEvent('fw:open', { bubbles: true }));
  // Focus the first control inside; fall back to the panel itself.
  const first = el.querySelector<HTMLElement>(FOCUSABLE);
  if (first) first.focus({ preventScroll: true });
  else {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

export function close(target: string | HTMLElement): void {
  const el = resolve(target);
  if (!el || !el.classList.contains(OPEN)) return;
  el.classList.remove(OPEN);
  backdropFor(el)?.classList.remove(OPEN);
  const i = openStack.indexOf(el);
  if (i > -1) openStack.splice(i, 1);
  if (openStack.length === 0) document.body.classList.remove(LOCK);
  el.dispatchEvent(new CustomEvent('fw:close', { bubbles: true }));
  openers.get(el)?.focus?.({ preventScroll: true });
  openers.delete(el);
}

export function toggle(target: string | HTMLElement): void {
  const el = resolve(target);
  if (el) (el.classList.contains(OPEN) ? close : open)(el);
}

/**
 * Click-outside-to-close, guarded against a classic false positive: a
 * browser's `click` fires on the nearest common ancestor of mousedown and
 * mouseup. A drag that starts inside the panel and ends on the backdrop has
 * the overlay as that ancestor, so a naive `e.target === overlay` check would
 * close the modal mid-selection. Close only when BOTH landed on the backdrop.
 */
export function bindOutsideClickToClose(backdrop: HTMLElement, onClose: () => void): void {
  let downOnBackdrop = false;
  backdrop.addEventListener('mousedown', (e) => {
    downOnBackdrop = e.target === backdrop;
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && downOnBackdrop) onClose();
  });
}

let keyBound = false;

/** Wire every trigger, overlay and close button under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-open-modal], [data-fw-open-drawer]').forEach((btn) => {
    if (btn.dataset.fwBound) return;
    btn.dataset.fwBound = '1';
    const id = btn.dataset.fwOpenModal ?? btn.dataset.fwOpenDrawer ?? '';
    btn.addEventListener('click', () => open(id, btn));
  });

  root.querySelectorAll<HTMLElement>('.fw-modal-overlay').forEach((overlay) => {
    if (overlay.dataset.fwBound) return;
    overlay.dataset.fwBound = '1';
    bindOutsideClickToClose(overlay, () => close(overlay));
    overlay.querySelectorAll<HTMLElement>('[data-fw-close-modal]').forEach((btn) =>
      btn.addEventListener('click', () => close(overlay)),
    );
  });

  root.querySelectorAll<HTMLElement>('.fw-drawer').forEach((drawer) => {
    if (drawer.dataset.fwBound) return;
    drawer.dataset.fwBound = '1';
    const backdrop = backdropFor(drawer);
    if (backdrop) bindOutsideClickToClose(backdrop, () => close(drawer));
    drawer.querySelectorAll<HTMLElement>('[data-fw-close-drawer]').forEach((btn) =>
      btn.addEventListener('click', () => close(drawer)),
    );
  });

  if (!keyBound) {
    keyBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openStack.length) close(openStack[openStack.length - 1]);
    });
  }
}
