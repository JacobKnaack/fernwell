/**
 * Popover — a non-modal floating panel anchored to its trigger.
 *
 *   <button type="button" data-fw-popover-trigger="settings-pop">Settings</button>
 *
 *   <div class="fw-popover" id="settings-pop">
 *     <div class="fw-popover-head">
 *       <h3 class="fw-popover-title">Settings</h3>
 *       <button type="button" class="fw-icon-btn" data-fw-popover-close aria-label="Close">
 *         <span data-fw-icon="close" aria-hidden="true"></span>
 *       </button>
 *     </div>
 *     <div class="fw-popover-body">…</div>
 *   </div>
 *
 * Optional trigger attributes: `data-fw-popover-placement` ("top" | "bottom" |
 * "left" | "right" — centered on the trigger's cross-axis midpoint — or a
 * corner variant "top-left" | "top-right" | "bottom-left" | "bottom-right"
 * that leans the panel toward that corner instead of centering it, e.g. to
 * steer it clear of something else on the page; default "bottom"),
 * `data-fw-popover-offset` (px, default 8).
 *
 * While open, the panel is moved to the end of <body> so its `position: fixed`
 * containing block is always the viewport — not an ancestor with `transform`,
 * `filter` or `contain` (e.g. a card, or another modal) that would otherwise
 * break the positioning math — and moved back to its authored location on close.
 *
 * This is a non-modal dialog (`aria-modal="false"`), so per WAI-ARIA APG it
 * does NOT trap Tab — focus is allowed to move naturally out of the panel.
 * Closing on focus leaving the panel/trigger (`focusout`) does the equivalent
 * job without fighting the surrounding page's tab order.
 *
 * Events (bubbling, from the panel): `fw:open`, `fw:close`.
 */
import { computePosition, bindOutsideDismiss, type Placement } from './_position';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface PopoverOptions {
  placement?: Placement;
  offset?: number;
}

export interface PopoverInstance {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

export function popover(trigger: HTMLElement, panel: HTMLElement, opts: PopoverOptions = {}): PopoverInstance {
  const placement = opts.placement ?? 'bottom';
  const offset = opts.offset ?? 8;

  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', 'false');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.classList.add('fw-popover');

  const originalParent = panel.parentNode as ParentNode;
  const originalNextSibling = panel.nextSibling;

  let isOpen = false;
  let unbindOutside: (() => void) | null = null;
  let raf = 0;

  function reposition(): void {
    const r = computePosition(trigger, panel, { placement, offset });
    panel.style.top = `${r.top}px`;
    panel.style.left = `${r.left}px`;
    panel.setAttribute('data-placement', r.placement);
  }

  function scheduleReposition(): void {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(reposition);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }

  function onFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && (panel.contains(next) || trigger.contains(next))) return;
    // relatedTarget is null for some mouse-driven blurs — re-check on the
    // next tick against document.activeElement instead of trusting it.
    setTimeout(() => {
      if (!isOpen) return;
      const active = document.activeElement;
      // A click on non-focusable panel content (plain text, a heading — not
      // the close button or a link) blurs the previously focused element
      // without moving focus anywhere real: activeElement falls back to
      // <body>. That's not "focus left the popover", so it isn't a dismiss
      // signal — a genuine click outside the popover already closes it via
      // bindOutsideDismiss below.
      if (active === document.body || active === null) return;
      if (!(panel.contains(active) || trigger.contains(active))) close();
    }, 0);
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    if (panel.parentNode !== document.body) document.body.appendChild(panel);
    reposition();
    panel.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');

    const first = panel.querySelector<HTMLElement>(FOCUSABLE);
    if (first) {
      first.focus({ preventScroll: true });
    } else {
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
      panel.focus({ preventScroll: true });
    }

    unbindOutside = bindOutsideDismiss([trigger, panel], close);
    window.addEventListener('scroll', scheduleReposition, true);
    window.addEventListener('resize', scheduleReposition);
    panel.addEventListener('keydown', onKeydown);
    panel.addEventListener('focusout', onFocusOut);
    panel.dispatchEvent(new CustomEvent('fw:open', { bubbles: true }));
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');

    unbindOutside?.();
    unbindOutside = null;
    window.removeEventListener('scroll', scheduleReposition, true);
    window.removeEventListener('resize', scheduleReposition);
    panel.removeEventListener('keydown', onKeydown);
    panel.removeEventListener('focusout', onFocusOut);
    cancelAnimationFrame(raf);

    const stillValid = originalNextSibling === null || originalNextSibling.parentNode === originalParent;
    if (stillValid) originalParent.insertBefore(panel, originalNextSibling);
    else originalParent.appendChild(panel);

    panel.dispatchEvent(new CustomEvent('fw:close', { bubbles: true }));
    trigger.focus({ preventScroll: true });
  }

  function toggle(): void {
    (isOpen ? close : open)();
  }

  const onTriggerClick = () => toggle();
  const closeButtons = Array.from(panel.querySelectorAll<HTMLElement>('[data-fw-popover-close]'));
  const onCloseClick = () => close();

  trigger.addEventListener('click', onTriggerClick);
  closeButtons.forEach((btn) => btn.addEventListener('click', onCloseClick));

  return {
    open,
    close,
    toggle,
    destroy() {
      if (isOpen) close();
      trigger.removeEventListener('click', onTriggerClick);
      closeButtons.forEach((btn) => btn.removeEventListener('click', onCloseClick));
      delete trigger.dataset.fwBound;
    },
  };
}

/** Wire every `[data-fw-popover-trigger]` under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-popover-trigger]').forEach((trigger) => {
    if (trigger.dataset.fwBound) return;
    const id = trigger.dataset.fwPopoverTrigger ?? '';
    const panel = document.getElementById(id);
    if (!panel) {
      console.warn(`fernwell: popover trigger references missing panel #${id}`);
      return;
    }
    trigger.dataset.fwBound = '1';
    popover(trigger, panel, {
      placement: (trigger.dataset.fwPopoverPlacement as Placement) || undefined,
      offset: trigger.dataset.fwPopoverOffset ? Number(trigger.dataset.fwPopoverOffset) : undefined,
    });
  });
}
