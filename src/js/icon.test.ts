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

  it('leaves size and stroke untouched when no attributes are given', () => {
    document.body.innerHTML = '<span data-fw-icon="check"></span>';
    icon.init();

    const el = document.querySelector('[data-fw-icon="check"]') as HTMLElement;
    expect(el.className).toBe('fw-icon');
    expect(el.style.getPropertyValue('--fw-icon-stroke')).toBe('');
  });

  it('data-fw-icon-size adds the matching size class', () => {
    document.body.innerHTML = '<span data-fw-icon="check" data-fw-icon-size="lg"></span>';
    icon.init();

    const el = document.querySelector('[data-fw-icon="check"]') as HTMLElement;
    expect(el.classList.contains('fw-icon-lg')).toBe(true);
  });

  it('data-fw-icon-stroke accepts a named weight or a number', () => {
    document.body.innerHTML =
      '<span id="a" data-fw-icon="check" data-fw-icon-stroke="bold"></span>' +
      '<span id="b" data-fw-icon="check" data-fw-icon-stroke="1.8"></span>';
    icon.init();

    expect(document.getElementById('a')!.classList.contains('fw-icon-stroke-bold')).toBe(true);
    expect(document.getElementById('b')!.style.getPropertyValue('--fw-icon-stroke')).toBe('1.8');
  });

  it('warns and ignores an unknown size or stroke', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<span data-fw-icon="check" data-fw-icon-size="huge" data-fw-icon-stroke="-2"></span>';

    icon.init();

    const el = document.querySelector('[data-fw-icon="check"]') as HTMLElement;
    expect(el.className).toBe('fw-icon');
    expect(el.style.getPropertyValue('--fw-icon-stroke')).toBe('');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
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
