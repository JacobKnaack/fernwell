import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getByRole } from '@testing-library/dom';
import { hide, show } from './toast';

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    hide();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('mounts a single .fw-toast element on the first show()', () => {
    show('Invoice sent');

    const toasts = document.querySelectorAll('.fw-toast');
    expect(toasts).toHaveLength(1);

    const node = getByRole(document.body, 'status');
    expect(node.getAttribute('aria-live')).toBe('polite');
  });

  it('sets the message text and the success (default) variant', () => {
    show('Invoice sent');

    const node = getByRole(document.body, 'status');
    expect(node.classList.contains('fw-toast-error')).toBe(false);
    expect(node.querySelector('.fw-toast-text')?.textContent).toBe('Invoice sent');
  });

  it('applies a variant class for non-success variants', () => {
    show('That card was declined', { variant: 'error' });

    const node = getByRole(document.body, 'status');
    expect(node.classList.contains('fw-toast')).toBe(true);
    expect(node.classList.contains('fw-toast-error')).toBe(true);
  });

  it('adds is-show when shown and removes it on hide()', () => {
    show('Invoice sent');
    const node = getByRole(document.body, 'status');
    expect(node.classList.contains('is-show')).toBe(true);

    hide();
    expect(node.classList.contains('is-show')).toBe(false);
  });

  it('reuses the existing connected element on repeated show() calls', () => {
    show('First');
    const first = getByRole(document.body, 'status');

    show('Second');
    const second = getByRole(document.body, 'status');

    expect(second).toBe(first);
    expect(document.querySelectorAll('.fw-toast')).toHaveLength(1);
  });

  it('auto-hides after the given duration', () => {
    show('Invoice sent', { duration: 1000 });
    const node = getByRole(document.body, 'status');
    expect(node.classList.contains('is-show')).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(node.classList.contains('is-show')).toBe(false);
  });

  it('does not schedule an auto-hide when duration is 0', () => {
    show('Sticky notice', { duration: 0 });
    const node = getByRole(document.body, 'status');

    vi.advanceTimersByTime(60_000);
    expect(node.classList.contains('is-show')).toBe(true);
  });
});
