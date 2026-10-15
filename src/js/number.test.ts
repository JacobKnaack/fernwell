import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import * as numberInput from './number';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function stepper(attrs = 'data-fw-number-min="0" data-fw-number-max="10" data-fw-number-step="1" value="3"') {
  document.body.innerHTML = `<input data-fw-number ${attrs} aria-label="Quantity">`;
  numberInput.init();
  const input = document.querySelector('input') as HTMLInputElement;
  const dec = document.querySelector('.fw-number-dec') as HTMLButtonElement;
  const inc = document.querySelector('.fw-number-inc') as HTMLButtonElement;
  return { input, dec, inc };
}

function slider(attrs = 'data-fw-number-min="0" data-fw-number-max="100" data-fw-number-step="5" data-fw-number-unit="%" value="40"') {
  document.body.innerHTML = `<input data-fw-number data-fw-number-mode="slider" ${attrs} aria-label="Volume">`;
  numberInput.init();
  const input = document.querySelector('input') as HTMLInputElement;
  const out = document.querySelector('output') as HTMLOutputElement;
  return { input, out };
}

describe('number — stepper', () => {
  it('wraps the input and adds labelled −/+ buttons on either side', () => {
    const { input, dec, inc } = stepper();
    const wrap = input.closest('.fw-number') as HTMLElement;

    expect(input.type).toBe('number');
    expect(wrap.classList.contains('fw-number-stepper')).toBe(true);
    expect(wrap.firstElementChild).toBe(dec);
    expect(wrap.lastElementChild).toBe(inc);
    expect(dec.getAttribute('aria-label')).toBe('Decrease Quantity');
    expect(inc.getAttribute('aria-label')).toBe('Increase Quantity');
    expect(inc.getAttribute('aria-controls')).toBe(input.id);
    expect(input.dataset.fwBound).toBe('1');
  });

  it('click steps the value by the interval', () => {
    const { input, dec, inc } = stepper('data-fw-number-min="0" data-fw-number-max="10" data-fw-number-step="2" value="4"');

    fireEvent.click(inc);
    expect(input.value).toBe('6');
    fireEvent.click(dec);
    fireEvent.click(dec);
    expect(input.value).toBe('2');
  });

  it('clamps at the bounds and marks the button aria-disabled without dropping focus', () => {
    const { input, dec, inc } = stepper('data-fw-number-min="0" data-fw-number-max="2" value="1"');

    inc.focus();
    fireEvent.click(inc);
    expect(input.value).toBe('2');
    expect(inc.getAttribute('aria-disabled')).toBe('true');
    expect(inc.disabled).toBe(false);
    expect(document.activeElement).toBe(inc);

    fireEvent.click(inc);
    expect(input.value).toBe('2');

    fireEvent.click(dec);
    fireEvent.click(dec);
    fireEvent.click(dec);
    expect(input.value).toBe('0');
    expect(dec.getAttribute('aria-disabled')).toBe('true');
  });

  it('avoids floating-point drift with fractional steps', () => {
    const { input, inc } = stepper('data-fw-number-step="0.1" value="0.2"');

    fireEvent.click(inc);
    expect(input.value).toBe('0.3');
  });

  it('ArrowUp/Down step by one interval and PageUp/Down by ten', () => {
    const { input } = stepper('data-fw-number-min="0" data-fw-number-max="100" value="50"');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('51');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('49');
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(input.value).toBe('59');
    fireEvent.keyDown(input, { key: 'PageDown' });
    expect(input.value).toBe('49');
  });

  it('starts from the minimum-clamped zero when the field is empty', () => {
    const { input, inc } = stepper('data-fw-number-min="5" data-fw-number-max="10"');

    fireEvent.click(inc);
    expect(input.value).toBe('6');
  });

  it('does nothing while the input is disabled', () => {
    const { input, inc } = stepper('data-fw-number-min="0" data-fw-number-max="10" value="3" disabled');

    expect(inc.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(inc);
    expect(input.value).toBe('3');
  });

  it('holding a button repeats after a delay and stops on pointerup', () => {
    vi.useFakeTimers();
    const { input, inc } = stepper('data-fw-number-min="0" data-fw-number-max="100" value="0"');

    fireEvent.pointerDown(inc);
    expect(input.value).toBe('1');
    vi.advanceTimersByTime(400 + 60 * 3);
    expect(input.value).toBe('4');
    fireEvent.pointerUp(inc);
    vi.advanceTimersByTime(1000);
    expect(input.value).toBe('4');
  });

  it('ignores the click that follows a pointer press (no double step)', () => {
    const { input, inc } = stepper('data-fw-number-min="0" data-fw-number-max="10" value="0"');

    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    fireEvent.click(inc, { detail: 1 });
    expect(input.value).toBe('1');
  });
});

describe('number — slider', () => {
  it('switches the input to type=range and renders a linked, live readout', () => {
    const { input, out } = slider();

    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.step).toBe('5');
    expect(out.getAttribute('for')).toBe(input.id);
    expect(out.textContent).toBe('40%');
    expect(input.getAttribute('aria-valuetext')).toBe('40%');
    expect(input.style.getPropertyValue('--fw-number-fill')).toBe('40%');
  });

  it('updates the readout and fill as the value changes', () => {
    const { input, out } = slider();

    input.value = '75';
    fireEvent.input(input);
    expect(out.textContent).toBe('75%');
    expect(input.style.getPropertyValue('--fw-number-fill')).toBe('75%');
  });

  it('defaults to 0–100 and has no stepper buttons', () => {
    const { input } = slider('value="10"');

    expect(input.max).toBe('100');
    expect(document.querySelector('.fw-number-btn')).toBeNull();
  });
});

