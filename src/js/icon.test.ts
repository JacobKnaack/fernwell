import { afterEach, describe, expect, it, vi } from 'vitest';
import * as icon from './icon';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('icon', () => {
  it('init() injects an <svg> and marks the element bound', () => {
    document.body.innerHTML = '<span data-fw-icon="check"></span>';
    icon.init();

    const el = document.querySelector('[data-fw-icon="check"]') as HTMLElement;
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.classList.contains('fw-icon')).toBe(true);
    expect(el.dataset.fwBound).toBe('1');
  });

  it('init() is idempotent — calling it twice does not re-inject', () => {
    document.body.innerHTML = '<span data-fw-icon="check"></span>';
    icon.init();
    const el = document.querySelector('[data-fw-icon="check"]') as HTMLElement;
    const firstSvg = el.querySelector('svg');

    icon.init();

    expect(el.querySelector('svg')).toBe(firstSvg);
  });

  it('warns and leaves the element empty for an unknown icon name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<span data-fw-icon="not-a-real-icon"></span>';

    icon.init();

    const el = document.querySelector('[data-fw-icon="not-a-real-icon"]') as HTMLElement;
    expect(el.querySelector('svg')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
