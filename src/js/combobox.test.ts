import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { combobox, init, type ComboboxInstance } from './combobox';

let instances: ComboboxInstance[] = [];

function makeInput(): HTMLInputElement {
  document.body.innerHTML = '<input />';
  return document.querySelector('input') as HTMLInputElement;
}

afterEach(() => {
  instances.forEach((i) => i.destroy());
  instances = [];
  document.body.innerHTML = '';
});

describe('combobox', () => {
  it('wraps the input and mounts a listbox with role="listbox"', () => {
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle', 'Spokane'] }));

    expect(input.closest('.fw-combobox')).not.toBeNull();
    expect(input.getAttribute('role')).toBe('combobox');
    const list = document.querySelector('.fw-combobox-list');
    expect(list?.getAttribute('role')).toBe('listbox');
    expect(input.getAttribute('aria-controls')).toBe(list?.id);
  });

  it('opens and renders all options on focus', () => {
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle', 'Spokane', 'Portland'] }));

    fireEvent.focus(input);

    const list = document.querySelector('.fw-combobox-list') as HTMLElement;
    expect(list.classList.contains('is-open')).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(list.querySelectorAll('.fw-combobox-option')).toHaveLength(3);
  });

  it('filters options as the input value changes', () => {
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle', 'Spokane', 'Portland'] }));

    input.value = 'sea';
    fireEvent.input(input);

    const options = document.querySelectorAll('.fw-combobox-option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe('Seattle');
  });

  it('shows the empty state when nothing matches', () => {
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle'], emptyText: 'Nothing found' }));

    input.value = 'zzz';
    fireEvent.input(input);

    const list = document.querySelector('.fw-combobox-list') as HTMLElement;
    expect(list.textContent).toBe('Nothing found');
  });

  it('ArrowDown + Enter selects the highlighted option and calls onSelect', () => {
    const onSelect = vi.fn();
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle', 'Spokane'], onSelect }));

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('Seattle');
    expect(onSelect).toHaveBeenCalledWith('Seattle');
    expect(document.querySelector('.fw-combobox-list')?.classList.contains('is-open')).toBe(false);
  });

  it('Escape closes the list', () => {
    const input = makeInput();
    instances.push(combobox(input, { options: ['Seattle'] }));
    fireEvent.focus(input);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(document.querySelector('.fw-combobox-list')?.classList.contains('is-open')).toBe(false);
  });

  it('closes when clicking outside the combobox', () => {
    document.body.innerHTML = '<input /><div id="outside"></div>';
    const input = document.querySelector('input') as HTMLInputElement;
    instances.push(combobox(input, { options: ['Seattle'] }));
    fireEvent.focus(input);

    fireEvent.click(document.getElementById('outside') as HTMLElement);

    expect(document.querySelector('.fw-combobox-list')?.classList.contains('is-open')).toBe(false);
  });

  it('destroy() removes the listbox from the DOM', () => {
    const input = makeInput();
    const instance = combobox(input, { options: ['Seattle'] });

    instance.destroy();

    expect(document.querySelector('.fw-combobox-list')).toBeNull();
  });

  it('init() enhances every [data-fw-combobox] input under root', () => {
    document.body.innerHTML = '<input data-fw-combobox />';
    init();

    const input = document.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.dataset.fwBound).toBe('1');
  });
});
