/**
 * Fernwell — vanilla JS enhancers for the Fernwell design system.
 *
 * ESM / CJS:   import { init, theme, toast } from 'fernwell';  init();
 * <script>:    <script src="https://unpkg.com/fernwell/dist/fernwell.iife.js"></script>
 *              → window.Fernwell, auto-initialised on DOMContentLoaded
 *                (add data-fw-no-init to the <script> tag to opt out).
 */
import * as theme from './theme.js';
import * as tokens from './tokens.js';
import * as combobox from './combobox.js';
import * as modal from './modal.js';
import * as nav from './nav.js';
import * as loading from './loading.js';
import * as toast from './toast.js';
import * as table from './table.js';
import * as menu from './menu.js';
import * as icon from './icon.js';
import * as popover from './popover.js';
import * as tooltip from './tooltip.js';
import * as tabs from './tabs.js';

export { theme, tokens, combobox, modal, nav, loading, toast, table, menu, icon, popover, tooltip, tabs };
export type { Theme } from './theme.js';
export type { TokenName } from './_tokenData.js';
export type {
  TokenKey,
  TokenOverrides,
  TokenThemeOverrides,
  SetTokensOptions,
  TokensChangeDetail,
} from './tokens.js';
export type { ComboboxOptions, ComboboxInstance } from './combobox.js';
export type { ToastVariant, ToastOptions } from './toast.js';
export type { SortDirection, SortDetail, SelectDetail } from './table.js';
export type { ToggleDetail } from './menu.js';
export type { IconName } from './icon.js';
export type { PopoverOptions, PopoverInstance } from './popover.js';
export type { TooltipOptions, TooltipInstance } from './tooltip.js';
export type { TabsOptions, TabsInstance, TabsActivation, TabsChangeDetail } from './tabs.js';

export const version = '__FW_VERSION__';

/**
 * Wire every `data-fw-*` hook under `root`. Safe to call more than once —
 * already-bound elements are skipped — so call it again after injecting
 * markup (e.g. after an HTMX / Turbo swap).
 */
export function init(root: ParentNode = document): void {
  theme.init(root);
  tokens.init(root);
  combobox.init(root);
  modal.init(root);
  nav.init(root);
  loading.init(root);
  table.init(root);
  menu.init(root);
  icon.init(root);
  popover.init(root);
  tooltip.init(root);
  tabs.init(root);
}

const Fernwell = {
  version,
  init,
  theme,
  tokens,
  combobox,
  modal,
  nav,
  loading,
  toast,
  table,
  menu,
  icon,
  popover,
  tooltip,
  tabs,
};
export default Fernwell;
