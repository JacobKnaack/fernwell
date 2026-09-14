/**
 * Loading states.
 *
 *   loading.setButtonLoading(btn, 'Sending…');   // disables, swaps in a spinner
 *   loading.resetButtonLoading(btn);              // restores original markup
 *
 * Or declaratively: any <form data-fw-loading> puts its submit button into the
 * loading state on submit (label from `data-fw-loading-text` on the button).
 */
const LOADING = 'fw-btn-loading';

export function setButtonLoading(btn: HTMLButtonElement | null, loadingText?: string): void {
  if (!btn || btn.classList.contains(LOADING)) return;
  btn.dataset.fwOriginalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.classList.add(LOADING);
  const label = loadingText ?? btn.dataset.fwLoadingText ?? btn.textContent ?? '';
  btn.innerHTML = '<span class="fw-spinner fw-spinner-sm" aria-hidden="true"></span>';
  btn.appendChild(document.createTextNode(label));
}

export function resetButtonLoading(btn: HTMLButtonElement | null): void {
  if (!btn || !btn.classList.contains(LOADING)) return;
  btn.disabled = false;
  btn.removeAttribute('aria-busy');
  btn.classList.remove(LOADING);
  // Restore markup, not just text, so buttons with an icon keep it.
  if (btn.dataset.fwOriginalHtml !== undefined) {
    btn.innerHTML = btn.dataset.fwOriginalHtml;
    delete btn.dataset.fwOriginalHtml;
  }
}

/** Reset every loading button — e.g. after a bfcache restore. */
export function resetAll(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>(`.${LOADING}`).forEach(resetButtonLoading);
}

let pageshowBound = false;

export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLFormElement>('form[data-fw-loading]').forEach((form) => {
    if (form.dataset.fwBound) return;
    form.dataset.fwBound = '1';
    form.addEventListener('submit', () => {
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');
      setButtonLoading(btn);
    });
  });

  // Browsers restore pages from the back-forward cache without re-running JS,
  // so a spinner painted right before navigating away would come back stuck.
  if (!pageshowBound) {
    pageshowBound = true;
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) resetAll();
    });
  }
}
