/**
 * Tabs — a single-selection tablist that switches between panels.
 *
 *   <div class="fw-tablist" role="tablist" aria-label="Account settings" data-fw-tabs>
 *     <button type="button" class="fw-tab" id="tab-profile" role="tab" aria-selected="true" aria-controls="panel-profile">Profile</button>
 *     <button type="button" class="fw-tab" id="tab-billing" role="tab" aria-selected="false" aria-controls="panel-billing">Billing</button>
 *   </div>
 *   <div class="fw-tabpanel" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" tabindex="0">…</div>
 *   <div class="fw-tabpanel" id="panel-billing" role="tabpanel" aria-labelledby="tab-billing" tabindex="0" hidden>…</div>
 *
 * Author `aria-selected="true"` on the tab that should start selected (the
 * rest `"false"`); `init()` derives roving `tabIndex` (0 on the selected tab,
 * -1 on the rest) and each panel's `hidden` from that. Falls back to the
 * first non-disabled tab if none is marked selected. A tab may carry
 * `aria-disabled="true"` to make it non-interactive — it is skipped by
 * click, arrow-key, and Home/End navigation.
 *
 * `data-fw-tabs-activation="manual"` on the tablist switches from the
 * default "automatic" activation (arrow keys move focus AND select) to
 * "manual" (arrow keys only move focus; Space/Enter selects the focused
 * tab) — use manual when selecting a tab is expensive (e.g. triggers a
 * fetch).
 *
 * `aria-orientation="vertical"` on the tablist swaps the primary arrow keys
 * from Left/Right to Up/Down, per WAI-ARIA APG. Left/Right invert under RTL.
 *
 * Events (bubbling, from the tablist): `fw:tabs-change` { tab, panel }.
 */
export type TabsActivation = 'automatic' | 'manual';

export interface TabsOptions {
  activation?: TabsActivation;
}

export interface TabsInstance {
  activate(tab: HTMLElement, focus?: boolean): void;
  destroy(): void;
}

export interface TabsChangeDetail {
  tab: HTMLElement;
  panel: HTMLElement;
}

function emit(tablist: HTMLElement, detail: TabsChangeDetail): void {
  tablist.dispatchEvent(new CustomEvent('fw:tabs-change', { bubbles: true, detail }));
}

function isDisabled(tab: HTMLElement): boolean {
  return tab.getAttribute('aria-disabled') === 'true';
}

function panelFor(tab: HTMLElement): HTMLElement | null {
  const id = tab.getAttribute('aria-controls');
  return id ? document.getElementById(id) : null;
}

function closestTab(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>('[role="tab"]') : null;
}

/** The next non-disabled tab `step` positions from `from`, wrapping around. Undefined if every tab is disabled. */
function nextEnabled(list: HTMLElement[], from: number, step: 1 | -1): HTMLElement | undefined {
  for (let n = 1; n <= list.length; n++) {
    const idx = (((from + step * n) % list.length) + list.length) % list.length;
    if (!isDisabled(list[idx])) return list[idx];
  }
  return undefined;
}

function firstEnabled(list: HTMLElement[]): HTMLElement | undefined {
  return list.find((t) => !isDisabled(t));
}

function lastEnabled(list: HTMLElement[]): HTMLElement | undefined {
  for (let i = list.length - 1; i >= 0; i--) {
    if (!isDisabled(list[i])) return list[i];
  }
  return undefined;
}

export function tabs(tablist: HTMLElement, opts: TabsOptions = {}): TabsInstance {
  const activation = opts.activation ?? 'automatic';

  function allTabs(): HTMLElement[] {
    return Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  function activate(tab: HTMLElement, focus = false): void {
    if (isDisabled(tab)) return;
    allTabs().forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = panelFor(t);
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
    const panel = panelFor(tab);
    if (panel) emit(tablist, { tab, panel });
  }

  /** Manual-activation arrow move: roving tabindex follows focus, selection is untouched. */
  function focusOnly(tab: HTMLElement): void {
    allTabs().forEach((t) => {
      t.tabIndex = t === tab ? 0 : -1;
    });
    tab.focus();
  }

  function syncFromSelected(): void {
    const list = allTabs();
    const selected = list.find((t) => t.getAttribute('aria-selected') === 'true') ?? firstEnabled(list);
    list.forEach((t) => {
      const isSelected = t === selected;
      t.setAttribute('aria-selected', String(isSelected));
      t.tabIndex = isSelected ? 0 : -1;
      const panel = panelFor(t);
      if (panel) panel.hidden = !isSelected;
    });
  }

  function onClick(e: MouseEvent): void {
    const tab = closestTab(e.target);
    if (tab && tablist.contains(tab)) activate(tab, false);
  }

  function onKeydown(e: KeyboardEvent): void {
    const tab = closestTab(e.target);
    if (!tab) return;
    const list = allTabs();
    const i = list.indexOf(tab);
    if (i === -1) return;

    if (e.key === ' ' || e.key === 'Enter') {
      if (activation === 'manual') {
        e.preventDefault();
        activate(tab, false);
      }
      return;
    }

    const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
    const rtl = getComputedStyle(tablist).direction === 'rtl';
    const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

    let dest: HTMLElement | undefined;
    if (e.key === nextKey) dest = nextEnabled(list, i, 1);
    else if (e.key === prevKey) dest = nextEnabled(list, i, -1);
    else if (e.key === 'Home') dest = firstEnabled(list);
    else if (e.key === 'End') dest = lastEnabled(list);
    else return;

    if (!dest) return;
    e.preventDefault();
    if (activation === 'manual') focusOnly(dest);
    else activate(dest, true);
  }

  tablist.addEventListener('click', onClick);
  tablist.addEventListener('keydown', onKeydown);
  syncFromSelected();

  return {
    activate,
    destroy() {
      tablist.removeEventListener('click', onClick);
      tablist.removeEventListener('keydown', onKeydown);
      delete tablist.dataset.fwBound;
    },
  };
}

/** Wire every `[role="tablist"][data-fw-tabs]` under `root`. */
export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[role="tablist"][data-fw-tabs]').forEach((tablist) => {
    if (tablist.dataset.fwBound) return;
    tablist.dataset.fwBound = '1';
    const activation: TabsActivation = tablist.dataset.fwTabsActivation === 'manual' ? 'manual' : 'automatic';
    tabs(tablist, { activation });
  });
}
