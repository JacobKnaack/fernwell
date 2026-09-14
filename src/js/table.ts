/**
 * Table — client-side column sorting and row selection for `.fw-table`.
 *
 *   <table class="fw-table" data-fw-table>
 *     <thead><tr>
 *       <th class="fw-table-select"><label class="fw-checkbox"><input type="checkbox" data-fw-select-all>…</label></th>
 *       <th scope="col" aria-sort="none" data-fw-sort><button type="button" class="fw-table-sort">Client</button></th>
 *     </tr></thead>
 *     <tbody><tr>
 *       <td class="fw-table-select"><label class="fw-checkbox"><input type="checkbox" data-fw-select-row>…</label></td>
 *       <td data-fw-sort-value="1250">$1,250.00</td>
 *     </tr></tbody>
 *   </table>
 *
 * Clicking a `th[data-fw-sort]` cycles aria-sort (none → ascending → descending → …)
 * and reorders the first <tbody>. `data-fw-sort-value` on a cell overrides its
 * text for comparison (numbers, ISO dates). Rows without a cell in the sorted
 * column (e.g. a colspan empty row) stay at the bottom.
 *
 * Row checkboxes toggle `.is-selected` / aria-selected on their row and keep the
 * select-all checkbox in sync (checked / indeterminate).
 *
 * Events (bubbling, on the <table>): `fw:sort` { column, direction, th } and
 * `fw:select` { rows, all }.
 */
export type SortDirection = 'ascending' | 'descending';

export interface SortDetail {
  column: number;
  direction: SortDirection;
  th: HTMLTableCellElement;
}

export interface SelectDetail {
  rows: HTMLTableRowElement[];
  all: boolean;
}

const SELECTED = 'is-selected';

function emit(table: HTMLTableElement, name: string, detail: SortDetail | SelectDetail): void {
  table.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

/* ---- sorting ---- */

function cellValue(row: HTMLTableRowElement, column: number): string {
  const cell = row.cells[column];
  return cell?.dataset.fwSortValue ?? cell?.textContent?.trim() ?? '';
}

function compare(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function sortHeaders(table: HTMLTableElement): HTMLTableCellElement[] {
  return Array.from(table.tHead?.querySelectorAll<HTMLTableCellElement>('th[data-fw-sort]') ?? []);
}

function nextDirection(th: HTMLTableCellElement): SortDirection {
  return th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
}

export function sort(table: HTMLTableElement, column: number, direction: SortDirection): void {
  const tbody = table.tBodies[0];
  if (!tbody) return;

  const rows = Array.from(tbody.rows);
  // A colspan row (empty / loading) has no cell at `column` — keep it last.
  const sortable = rows.filter((r) => r.cells.length > column);
  const rest = rows.filter((r) => r.cells.length <= column);
  const sign = direction === 'ascending' ? 1 : -1;
  sortable.sort((a, b) => sign * compare(cellValue(a, column), cellValue(b, column)));
  [...sortable, ...rest].forEach((r) => tbody.appendChild(r));

  let active: HTMLTableCellElement | null = null;
  sortHeaders(table).forEach((th) => {
    const isTarget = th.cellIndex === column;
    th.setAttribute('aria-sort', isTarget ? direction : 'none');
    if (isTarget) active = th;
  });
  if (active) emit(table, 'fw:sort', { column, direction, th: active });
}

/* ---- selection ---- */

function rowInputs(table: HTMLTableElement): HTMLInputElement[] {
  return Array.from(table.querySelectorAll<HTMLInputElement>('tbody input[data-fw-select-row]'));
}

function applyRowState(row: HTMLTableRowElement, on: boolean): void {
  row.classList.toggle(SELECTED, on);
  row.setAttribute('aria-selected', on ? 'true' : 'false');
}

function syncSelectAll(table: HTMLTableElement): void {
  const all = table.querySelector<HTMLInputElement>('[data-fw-select-all]');
  if (!all) return;
  const inputs = rowInputs(table);
  const n = inputs.filter((i) => i.checked).length;
  all.checked = n > 0 && n === inputs.length;
  all.indeterminate = n > 0 && n < inputs.length;
}

export function getSelected(table: HTMLTableElement): HTMLTableRowElement[] {
  return rowInputs(table)
    .filter((i) => i.checked)
    .map((i) => i.closest('tr'))
    .filter((r): r is HTMLTableRowElement => r !== null);
}

export function setRowSelected(row: HTMLTableRowElement, on: boolean): void {
  const input = row.querySelector<HTMLInputElement>('input[data-fw-select-row]');
  if (input) input.checked = on;
  applyRowState(row, on);
  const table = row.closest('table');
  if (!table) return;
  syncSelectAll(table);
  emit(table, 'fw:select', { rows: getSelected(table), all: false });
}

export function selectAll(table: HTMLTableElement, on: boolean): void {
  rowInputs(table).forEach((input) => {
    input.checked = on;
    const row = input.closest('tr');
    if (row) applyRowState(row, on);
  });
  syncSelectAll(table);
  emit(table, 'fw:select', { rows: getSelected(table), all: true });
}

/* ---- init ---- */

export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLTableElement>('table[data-fw-table]').forEach((table) => {
    if (table.dataset.fwBound) return;
    table.dataset.fwBound = '1';

    sortHeaders(table).forEach((th) => {
      if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
    });

    table.addEventListener('click', (e) => {
      const th = (e.target as Element).closest<HTMLTableCellElement>('th[data-fw-sort]');
      if (th && table.contains(th)) sort(table, th.cellIndex, nextDirection(th));
    });

    // Enter / Space on the sort button (or on a tabindex'd <th> without one).
    // preventDefault stops the button's native activation so it can't sort twice.
    table.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target as Element;
      if (!target.matches('th[data-fw-sort], th[data-fw-sort] .fw-table-sort')) return;
      const th = target.closest<HTMLTableCellElement>('th[data-fw-sort]');
      if (!th) return;
      e.preventDefault();
      sort(table, th.cellIndex, nextDirection(th));
    });

    table.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.matches('[data-fw-select-all]')) {
        selectAll(table, input.checked);
      } else if (input.matches('[data-fw-select-row]')) {
        const row = input.closest('tr');
        if (row) setRowSelected(row, input.checked);
      }
    });

    // Honour server-rendered checked state.
    rowInputs(table).forEach((input) => {
      const row = input.closest('tr');
      if (row && input.checked) applyRowState(row, true);
    });
    syncSelectAll(table);
  });
}
