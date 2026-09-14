/**
 * Fernwell — vanilla JS enhancers for the Fernwell design system.
 *
 * ESM / CJS:   import { init, theme, toast } from 'fernwell';  init();
 * <script>:    <script src="https://unpkg.com/fernwell/dist/fernwell.iife.js"></script>
 *              → window.Fernwell, auto-initialised on DOMContentLoaded
 *                (add data-fw-no-init to the <script> tag to opt out).
 */
import * as theme from './theme';
import * as combobox from './combobox';
import * as modal from './modal';
import * as nav from './nav';
import * as loading from './loading';
import * as toast from './toast';
import * as table from './table';
import * as menu from './menu';

export { theme, combobox, modal, nav, loading, toast, table, menu };
export type { Theme, TokenOverrides, TokenThemeOverrides } from './theme';
export type { ComboboxOptions, ComboboxInstance } from './combobox';
export type { ToastVariant, ToastOptions } from './toast';
export type { SortDirection, SortDetail, SelectDetail } from './table';
export type { ToggleDetail } from './menu';

export const version = '__FW_VERSION__';

/**
 * Wire every `data-fw-*` hook under `root`. Safe to call more than once —
 * already-bound elements are skipped — so call it again after injecting
 * markup (e.g. after an HTMX / Turbo swap).
 */
export function init(root: ParentNode = document): void {
  theme.init(root);
  combobox.init(root);
  modal.init(root);
  nav.init(root);
  loading.init(root);
  table.init(root);
  menu.init(root);
}

const Fernwell = { version, init, theme, combobox, modal, nav, loading, toast, table, menu };
export default Fernwell;
