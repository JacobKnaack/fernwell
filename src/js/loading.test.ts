import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { init, resetAll, resetButtonLoading, setButtonLoading } from './loading';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('loading', () => {
  it('setButtonLoading disables the button, marks aria-busy, and swaps in a spinner', () => {
    document.body.innerHTML = '<button>Send</button>';
    const btn = document.querySelector('button') as HTMLButtonElement;

    setButtonLoading(btn, 'Sending…');

    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.classList.contains('fw-btn-loading')).toBe(true);
    expect(btn.querySelector('.fw-spinner')).not.toBeNull();
    expect(btn.textContent).toBe('Sending…');
  });

  it('is a no-op when the button is already loading', () => {
    document.body.innerHTML = '<button>Send</button>';
    const btn = document.querySelector('button') as HTMLButtonElement;
    setButtonLoading(btn, 'Sending…');

    setButtonLoading(btn, 'Different text');

    expect(btn.textContent).toBe('Sending…');
  });

  it('resetButtonLoading restores the original markup and state', () => {
    document.body.innerHTML = '<button><span class="icon"></span>Send</button>';
    const btn = document.querySelector('button') as HTMLButtonElement;
    const originalHtml = btn.innerHTML;
    setButtonLoading(btn);

    resetButtonLoading(btn);

    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.classList.contains('fw-btn-loading')).toBe(false);
    expect(btn.innerHTML).toBe(originalHtml);
  });

  it('resetAll resets every loading button under root', () => {
    document.body.innerHTML = '<button id="a">A</button><button id="b">B</button>';
    const a = document.getElementById('a') as HTMLButtonElement;
    const b = document.getElementById('b') as HTMLButtonElement;
    setButtonLoading(a);
    setButtonLoading(b);

    resetAll();

    expect(a.classList.contains('fw-btn-loading')).toBe(false);
    expect(b.classList.contains('fw-btn-loading')).toBe(false);
  });

  it("init() puts a form's submit button into the loading state on submit", () => {
    document.body.innerHTML = `
      <form data-fw-loading>
        <button type="submit" data-fw-loading-text="Saving…">Save</button>
      </form>
    `;
    init();
    const btn = document.querySelector('button') as HTMLButtonElement;

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(btn.classList.contains('fw-btn-loading')).toBe(true);
    expect(btn.textContent).toBe('Saving…');
  });

  it('resets loading buttons after a bfcache restore (pageshow persisted)', () => {
    document.body.innerHTML = '<button id="a">A</button>';
    const btn = document.getElementById('a') as HTMLButtonElement;
    init(); // ensures the pageshow listener is bound
    setButtonLoading(btn);

    const evt = new Event('pageshow');
    Object.defineProperty(evt, 'persisted', { value: true });
    window.dispatchEvent(evt);

    expect(btn.classList.contains('fw-btn-loading')).toBe(false);
  });
});