describe('number — events & lifecycle', () => {
  it('a programmatic step emits input, change and fw:number-change exactly once', () => {
    const { input, inc } = stepper();
    const seen: string[] = [];
    const details: unknown[] = [];
    input.addEventListener('input', () => seen.push('input'));
    input.addEventListener('change', () => seen.push('change'));
    const onChange = (e: Event): number => details.push((e as CustomEvent).detail);
    document.addEventListener('fw:number-change', onChange);

    fireEvent.click(inc);
    document.removeEventListener('fw:number-change', onChange);

    expect(seen).toEqual(['input', 'change']);
    expect(details).toEqual([{ value: 4, mode: 'stepper' }]);
  });

  it('a user-driven slider input emits fw:number-change once', () => {
    const { input } = slider();
    const handler = vi.fn();
    document.addEventListener('fw:number-change', handler);

    input.value = '60';
    fireEvent.input(input);

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 60, mode: 'slider' });
    document.removeEventListener('fw:number-change', handler);
  });

  it('init() is idempotent', () => {
    const { input } = stepper();
    numberInput.init();

    expect(document.querySelectorAll('.fw-number-btn')).toHaveLength(2);
    expect(input.closest('.fw-number')!.querySelectorAll('input')).toHaveLength(1);
  });

  it('setValue clamps and rounds; destroy() restores the original markup', () => {
    document.body.innerHTML = '<div id="host"><input type="text" data-fw-number></div>';
    const input = document.querySelector('input') as HTMLInputElement;
    const api = numberInput.numberInput(input, { min: 0, max: 5, step: 0.5 });

    api.setValue(99);
    expect(api.getValue()).toBe(5);
    api.setValue(1.26);
    expect(api.getValue()).toBe(1.3);

    api.destroy();
    expect(input.type).toBe('text');
    expect(input.parentElement!.id).toBe('host');
    expect(document.querySelector('.fw-number')).toBeNull();
    expect(input.hasAttribute('min')).toBe(false);
    expect(input.dataset.fwBound).toBeUndefined();
  });

  it('ignores invalid min/max/step attributes', () => {
    const { input, inc } = stepper('data-fw-number-min="abc" data-fw-number-step="-3" value="1"');

    fireEvent.click(inc);
    expect(input.value).toBe('2');
  });
});
