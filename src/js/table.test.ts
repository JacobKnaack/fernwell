import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import * as table from './table';

function renderTableFixture(): HTMLTableElement {
  document.body.innerHTML = `
    <table data-fw-table>
      <thead>
        <tr>
          <th class="fw-table-select"><input type="checkbox" data-fw-select-all /></th>
          <th scope="col" data-fw-sort><button type="button">Amount</button></th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="fw-table-select"><input type="checkbox" data-fw-select-row /></td><td data-fw-sort-value="30">$30</td></tr>
        <tr><td class="fw-table-select"><input type="checkbox" data-fw-select-row /></td><td data-fw-sort-value="10">$10</td></tr>
        <tr><td class="fw-table-select"><input type="checkbox" data-fw-select-row /></td><td data-fw-sort-value="20">$20</td></tr>
      </tbody>
    </table>
  `;
  return document.querySelector('table') as HTMLTableElement;
}

function rowValues(t: HTMLTableElement): string[] {
  return Array.from(t.tBodies[0].rows).map((r) => r.cells[1].dataset.fwSortValue ?? '');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('table', () => {
  it('init() marks sort headers aria-sort="none"', () => {
    const t = renderTableFixture();
    table.init();

    expect(t.querySelector('th[data-fw-sort]')?.getAttribute('aria-sort')).toBe('none');
  });

  it('clicking a sort header sorts ascending, then descending, and dispatches fw:sort', () => {
    const t = renderTableFixture();
    table.init();
    const th = t.querySelector('th[data-fw-sort]') as HTMLTableCellElement;
    const onSort = vi.fn();
    t.addEventListener('fw:sort', onSort);

    fireEvent.click(th);
    expect(rowValues(t)).toEqual(['10', '20', '30']);
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    expect(onSort).toHaveBeenCalledTimes(1);

    fireEvent.click(th);
    expect(rowValues(t)).toEqual(['30', '20', '10']);
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });

  it('checking a row selects it and dispatches fw:select', () => {
    const t = renderTableFixture();
    table.init();
    const onSelect = vi.fn();
    t.addEventListener('fw:select', onSelect);
    const rowCheckbox = t.querySelector('tbody input[data-fw-select-row]') as HTMLInputElement;

    rowCheckbox.checked = true;
    fireEvent.change(rowCheckbox);

    const row = rowCheckbox.closest('tr') as HTMLTableRowElement;
    expect(row.classList.contains('is-selected')).toBe(true);
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('checking every row checks select-all (not indeterminate)', () => {
    const t = renderTableFixture();
    table.init();
    const selectAll = t.querySelector('[data-fw-select-all]') as HTMLInputElement;
    const rows = Array.from(t.querySelectorAll<HTMLInputElement>('tbody input[data-fw-select-row]'));

    rows.forEach((r) => {
      r.checked = true;
      fireEvent.change(r);
    });

    expect(selectAll.checked).toBe(true);
    expect(selectAll.indeterminate).toBe(false);
  });

  it('checking one of several rows leaves select-all indeterminate', () => {
    const t = renderTableFixture();
    table.init();
    const selectAll = t.querySelector('[data-fw-select-all]') as HTMLInputElement;
    const [first] = Array.from(t.querySelectorAll<HTMLInputElement>('tbody input[data-fw-select-row]'));

    first.checked = true;
    fireEvent.change(first);

    expect(selectAll.indeterminate).toBe(true);
  });

  it('the select-all checkbox selects every row', () => {
    const t = renderTableFixture();
    table.init();
    const selectAllBox = t.querySelector('[data-fw-select-all]') as HTMLInputElement;

    selectAllBox.checked = true;
    fireEvent.change(selectAllBox);

    const rows = Array.from(t.querySelectorAll('tbody tr'));
    expect(rows.every((r) => r.classList.contains('is-selected'))).toBe(true);
  });
});
