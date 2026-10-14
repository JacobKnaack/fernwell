/**
 * Number input — progressive enhancement over an <input> with two modes.
 *
 * Stepper: [−] [ 3 ] [+]  — buttons on either side step the value by a fixed interval.
 *
 *   <input type="number" data-fw-number data-fw-number-mode="stepper"
 *          data-fw-number-min="0" data-fw-number-max="10" data-fw-number-step="1"
 *          value="3" aria-label="Quantity">
 *
 * Slider: a range input with a live value readout.
 *
 *   <input data-fw-number data-fw-number-mode="slider"
 *          data-fw-number-min="0" data-fw-number-max="100" data-fw-number-step="5"
 *          data-fw-number-unit="%" value="40" aria-label="Volume">
 *
 * The native <input> stays in the DOM and keeps the value, so forms, labels and
 * validation work as usual. Stepper mode adds ArrowUp/Down (±step) and
 * PageUp/Down (±10 steps), and holding a button repeats. Home/End are left to
 * the text caret.
 * The −/+ buttons use `aria-disabled` at the bounds (not `disabled`) so focus
 * isn't dropped when you step onto the limit.
 *
 * Every change dispatches bubbling `input` + `change` events on the <input>
 * (as a native control would) and `fw:number-change` with `{ value, mode }`.
 *
 * Or programmatically: numberInput(input, { mode: 'slider', min: 0, max: 100 })
 */
import { render as renderIcon } from './icon.js';

export type NumberMode = 'stepper' | 'slider';

export interface NumberOptions {
  /** `stepper` (default) or `slider`. */
  mode?: NumberMode;
  min?: number;
  max?: number;
  /** Interval for buttons, arrow keys and the slider. Default 1. */
  step?: number;
  /** Suffix for the slider readout and `aria-valuetext` (e.g. `%`, `px`). */
  unit?: string;
  /** Accessible names for the stepper buttons. */
  decreaseLabel?: string;
  increaseLabel?: string;
  onChange?: (value: number) => void;
}

export interface NumberInstance {
  /** Current value, or `NaN` when a stepper field is empty. */
  getValue(): number;
  /** Clamp, round to the step precision, and emit change events. */
  setValue(value: number): void;
  stepUp(count?: number): void;
  stepDown(count?: number): void;
  destroy(): void;
}

export interface NumberChangeDetail {
  value: number;
  mode: NumberMode;
}

const HOLD_DELAY = 400;
const HOLD_INTERVAL = 60;

let uid = 0;

