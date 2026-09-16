import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, getByText } from '@testing-library/dom';
import * as popoverModule from './popover';

function renderPopoverFixture(): {
  wrap: HTMLElement;
  trigger: HTMLElement;
  panel: HTMLElement;
  closeBtn: HTMLElement;
  outside: HTMLElement;
  content: HTMLElement;
} {
  document.body.innerHTML = `
    <div id="outside">Outside</div>
    <div id="wrap">
      <button data-fw-popover-trigger="settings-pop">Open settings</button>
      <div class="fw-popover" id="settings-pop">
        <div class="fw-popover-head">
          <h3 class="fw-popover-title">Settings</h3>
          <button data-fw-popover-close>Close</button>
        </div>
        <div class="fw-popover-body"><p>Notification preferences live here.</p><a href="#">Link</a></div>
      </div>
    </div>
  `;
  return {
    wrap: document.getElementById('wrap') as HTMLElement,
    trigger: getByText(document.body, 'Open settings'),
    panel: document.getElementById('settings-pop') as HTMLElement,
    closeBtn: getByText(document.body, 'Close'),
    outside: document.getElementById('outside') as HTMLElement,
    content: getByText(document.body, 'Notification preferences live here.'),
  };
}

afterEach(() => {
  // popover.ts registers document-level outside-dismiss listeners per open
  // instance — close anything still open before wiping the fixture so they
  // unbind cleanly instead of leaking across tests.
  document.querySelectorAll('.fw-popover.is-open').forEach((p) => fireEvent.keyDown(p, { key: 'Escape' }));
  document.body.innerHTML = '';
});

describe('popover', () => {
  it('init() sets ARIA attributes on the trigger and panel', () => {
    const { trigger, panel } = renderPopoverFixture();
    popoverModule.init();

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-controls')).toBe('settings-pop');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('false');
  });

  it('opens on trigger click: moves the panel to <body>, adds is-open, dispatches fw:open, focuses first focusable', () => {
    const { trigger, panel } = renderPopoverFixture();
    popoverModule.init();

    const onOpen = vi.fn();
    panel.addEventListener('fw:open', onOpen);

    fireEvent.click(trigger);

    expect(panel.classList.contains('is-open')).toBe(true);
    expect(panel.parentNode).toBe(document.body);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(getByText(document.body, 'Close'));
  });

  it('closes on trigger click (toggle): removes is-open, dispatches fw:close, restores DOM position, returns focus', () => {
    const { wrap, trigger, panel } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    const onClose = vi.fn();
    panel.addEventListener('fw:close', onClose);

    fireEvent.click(trigger);

    expect(panel.classList.contains('is-open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(panel.parentNode).toBe(wrap);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { trigger, panel } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    fireEvent.keyDown(panel, { key: 'Escape' });

    expect(panel.classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a click that both starts and ends outside the trigger and panel', () => {
    const { trigger, panel, outside } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    fireEvent.mouseDown(outside);
    fireEvent.click(outside);

    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('does not close on a drag that starts inside the panel and ends outside', () => {
    const { trigger, panel, closeBtn, outside } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    fireEvent.mouseDown(closeBtn);
    fireEvent.click(outside);

    expect(panel.classList.contains('is-open')).toBe(true);
  });

  it('closes when the close button is clicked', () => {
    const { trigger, panel, closeBtn } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    fireEvent.click(closeBtn);

    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('closes when focus moves outside both the panel and the trigger', async () => {
    const { trigger, panel, outside } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);

    outside.tabIndex = -1;
    outside.focus();
    // The re-check runs on the next tick.
    await new Promise((r) => setTimeout(r, 0));

    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('does not close when clicking non-focusable panel content blurs focus to <body>', async () => {
    // A click on plain text (no href, no tabindex) blurs whatever was
    // focused without moving focus anywhere real — document.activeElement
    // falls back to <body>. That must not be treated as "focus left the
    // popover"; only a real outside click or a genuine focus move to
    // another control should close it.
    const { trigger, panel, closeBtn, content } = renderPopoverFixture();
    popoverModule.init();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(closeBtn);

    closeBtn.blur();
    fireEvent.focusOut(panel, { relatedTarget: null });
    fireEvent.click(content);
    await new Promise((r) => setTimeout(r, 0));

    expect(document.activeElement).toBe(document.body);
    expect(panel.classList.contains('is-open')).toBe(true);
  });

  it('init() is idempotent: calling it twice does not double-bind the trigger', () => {
    const { trigger, panel } = renderPopoverFixture();
    popoverModule.init();
    popoverModule.init();

    const onOpen = vi.fn();
    panel.addEventListener('fw:open', onOpen);

    fireEvent.click(trigger);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
