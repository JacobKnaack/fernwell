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
import * as icon from './icon';
import * as popover from './popover';
import * as tooltip from './tooltip';

export { theme, combobox, modal, nav, loading, toast, table, menu, icon, popover, tooltip };
export type { Theme, TokenOverrides, TokenThemeOverrides } from './theme';
export type { ComboboxOptions, ComboboxInstance } from './combobox';
export type { ToastVariant, ToastOptions } from './toast';
export type { SortDirection, SortDetail, SelectDetail } from './table';
export type { ToggleDetail } from './menu';
export type { IconName } from './icon';
export type { PopoverOptions, PopoverInstance } from './popover';
export type { TooltipOptions, TooltipInstance } from './tooltip';

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
  icon.init(root);
  popover.init(root);
  tooltip.init(root);
}

const Fernwell = { version, init, theme, combobox, modal, nav, loading, toast, table, menu, icon, popover, tooltip };
export default Fernwell;
