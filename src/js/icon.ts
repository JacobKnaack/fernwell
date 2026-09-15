/**
 * Icon — renders a named SVG icon into a `data-fw-icon` element.
 *
 *   <span class="fw-icon" data-fw-icon="trash" aria-hidden="true"></span>
 *
 * Icons are decorative by default (the injected <svg> is `aria-hidden` and
 * `focusable="false"`); give the accessible name to a wrapping interactive
 * element instead (e.g. `aria-label` on a button), same as `.fw-icon-btn`.
 * Color and size are not set here — `.fw-icon` inherits `color` and sizes
 * itself in `em`, so an icon matches whatever text surrounds it.
 */
const icons: Record<string, string> = {
  add: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  check: '<polyline points="5,13 10,18 19,7"/>',
  edit: '<path d="M16.8 3.5a2.1 2.1 0 0 1 3 3L8.5 17.8 4 19l1.2-4.5Z"/><line x1="14.5" y1="5.8" x2="17.7" y2="9"/>',
  trash:
    '<path d="M4 7h16"/><path d="M9 7V4.6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7"/><path d="M6.5 7l.8 12.4A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.6L18 7"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  save: '<path d="M5 4a1 1 0 0 1 1-1h9.2a1 1 0 0 1 .7.3l2.8 2.8a1 1 0 0 1 .3.7V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z"/><path d="M8 3v5h7V3"/><path d="M8 21v-6h8v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  download: '<line x1="12" y1="3" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="5" y1="21" x2="19" y2="21"/>',
  upload: '<line x1="12" y1="15" x2="12" y2="3"/><polyline points="7,8 12,3 17,8"/><line x1="5" y1="21" x2="19" y2="21"/>',
  share:
    '<circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><line x1="8.1" y1="10.8" x2="15.9" y2="7.2"/><line x1="8.1" y1="13.2" x2="15.9" y2="16.8"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
  more:
    '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  heart:
    '<path d="M12 20s-7-4.4-9.5-8.5C.8 8 2 4.5 5.5 4.5c2 0 3.5 1 6.5 4 3-3 4.5-4 6.5-4 3.5 0 4.7 3.5 3 7-2.5 4.1-9.5 8.5-9.5 8.5Z"/>',
  star: '<polygon points="12,3 14.6,9.1 21.2,9.3 16,13.4 17.8,19.8 12,16.3 6.2,19.8 8,13.4 2.8,9.3 9.4,9.1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/>',
  refresh:
    '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4"/><path d="M20 20v-5h-5"/>',
  filter: '<polygon points="4,4 20,4 14,12 14,19 10,21 10,12"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>',
  warning: '<path d="M12 3 22 20H2Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'chevron-down': '<polyline points="6,9 12,15 18,9"/>',
  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,5 5,12 12,19"/>',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>',
  folder: '<path d="M3.5 6.5a1 1 0 0 1 1-1H10l2 2.2h7.5a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1Z"/>',
  bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10a1 1 0 0 0 1 1h3.5v-6h2.8v6H17a1 1 0 0 0 1-1V10"/>',
  logout:
    '<path d="M9 4H5.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1H9"/><line x1="14" y1="12" x2="21" y2="12"/><polyline points="17.5,8.5 21,12 17.5,15.5"/>',
  paperclip:
    '<path d="M21 11.5 12.4 20a4.3 4.3 0 0 1-6-6.1L15 5.3a2.9 2.9 0 0 1 4.1 4.1l-8.6 8.6a1.4 1.4 0 0 1-2-2l7.9-7.9"/>',
};

export type IconName = keyof typeof icons;

export function render(name: string): string {
  const inner = icons[name];
  if (!inner) return '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}

export function init(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-fw-icon]').forEach((el) => {
    if (el.dataset.fwBound) return;
    el.dataset.fwBound = '1';

    const name = el.dataset.fwIcon ?? '';
    const markup = render(name);
    if (!markup) {
      console.warn(`fernwell: unknown icon "${name}"`);
    }
    el.innerHTML = markup;
    el.classList.add('fw-icon');
  });
}
