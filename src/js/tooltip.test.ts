import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, getByText } from '@testing-library/dom';
import { tooltip, init, type TooltipInstance } from './tooltip';

let instances: TooltipInstance[] = [];

function makeTrigger(label = 'Copy'): HTMLElement {
  document.body.innerHTML = `<button title="Copy to clipboard">${label}</button>`;
  return getByText(document.body, label);
}

function bubble(): HTMLElement {
  return document.getElementById('fw-tooltip') as HTMLElement;
}

// tooltip.ts keeps module-scoped state (the shared bubble, active trigger,
// last-hidden timestamp) that outlives a single test case — mock a virtual
// clock that jumps to a fresh, far-separated base every test so a previous
// test's `lastHiddenAt` can never fall inside this test's fast-reopen window.
let virtualNow = 0;

beforeEach(() => {
  vi.useFakeTimers();
  virtualNow += 10_000_000;
  vi.spyOn(performance, 'now').mockImplementation(() => virtualNow);
});

function tick(ms: number): void {
  virtualNow += ms;
  vi.advanceTimersByTime(ms);
}

afterEach(() => {
  instances.forEach((i) => i.destroy());
  instances = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('tooltip', () => {
  it('moves title into a data attribute, removes it, and wires aria-describedby', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));

    expect(trigger.hasAttribute('title')).toBe(false);
    expect(trigger.dataset.fwTooltipText).toBe('Copy to clipboard');
    expect(trigger.getAttribute('aria-describedby')).toBe('fw-tooltip');
  });

  it('does not show immediately on mouseenter — waits for the delay', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));

    fireEvent.mouseEnter(trigger);
    expect(bubble()?.classList.contains('is-open')).toBeFalsy();

    tick(400);
    expect(bubble().classList.contains('is-open')).toBe(true);
    expect(bubble().textContent).toBe('Copy to clipboard');
  });

  it('shows instantly on focus, with no delay', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));

    fireEvent.focus(trigger);

    expect(bubble().classList.contains('is-open')).toBe(true);
  });

  it('hides shortly after mouseleave (hide-grace)', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));
    fireEvent.mouseEnter(trigger);
    tick(400);
    expect(bubble().classList.contains('is-open')).toBe(true);

    fireEvent.mouseLeave(trigger);
    expect(bubble().classList.contains('is-open')).toBe(true); // still within the grace window

    tick(100);
    expect(bubble().classList.contains('is-open')).toBe(false);
  });

  it('stays open when the pointer moves onto the bubble itself (WCAG 1.4.13 hoverable)', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));
    fireEvent.mouseEnter(trigger);
    tick(400);

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(bubble());
    tick(1000);

    expect(bubble().classList.contains('is-open')).toBe(true);

    fireEvent.mouseLeave(bubble());
    tick(100);
    expect(bubble().classList.contains('is-open')).toBe(false);
  });

  it('hides immediately on Escape', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));
    fireEvent.focus(trigger);
    expect(bubble().classList.contains('is-open')).toBe(true);

    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(bubble().classList.contains('is-open')).toBe(false);
  });

  it('hides immediately on blur', () => {
    const trigger = makeTrigger();
    instances.push(tooltip(trigger));
    fireEvent.focus(trigger);

    fireEvent.blur(trigger);

    expect(bubble().classList.contains('is-open')).toBe(false);
  });

  it('shows instantly on an adjacent trigger hovered shortly after the last one hides', () => {
    const a = makeTrigger('A');
    const b = document.createElement('button');
    b.title = 'B tip';
    b.textContent = 'B';
    document.body.appendChild(b);
    instances.push(tooltip(a));
    instances.push(tooltip(b));

    fireEvent.mouseEnter(a);
    tick(400);
    expect(bubble().textContent).toBe('Copy to clipboard');

    fireEvent.mouseLeave(a);
    tick(100); // hide-grace elapses, tooltip A hides, lastHiddenAt is stamped
    expect(bubble().classList.contains('is-open')).toBe(false);

    fireEvent.mouseEnter(b);
    // No further tick — well within SKIP_DELAY_WINDOW of the last hide.
    expect(bubble().classList.contains('is-open')).toBe(true);
    expect(bubble().textContent).toBe('B tip');
  });

  it('destroy() restores the title attribute and unbinds', () => {
    const trigger = makeTrigger();
    const instance = tooltip(trigger);

    instance.destroy();

    expect(trigger.getAttribute('title')).toBe('Copy to clipboard');
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.focus(trigger);
    expect(bubble()?.classList.contains('is-open')).toBeFalsy();
  });

  it('init() is idempotent: calling it twice does not double-bind the trigger', () => {
    document.body.innerHTML = '<button title="Copy" data-fw-tooltip>Copy</button>';
    init();
    init();
    const trigger = getByText(document.body, 'Copy');

    fireEvent.focus(trigger);

    expect(bubble().textContent).toBe('Copy');
  });
});
