/**
 * Combobox / typeahead — progressive enhancement over an <input> + <datalist>.
 *
 *   <div class="fw-combobox">
 *     <input class="fw-input" data-fw-combobox list="cities" placeholder="Start typing…">
 *     <datalist id="cities"><option value="Seattle"></option>…</datalist>
 *   </div>
 *
 * Or programmatically: combobox(input, { options: ['Seattle', …], onSelect })
 */
export interface ComboboxOptions {
  /** Static option list. Defaults to the <datalist> the input's `list` attribute points at. */
  options?: string[];
  /** Filter function; default is case-insensitive substring match. */
  filter?: (option: string, query: string) => boolean;
  /** Text shown when nothing matches. */
  emptyText?: string;
  onSelect?: (value: string) => void;
}

export interface ComboboxInstance {
  open(): void;
  close(): void;
  setOptions(options: string[]): void;
  destroy(): void;
}

let uid = 0;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function combobox(input: HTMLInputElement, opts: ComboboxOptions = {}): ComboboxInstance {
  const filter = opts.filter ?? ((o, q) => o.toLowerCase().includes(q));
  const emptyText = opts.emptyText ?? 'No matches';
  let options = opts.options ?? readDatalist(input);
  let current: string[] = [];
  let activeIndex = -1;
  let selecting = false;

  // The native datalist would double up with our list — detach it but keep
  // the options readable for setOptions()/no-JS fallbacks.
  const listId = input.getAttribute('list');
  if (listId) {
    input.dataset.fwList = listId;
    input.removeAttribute('list');
  }

  const wrap = input.closest('.fw-combobox') ?? wrapInput(input);
  const list = document.createElement('ul');
  const id = `fw-combobox-${++uid}`;
  list.className = 'fw-combobox-list';
  list.id = id;
  list.setAttribute('role', 'listbox');
  wrap.appendChild(list);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', id);
  input.autocomplete = 'off';

  function render(matches: string[]): void {
    current = matches;
    activeIndex = -1;
    const q = input.value.trim().toLowerCase();
    if (matches.length === 0) {
      list.innerHTML = `<li class="fw-combobox-empty">${escapeHtml(emptyText)}</li>`;
      return;
    }
    list.innerHTML = matches
      .map((opt, i) => {
        const idx = q ? opt.toLowerCase().indexOf(q) : -1;
        const label =
          idx > -1
            ? `${escapeHtml(opt.slice(0, idx))}<b>${escapeHtml(opt.slice(idx, idx + q.length))}</b>${escapeHtml(opt.slice(idx + q.length))}`
            : escapeHtml(opt);
        return `<li class="fw-combobox-option" role="option" id="${id}-${i}" data-index="${i}" aria-selected="false">${label}</li>`;
      })
      .join('');
  }

  function open(): void {
    const q = input.value.trim().toLowerCase();
    render(q ? options.filter((o) => filter(o, q)) : options);
    list.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
  }

  function close(): void {
    list.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  function highlight(i: number): void {
    const items = list.querySelectorAll<HTMLElement>('.fw-combobox-option');
    items.forEach((el) => {
      el.classList.remove('is-active');
      el.setAttribute('aria-selected', 'false');
    });
    const el = items[i];
    if (el) {
      el.classList.add('is-active');
      el.setAttribute('aria-selected', 'true');
      el.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', el.id);
    }
    activeIndex = i;
  }

  function select(value: string): void {
    input.value = value;
    close();
    // The synthetic events below would re-open the list via onInput/onFocus.
    selecting = true;
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    selecting = false;
    opts.onSelect?.(value);
  }

  const onInput = () => {
    if (!selecting) open();
  };
  const onFocus = () => {
    if (!selecting) open();
  };
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!list.classList.contains('is-open')) open();
      highlight(Math.min(activeIndex + 1, current.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex > -1 && current[activeIndex] !== undefined) {
        e.preventDefault();
        select(current[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  };
  const onListMousedown = (e: MouseEvent) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>('.fw-combobox-option');
    if (opt) {
      e.preventDefault(); // keep focus on the input
      select(current[Number(opt.dataset.index)]);
    }
  };
  const onDocClick = (e: MouseEvent) => {
    if (!wrap.contains(e.target as Node)) close();
  };

  input.addEventListener('input', onInput);
  input.addEventListener('focus', onFocus);
  input.addEventListener('keydown', onKeydown);
  list.addEventListener('mousedown', onListMousedown);
  document.addEventListener('click', onDocClick);

  return {
    open,
    close,
    setOptions(next) {
      options = next;
      if (list.classList.contains('is-open')) open();
    },
    destroy() {
      input.removeEventListener('input', onInput);
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('keydown', onKeydown);
      list.removeEventListener('mousedown', onListMousedown);
      document.removeEventListener('click', onDocClick);
      list.remove();
      if (input.dataset.fwList) input.setAttribute('list', input.dataset.fwList);
      delete input.dataset.fwBound;
    },
  };
}

function readDatalist(input: HTMLInputElement): string[] {
  const id = input.getAttribute('list') ?? input.dataset.fwList;
  const dl = id ? document.getElementById(id) : null;
  return dl ? Array.from(dl.querySelectorAll('option')).map((o) => o.value || o.textContent || '') : [];
}

function wrapInput(input: HTMLInputElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'fw-combobox';
  input.parentNode?.insertBefore(wrap, input);
  wrap.appendChild(input);
  return wrap;
}

/** Enhance every `[data-fw-combobox]` input under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>('input[data-fw-combobox]').forEach((input) => {
    if (input.dataset.fwBound) return;
    input.dataset.fwBound = '1';
    combobox(input);
  });
}