function parseNum(raw: string | null | undefined): number | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function decimals(n: number | undefined): number {
  if (n === undefined) return 0;
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

export function numberInput(input: HTMLInputElement, opts: NumberOptions = {}): NumberInstance {
  const mode: NumberMode = opts.mode === 'slider' ? 'slider' : 'stepper';
  const slider = mode === 'slider';

  const min = opts.min ?? (slider ? 0 : undefined);
  const max = opts.max ?? (slider ? 100 : undefined);
  const stepRaw = opts.step ?? 1;
  const step = Number.isFinite(stepRaw) && stepRaw > 0 ? stepRaw : 1;
  const unit = opts.unit ?? '';
  const precision = Math.max(decimals(step), decimals(min));

  const originalType = input.type;
  const hadMin = input.getAttribute('min');
  const hadMax = input.getAttribute('max');
  const hadStep = input.getAttribute('step');

  input.type = slider ? 'range' : 'number';
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  input.step = String(step);

  if (!input.id) input.id = `fw-number-${++uid}`;

  const existing = input.closest<HTMLElement>('.fw-number');
  const wrap = existing ?? wrapInput(input);
  const createdWrap = !existing;
  wrap.classList.add(slider ? 'fw-number-slider' : 'fw-number-stepper');
  input.classList.add('fw-number-input');

  const clamp = (v: number): number => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  const round = (v: number): number => Number(v.toFixed(precision));
  const read = (): number => (input.value.trim() === '' ? NaN : Number(input.value));

  let dec: HTMLButtonElement | undefined;
  let inc: HTMLButtonElement | undefined;
  let output: HTMLOutputElement | undefined;

  if (slider) {
    output = document.createElement('output');
    output.className = 'fw-number-value';
    output.setAttribute('for', input.id);
    wrap.appendChild(output);
  } else {
    const label = input.getAttribute('aria-label');
    dec = makeButton('dec', renderIcon('minus'), opts.decreaseLabel ?? (label ? `Decrease ${label}` : 'Decrease'));
    inc = makeButton('inc', renderIcon('add'), opts.increaseLabel ?? (label ? `Increase ${label}` : 'Increase'));
    dec.setAttribute('aria-controls', input.id);
    inc.setAttribute('aria-controls', input.id);
    wrap.insertBefore(dec, input);
    wrap.appendChild(inc);
  }

  function makeButton(kind: 'dec' | 'inc', icon: string, label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `fw-number-btn fw-number-${kind}`;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = `<span class="fw-icon" aria-hidden="true">${icon}</span>`;
    return btn;
  }

  /** Reflect the current value in the readout, slider fill and button states. */
  function sync(): void {
    const v = read();
    if (slider && output) {
      const text = Number.isFinite(v) ? `${v}${unit}` : '';
      output.textContent = text;
      input.setAttribute('aria-valuetext', text);
      const span = (max ?? 100) - (min ?? 0);
      const pct = Number.isFinite(v) && span > 0 ? ((v - (min ?? 0)) / span) * 100 : 0;
      input.style.setProperty('--fw-number-fill', `${Math.min(100, Math.max(0, pct))}%`);
    }
    if (dec && inc) {
      const cur = Number.isFinite(v) ? v : undefined;
      dec.setAttribute('aria-disabled', String(input.disabled || (cur !== undefined && min !== undefined && cur <= min)));
      inc.setAttribute('aria-disabled', String(input.disabled || (cur !== undefined && max !== undefined && cur >= max)));
    }
  }

  function isOff(btn: HTMLButtonElement): boolean {
    return btn.getAttribute('aria-disabled') === 'true';
  }

  function setValue(next: number): void {
    if (!Number.isFinite(next)) return;
    const value = round(clamp(next));
    if (value === read()) return;
    input.value = String(value);
    // Native-style events; our own `input` listener below does the sync and
    // emits fw:number-change, so each change is reported exactly once.
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function stepBy(count: number): void {
    if (input.disabled || input.readOnly) return;
    const cur = read();
    setValue((Number.isFinite(cur) ? cur : clamp(0)) + count * step);
  }

  const onInput = (): void => {
    sync();
    const value = read();
    wrap.dispatchEvent(
      new CustomEvent<NumberChangeDetail>('fw:number-change', { bubbles: true, detail: { value, mode } }),
    );
    opts.onChange?.(value);
  };

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let handled = true;
    switch (e.key) {
      case 'ArrowUp':
        stepBy(1);
        break;
      case 'ArrowDown':
        stepBy(-1);
        break;
      case 'PageUp':
        stepBy(10);
        break;
      case 'PageDown':
        stepBy(-10);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  // Hold-to-repeat. The first step fires on pointerdown, so the follow-up
  // click from a real pointer (detail > 0) is ignored; keyboard activation of
  // a button (Enter/Space → detail 0) steps through the click handler.
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let holdRepeat: ReturnType<typeof setInterval> | undefined;

  const stopHold = (): void => {
    clearTimeout(holdTimer);
    clearInterval(holdRepeat);
    holdTimer = holdRepeat = undefined;
  };

  const direction = (btn: HTMLButtonElement): number => (btn === dec ? -1 : 1);

  const onPointerdown = (e: Event): void => {
    const btn = e.currentTarget as HTMLButtonElement;
    if ((e as PointerEvent).button > 0 || isOff(btn)) return;
    const dir = direction(btn);
    stepBy(dir);
    stopHold();
    holdTimer = setTimeout(() => {
      holdRepeat = setInterval(() => {
        if (isOff(btn)) return stopHold();
        stepBy(dir);
      }, HOLD_INTERVAL);
    }, HOLD_DELAY);
  };

  const onBtnClick = (e: MouseEvent): void => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (e.detail !== 0 || isOff(btn)) return;
    stepBy(direction(btn));
  };

  input.addEventListener('input', onInput);
  if (!slider) {
    input.addEventListener('keydown', onKeydown);
    for (const btn of [dec, inc]) {
      if (!btn) continue;
      btn.addEventListener('pointerdown', onPointerdown);
      btn.addEventListener('pointerup', stopHold);
      btn.addEventListener('pointerleave', stopHold);
      btn.addEventListener('pointercancel', stopHold);
      btn.addEventListener('click', onBtnClick);
    }
  }

  sync();

  return {
    getValue: read,
    setValue,
    stepUp: (count = 1) => stepBy(count),
    stepDown: (count = 1) => stepBy(-count),
    destroy() {
      stopHold();
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKeydown);
      dec?.remove();
      inc?.remove();
      output?.remove();
      input.style.removeProperty('--fw-number-fill');
      input.removeAttribute('aria-valuetext');
      input.classList.remove('fw-number-input');
      wrap.classList.remove('fw-number-slider', 'fw-number-stepper');
      input.type = originalType;
      restore(input, 'min', hadMin);
      restore(input, 'max', hadMax);
      restore(input, 'step', hadStep);
      if (createdWrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(input, wrap);
        wrap.remove();
      }
      delete input.dataset.fwBound;
    },
  };
}

function restore(el: HTMLElement, attr: string, value: string | null): void {
  if (value === null) el.removeAttribute(attr);
  else el.setAttribute(attr, value);
}

function wrapInput(input: HTMLInputElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'fw-number';
  input.parentNode?.insertBefore(wrap, input);
  wrap.appendChild(input);
  return wrap;
}

/** Enhance every `[data-fw-number]` input under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>('input[data-fw-number]').forEach((input) => {
    if (input.dataset.fwBound) return;
    input.dataset.fwBound = '1';
    const d = input.dataset;
    numberInput(input, {
      mode: d.fwNumberMode === 'slider' ? 'slider' : 'stepper',
      min: parseNum(d.fwNumberMin ?? input.getAttribute('min')),
      max: parseNum(d.fwNumberMax ?? input.getAttribute('max')),
      step: parseNum(d.fwNumberStep ?? input.getAttribute('step')),
      unit: d.fwNumberUnit,
    });
  });
}
