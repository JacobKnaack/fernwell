/**
 * Tooltip — a short hover/focus annotation, anchored to its trigger.
 *
 *   <button type="button" class="fw-icon-btn" title="Copy to clipboard" data-fw-tooltip>
 *     <span data-fw-icon="copy" aria-hidden="true"></span>
 *   </button>
 *
 * The `title` attribute is the content source — it's moved into
 * `dataset.fwTooltipText` and removed on init (same detach-and-mirror trick
 * combobox.ts uses for the `list` attribute), which gives a real no-JS
 * fallback (the native OS tooltip) and stops the two tooltips firing at once.
 *
 * Optional trigger attributes: `data-fw-tooltip-placement` (default "top";
 * also accepts "bottom" | "left" | "right", or a corner variant —
 * "top-left" | "top-right" | "bottom-left" | "bottom-right" — that leans the
 * bubble toward that corner instead of centering it, for triggers near a
 * layout edge), `data-fw-tooltip-offset` (px, default 6),
 * `data-fw-tooltip-delay` (ms, default 400).
 *
 * The bubble is centered on the trigger by default so the arrow (drawn at
 * `computePosition`'s returned `arrowOffset`) always points at the trigger's
 * midpoint — including when a corner placement or a viewport-edge clamp
 * shifts the bubble off-center.
 *
 * Only one tooltip bubble exists for the whole page (a lazily-created
 * singleton, same pattern as toast.ts) — a second trigger's hover pre-empts
 * the first. Acceptable for a short annotation; not meant for concurrent
 * multi-tooltip UIs.
 *
 * WCAG 2.1 SC 1.4.13 requires hover/focus-revealed content to be dismissible,
 * *hoverable* (the pointer can move onto it without it disappearing) and
 * persistent. `pointer-events: none` on the bubble would fail "hoverable"
 * outright — the bubble couldn't receive a hover at all — so this
 * deliberately does NOT set it while open. Instead the bubble gets its own
 * mouseenter/mouseleave, and a short cancelable hide-grace timer covers the
 * gap while the pointer travels from trigger to bubble.
 */
import { computePosition, type Placement } from './_position';

const SHOW_DELAY_DEFAULT = 400;
const SKIP_DELAY_WINDOW = 300; // ms — adjacent-trigger instant-reopen window
const HIDE_GRACE = 100; // ms — covers the trigger→bubble pointer transit gap

export interface TooltipOptions {
  placement?: Placement;
  offset?: number;
  delay?: number;
}

export interface TooltipInstance {
  show(): void;
  hide(): void;
  destroy(): void;
}

interface ResolvedOptions {
  placement: Placement;
  offset: number;
  delay: number;
}

const optsByTrigger = new WeakMap<HTMLElement, ResolvedOptions>();

let bubble: HTMLElement | null = null;
let activeTrigger: HTMLElement | null = null;
let showTimer = 0;
let hideTimer = 0;
let repositionRaf = 0;
let lastHiddenAt = 0;

function ensureBubble(): HTMLElement {
  if (bubble && bubble.isConnected) return bubble;
  const el = document.createElement('div');
  el.className = 'fw-tooltip';
  el.id = 'fw-tooltip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  el.addEventListener('mouseenter', cancelHide);
  el.addEventListener('mouseleave', () => requestHide());
  bubble = el;
  return el;
}

function cancelHide(): void {
  clearTimeout(hideTimer);
}

function reposition(): void {
  if (!activeTrigger || !bubble) return;
  const opts = optsByTrigger.get(activeTrigger);
  if (!opts) return;
  const r = computePosition(activeTrigger, bubble, { placement: opts.placement, offset: opts.offset });
  bubble.style.top = `${r.top}px`;
  bubble.style.left = `${r.left}px`;
  bubble.style.setProperty('--fw-tooltip-arrow-pos', `${r.arrowOffset}px`);
  bubble.setAttribute('data-placement', r.placement);
}

