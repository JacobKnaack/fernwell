import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import * as nav from './nav';

function renderNavFixture(): { toggle: HTMLElement; panel: HTMLElement; outside: HTMLElement } {
  document.body.innerHTML = `
    <div class="fw-nav">
      <button data-fw-nav-toggle aria-controls="menu" aria-expanded="false">Menu</button>
    </div>
    <div class="fw-nav-dropdown" id="menu"></div>
    <div id="outside"></div>
  `;
  return {
    toggle: document.querySelector('[data-fw-nav-toggle]') as HTMLElement,
    panel: document.getElementById('menu') as HTMLElement,
    outside: document.getElementById('outside') as HTMLElement,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('nav', () => {
  it('opens the panel on toggle click', () => {
    const { toggle, panel } = renderNavFixture();
    nav.init();

    fireEvent.click(toggle);

    expect(panel.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on a second toggle click', () => {
    const { toggle, panel } = renderNavFixture();
    nav.init();
    fireEvent.click(toggle);

    fireEvent.click(toggle);

    expect(panel.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on outside click', () => {
    const { toggle, panel, outside } = renderNavFixture();
    nav.init();
    fireEvent.click(toggle);

    fireEvent.click(outside);

    expect(panel.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape', () => {
    const { toggle, panel } = renderNavFixture();
    nav.init();
    fireEvent.click(toggle);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(panel.classList.contains('is-open')).toBe(false);
  });
});
