import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import * as menu from './menu';

function renderMenuFixture(): HTMLElement {
  document.body.innerHTML = `
    <nav data-fw-menu>
      <ul class="fw-menu-list">
        <li class="fw-menu-item"><a class="fw-menu-link" href="#">Overview</a></li>
        <li class="fw-menu-item">
          <details class="fw-menu-group">
            <summary class="fw-menu-summary">Billing</summary>
            <ul class="fw-menu-list">
              <li class="fw-menu-item"><a class="fw-menu-link" href="#" aria-current="page">Plans</a></li>
            </ul>
          </details>
        </li>
      </ul>
    </nav>
  `;
  return document.querySelector('[data-fw-menu]') as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('menu', () => {
  it('open()/close()/toggle() set the <details> open state', () => {
    document.body.innerHTML = '<details class="fw-menu-group"><summary>Group</summary></details>';
    const group = document.querySelector('details') as HTMLDetailsElement;

    menu.open(group);
    expect(group.open).toBe(true);

    menu.close(group);
    expect(group.open).toBe(false);

    menu.toggle(group);
    expect(group.open).toBe(true);
  });

  it('init() reveals every ancestor group of the current-page link', () => {
    renderMenuFixture();
    menu.init();

    const group = document.querySelector('.fw-menu-group') as HTMLDetailsElement;
    expect(group.open).toBe(true);
  });

  it('opening a group (via summary click) dispatches a bubbling fw:toggle event', async () => {
    // A fixture with no aria-current link, so init() doesn't auto-reveal (and
    // queue a toggle task of its own) before the click under test.
    document.body.innerHTML = `
      <nav data-fw-menu>
        <details class="fw-menu-group"><summary class="fw-menu-summary">Billing</summary></details>
      </nav>
    `;
    const nav = document.querySelector('[data-fw-menu]') as HTMLElement;
    menu.init();
    const group = document.querySelector('.fw-menu-group') as HTMLDetailsElement;
    const onToggle = vi.fn();
    nav.addEventListener('fw:toggle', onToggle);

    fireEvent.click(group.querySelector('summary') as HTMLElement);

    // The native `toggle` event fires as a queued task, not synchronously
    // with the click that changed `.open` — so wait for it.
    await vi.waitFor(() => expect(onToggle).toHaveBeenCalledTimes(1));
    expect(group.open).toBe(true);
  });

  it('data-fw-menu-exclusive closes sibling groups when one opens', () => {
    document.body.innerHTML = `
      <nav data-fw-menu data-fw-menu-exclusive>
        <details class="fw-menu-group" open><summary class="fw-menu-summary">A</summary></details>
        <details class="fw-menu-group"><summary class="fw-menu-summary">B</summary></details>
      </nav>
    `;
    menu.init();
    const [groupA, groupB] = Array.from(document.querySelectorAll('.fw-menu-group')) as HTMLDetailsElement[];
    expect(groupA.open).toBe(true);

    // Drive this synchronously rather than via a real click: jsdom (unlike
    // real browsers) also queues a spurious native `toggle` task for group A
    // itself the first time any details' toggle task runs at all — because
    // it was parsed with `open` already set — which races groupB's own task
    // and makes a click-driven version of this test order-dependent. `.open`
    // itself flips synchronously in real browsers too, so this still
    // exercises the same capture-phase handler in src/js/menu.ts.
    groupB.open = true;
    groupB.dispatchEvent(new Event('toggle'));

    expect(groupB.open).toBe(true);
    expect(groupA.open).toBe(false);
  });

  it('ArrowDown moves focus to the next visible row', () => {
    const nav = renderMenuFixture();
    menu.init();
    const [link, summary] = Array.from(nav.querySelectorAll<HTMLElement>('.fw-menu-link, .fw-menu-summary'));
    link.focus();

    fireEvent.keyDown(link, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(summary);
  });
});