function scheduleReposition(): void {
  cancelAnimationFrame(repositionRaf);
  repositionRaf = requestAnimationFrame(reposition);
}

function showNow(trigger: HTMLElement): void {
  clearTimeout(showTimer);
  cancelHide();
  const opts = optsByTrigger.get(trigger);
  if (!opts) return;
  activeTrigger = trigger;
  const el = ensureBubble();
  el.textContent = trigger.dataset.fwTooltipText ?? '';
  reposition();
  el.classList.add('is-open');
  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);
}

function hideNow(): void {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  if (bubble) bubble.classList.remove('is-open');
  window.removeEventListener('scroll', scheduleReposition, true);
  window.removeEventListener('resize', scheduleReposition);
  cancelAnimationFrame(repositionRaf);
  if (activeTrigger) lastHiddenAt = performance.now();
  activeTrigger = null;
}

function requestShow(trigger: HTMLElement, instant: boolean): void {
  clearTimeout(hideTimer);
  clearTimeout(showTimer);
  const opts = optsByTrigger.get(trigger);
  if (!opts) return;
  if (instant || performance.now() - lastHiddenAt < SKIP_DELAY_WINDOW) {
    showNow(trigger);
  } else {
    showTimer = window.setTimeout(() => showNow(trigger), opts.delay);
  }
}

function requestHide(): void {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hideNow, HIDE_GRACE);
}

export function tooltip(trigger: HTMLElement, opts: TooltipOptions = {}): TooltipInstance {
  const resolved: ResolvedOptions = {
    placement: opts.placement ?? 'top',
    offset: opts.offset ?? 6,
    delay: opts.delay ?? SHOW_DELAY_DEFAULT,
  };
  optsByTrigger.set(trigger, resolved);

  const title = trigger.getAttribute('title');
  if (title !== null) {
    trigger.dataset.fwTooltipText = title;
    trigger.removeAttribute('title');
  }
  trigger.setAttribute('aria-describedby', 'fw-tooltip');

  const onMouseenter = () => requestShow(trigger, false);
  const onMouseleave = () => requestHide();
  const onFocus = () => requestShow(trigger, true);
  const onBlur = () => {
    if (activeTrigger === trigger) hideNow();
  };
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && activeTrigger === trigger) hideNow();
  };

  trigger.addEventListener('mouseenter', onMouseenter);
  trigger.addEventListener('mouseleave', onMouseleave);
  trigger.addEventListener('focus', onFocus);
  trigger.addEventListener('blur', onBlur);
  trigger.addEventListener('keydown', onKeydown);

  return {
    show: () => requestShow(trigger, true),
    hide: () => {
      if (activeTrigger === trigger) hideNow();
    },
    destroy() {
      if (activeTrigger === trigger) hideNow();
      trigger.removeEventListener('mouseenter', onMouseenter);
      trigger.removeEventListener('mouseleave', onMouseleave);
      trigger.removeEventListener('focus', onFocus);
      trigger.removeEventListener('blur', onBlur);
      trigger.removeEventListener('keydown', onKeydown);
      trigger.removeAttribute('aria-describedby');
      if (trigger.dataset.fwTooltipText !== undefined) {
        trigger.setAttribute('title', trigger.dataset.fwTooltipText);
        delete trigger.dataset.fwTooltipText;
      }
      optsByTrigger.delete(trigger);
      delete trigger.dataset.fwBound;
    },
  };
}

/** Wire every `[data-fw-tooltip]` under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-tooltip]').forEach((trigger) => {
    if (trigger.dataset.fwBound) return;
    trigger.dataset.fwBound = '1';
    tooltip(trigger, {
      placement: (trigger.dataset.fwTooltipPlacement as Placement) || undefined,
      offset: trigger.dataset.fwTooltipOffset ? Number(trigger.dataset.fwTooltipOffset) : undefined,
      delay: trigger.dataset.fwTooltipDelay ? Number(trigger.dataset.fwTooltipDelay) : undefined,
    });
  });
}
