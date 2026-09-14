/**
 * Menu — a nestable collapsible menu (nav tree or accordion) built on
 * native <details>/<summary>, enhanced for `.fw-menu[data-fw-menu]`.
 *
 *   <nav class="fw-menu" aria-label="Docs" data-fw-menu>
 *     <ul class="fw-menu-list">
 *       <li class="fw-menu-item"><a class="fw-menu-link" href="/" aria-current="page">Overview</a></li>
 *       <li class="fw-menu-item">
 *         <details class="fw-menu-group">
 *           <summary class="fw-menu-summary">Billing</summary>
 *           <ul class="fw-menu-list">
 *             <li class="fw-menu-item fw-menu-split">
 *               <a class="fw-menu-link" href="/billing/plans">Plans</a>
 *               <details class="fw-menu-group">
 *                 <summary class="fw-menu-summary fw-menu-summary-icon"><span class="fw-sr-only">Toggle Plans</span></summary>
 *                 <ul class="fw-menu-list">…</ul>
 *               </details>
 *             </li>
 *           </ul>
 *         </details>
 *       </li>
 *     </ul>
 *   </nav>
 *
 * The `open` attribute on each `.fw-menu-group` is the state — server-rendered
 * state is honoured, and the menu still expands/collapses without JS.
 *
 * The enhancer adds:
 *   - auto-reveal: every ancestor group of an `[aria-current]` link is opened on
 *     init, and a collapsed summary whose branch holds the current page gets `.is-current`
 *   - `data-fw-menu-exclusive`: opening a group closes its siblings (accordion)
 *   - keyboard: ArrowUp/ArrowDown move between visible rows, ArrowRight opens /
 *     enters a group, ArrowLeft closes / goes to the parent, Home/End jump.
 *     Tab order is untouched — every row stays natively tabbable.
 *
 * Events (bubbling, from the <details>): `fw:toggle` { group, open }.
 */
export interface ToggleDetail {
  group: HTMLDetailsElement;
  open: boolean;
}

const GROUP = '.fw-menu-group';
const ROW = '.fw-menu-link, .fw-menu-summary';
const CURRENT = 'is-current';

function emit(group: HTMLDetailsElement, detail: ToggleDetail): void {
  group.dispatchEvent(new CustomEvent('fw:toggle', { bubbles: true, detail }));
}

/* ---- open / close ---- */

export function open(group: HTMLDetailsElement): void {
  group.open = true;
}

export function close(group: HTMLDetailsElement): void {
  group.open = false;
}

export function toggle(group: HTMLDetailsElement, force?: boolean): void {
  group.open = force ?? !group.open;
}

export function expandAll(root: ParentNode): void {
  root.querySelectorAll<HTMLDetailsElement>(GROUP).forEach(open);
}

export function collapseAll(root: ParentNode): void {
  root.querySelectorAll<HTMLDetailsElement>(GROUP).forEach(close);
}

/** Open every ancestor group of `el` so it is visible. */
export function reveal(el: Element): void {
  let group = el.parentElement?.closest<HTMLDetailsElement>(GROUP) ?? null;
  while (group) {
    open(group);
    group = group.parentElement?.closest<HTMLDetailsElement>(GROUP) ?? null;
  }
}

/* ---- current-page hinting ---- */

function syncCurrent(menu: HTMLElement): void {
  menu.querySelectorAll<HTMLDetailsElement>(GROUP).forEach((group) => {
    const summary = group.querySelector<HTMLElement>(':scope > .fw-menu-summary');
    if (!summary) return;
    const holdsCurrent = !group.open && group.querySelector('[aria-current]') !== null;
    summary.classList.toggle(CURRENT, holdsCurrent);
  });
}

/* ---- keyboard ---- */

/** The group this row summarises (a summary), or null for a link. */
function ownGroup(row: HTMLElement): HTMLDetailsElement | null {
  return row.matches('.fw-menu-summary') ? row.closest<HTMLDetailsElement>(GROUP) : null;
}

/** The group that contains this row (not the one it summarises). */
function parentGroup(row: HTMLElement): HTMLDetailsElement | null {
  const start = ownGroup(row) ?? row;
  return start.parentElement?.closest<HTMLDetailsElement>(GROUP) ?? null;
}

function isVisible(row: HTMLElement): boolean {
  for (let g = parentGroup(row); g; g = g.parentElement?.closest<HTMLDetailsElement>(GROUP) ?? null) {
    if (!g.open) return false;
  }
  return true;
}

function visibleRows(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(ROW)).filter(isVisible);
}

function focusRow(row: HTMLElement | null | undefined): boolean {
  if (!row) return false;
  row.focus();
  return true;
}

/** The icon-only summary sitting beside a split-row link, if any. */
function splitToggleFor(link: HTMLElement): HTMLElement | null {
  const item = link.closest<HTMLElement>('.fw-menu-split');
  return item?.querySelector<HTMLElement>(':scope > .fw-menu-group > .fw-menu-summary') ?? null;
}

function onKeydown(menu: HTMLElement, e: KeyboardEvent): void {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const row = e.target instanceof HTMLElement && e.target.matches(ROW) ? e.target : null;
  if (!row || !menu.contains(row)) return;

  const rows = visibleRows(menu);
  const i = rows.indexOf(row);
  const group = ownGroup(row);
  let handled = true;

  switch (e.key) {
    case 'ArrowDown':
      focusRow(rows[i + 1]);
      break;
    case 'ArrowUp':
      focusRow(rows[i - 1]);
      break;
    case 'Home':
      focusRow(rows[0]);
      break;
    case 'End':
      focusRow(rows[rows.length - 1]);
      break;
    case 'ArrowRight':
      if (group) {
        // An open group's first row is simply the next visible one.
        if (!group.open) open(group);
        else if (group.contains(rows[i + 1] ?? menu)) focusRow(rows[i + 1]);
      } else {
        focusRow(splitToggleFor(row));
      }
      break;
    case 'ArrowLeft':
      if (group?.open) {
        close(group);
      } else {
        const parent = parentGroup(row);
        focusRow(parent?.querySelector<HTMLElement>(':scope > .fw-menu-summary'));
      }
      break;
    default:
      handled = false;
  }
  if (handled) e.preventDefault();
}

/* ---- init ---- */

export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-menu]').forEach((menu) => {
    if (menu.dataset.fwBound) return;
    menu.dataset.fwBound = '1';
    const exclusive = menu.hasAttribute('data-fw-menu-exclusive');

    // Native `toggle` doesn't bubble — catch it in the capture phase.
    menu.addEventListener(
      'toggle',
      (e) => {
        const group = e.target;
        if (!(group instanceof HTMLDetailsElement) || !group.matches(GROUP)) return;
        if (exclusive && group.open && group.parentElement) {
          Array.from(group.parentElement.children).forEach((sibling) => {
            if (sibling !== group && sibling instanceof HTMLDetailsElement && sibling.matches(GROUP)) close(sibling);
          });
        }
        syncCurrent(menu);
        emit(group, { group, open: group.open });
      },
      true,
    );

    menu.addEventListener('keydown', (e) => onKeydown(menu, e));

    // Honour server-rendered state: make the current page visible on load.
    menu.querySelectorAll('[aria-current]').forEach(reveal);
    syncCurrent(menu);
  });
}
