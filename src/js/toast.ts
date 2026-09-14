/**
 * Toast — a single, reused, bottom-right notice.
 *
 *   toast.show('Invoice sent');
 *   toast.show('That card was declined', { variant: 'error', duration: 6000 });
 */
export type ToastVariant = 'success' | 'error' | 'info' | 'pending';

export interface ToastOptions {
  variant?: ToastVariant;
  /** ms before it hides; 0 keeps it until `hide()` or the next `show()`. */
  duration?: number;
}

let el: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function ensure(): HTMLElement {
  if (el && el.isConnected) return el;
  el = document.createElement('div');
  el.className = 'fw-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<span class="fw-toast-dot" aria-hidden="true"></span><span class="fw-toast-text"></span>';
  document.body.appendChild(el);
  return el;
}

export function show(message: string, { variant = 'success', duration = 4000 }: ToastOptions = {}): HTMLElement {
  const node = ensure();
  node.className = `fw-toast${variant === 'success' ? '' : ` fw-toast-${variant}`}`;
  (node.querySelector('.fw-toast-text') as HTMLElement).textContent = message;
  if (timer) clearTimeout(timer);
  // Re-trigger the transition even if it's already showing.
  node.classList.remove('is-show');
  void node.offsetWidth;
  node.classList.add('is-show');
  if (duration > 0) timer = setTimeout(hide, duration);
  return node;
}

export function hide(): void {
  el?.classList.remove('is-show');
  if (timer) clearTimeout(timer);
  timer = null;
}
