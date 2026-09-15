import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, getByText } from '@testing-library/dom';
import * as modal from './modal';

function renderModalFixture(): { trigger: HTMLElement; overlay: HTMLElement; closeBtn: HTMLElement } {
  document.body.innerHTML = `
    <button data-fw-open-modal="confirm">Open</button>
    <div class="fw-modal-overlay" id="confirm" role="dialog" aria-modal="true">
      <div class="fw-modal">
        <button data-fw-close-modal>Cancel</button>
      </div>
    </div>
  `;
  return {
    trigger: getByText(document.body, 'Open'),
    overlay: document.getElementById('confirm') as HTMLElement,
    closeBtn: getByText(document.body, 'Cancel'),
  };
}

afterEach(() => {
  // modal.ts keeps module-scoped state (openStack, openers) that outlives a
  // single test case — close anything still open before wiping the fixture.
  document.querySelectorAll('.is-open').forEach((el) => modal.close(el as HTMLElement));
  document.body.innerHTML = '';
});

describe('modal', () => {
  it('opens on trigger click: adds is-open, dispatches fw:open, locks scroll, moves focus in', () => {
    const { trigger, overlay } = renderModalFixture();
    modal.init();

    const onOpen = vi.fn();
    overlay.addEventListener('fw:open', onOpen);

    fireEvent.click(trigger);

    expect(overlay.classList.contains('is-open')).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains('fw-scroll-lock')).toBe(true);
    expect(document.activeElement).toBe(getByText(document.body, 'Cancel'));
  });

  it('closes on close-button click: removes is-open, dispatches fw:close, unlocks scroll, restores focus', () => {
    const { trigger, overlay, closeBtn } = renderModalFixture();
    modal.init();
    fireEvent.click(trigger);

    const onClose = vi.fn();
    overlay.addEventListener('fw:close', onClose);

    fireEvent.click(closeBtn);

    expect(overlay.classList.contains('is-open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains('fw-scroll-lock')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the topmost modal on Escape', () => {
    const { trigger, overlay } = renderModalFixture();
    modal.init();
    fireEvent.click(trigger);
    expect(overlay.classList.contains('is-open')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(overlay.classList.contains('is-open')).toBe(false);
  });

  it('closes on a click that both starts and ends on the backdrop', () => {
    const { trigger, overlay } = renderModalFixture();
    modal.init();
    fireEvent.click(trigger);

    fireEvent.mouseDown(overlay);
    fireEvent.click(overlay);

    expect(overlay.classList.contains('is-open')).toBe(false);
  });

  it('does not close on a drag that starts inside the panel and ends on the backdrop', () => {
    const { trigger, overlay, closeBtn } = renderModalFixture();
    modal.init();
    fireEvent.click(trigger);

    fireEvent.mouseDown(closeBtn);
    fireEvent.click(overlay);

    expect(overlay.classList.contains('is-open')).toBe(true);
  });

  it('init() is idempotent: calling it twice does not double-bind the trigger', () => {
    const { trigger, overlay } = renderModalFixture();
    modal.init();
    modal.init();

    const onOpen = vi.fn();
    overlay.addEventListener('fw:open', onOpen);

    fireEvent.click(trigger);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
