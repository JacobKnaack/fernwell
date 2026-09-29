/*
 * GENERATED from src/tokens/tokens.json by scripts/gen-tokens.mjs. Do not edit by hand.
 */

/** Every token name, without the `--fw-` prefix. */
export type TokenName =
  | 'text'
  | 'text-soft'
  | 'bg'
  | 'bg-dim'
  | 'surface'
  | 'primary'
  | 'primary-hover'
  | 'primary-soft'
  | 'secondary'
  | 'secondary-hover'
  | 'secondary-bg'
  | 'success'
  | 'success-bg'
  | 'warning'
  | 'warning-bg'
  | 'danger'
  | 'danger-bg'
  | 'info'
  | 'info-bg'
  | 'on-primary'
  | 'on-secondary'
  | 'on-secondary-soft'
  | 'on-secondary-fill'
  | 'on-secondary-line'
  | 'overlay'
  | 'overlay-soft'
  | 'focus-ring'
  | 'scrollbar-thumb'
  | 'scrollbar-thumb-hover'
  | 'scrollbar-track'
  | 'font-display'
  | 'font-body'
  | 'font-mono'
  | 'sp-1'
  | 'sp-2'
  | 'sp-3'
  | 'sp-4'
  | 'sp-5'
  | 'sp-6'
  | 'sp-7'
  | 'sp-8'
  | 'sp-9'
  | 'r-sm'
  | 'r-md'
  | 'r-lg'
  | 'r-xl'
  | 'r-full'
  | 'shadow-sm'
  | 'shadow-md'
  | 'shadow-lg'
  | 'shadow-primary'
  | 'shadow-success'
  | 'border-w'
  | 'motion-fast'
  | 'motion-base'
  | 'motion-ease';

/** A token whose value is computed from other tokens (hovers, tints, focus ring, glows). */
export interface DerivedToken {
  readonly name: TokenName;
  /** The CSS value in the light theme, with `{ref}`s already resolved to `var(--fw-…)`. */
  readonly light: string;
  readonly dark: string;
  /** Names of the tokens this one is computed from (either theme). */
  readonly deps: readonly string[];
}

export const DERIVED: readonly DerivedToken[] = [
  { name: 'primary-hover', light: 'color-mix(in srgb, var(--fw-primary), var(--fw-text) 12%)', dark: 'color-mix(in srgb, var(--fw-primary), var(--fw-text) 12%)', deps: ['primary', 'text'] },
  { name: 'primary-soft', light: 'color-mix(in srgb, var(--fw-primary), white 35%)', dark: 'color-mix(in srgb, var(--fw-primary), white 35%)', deps: ['primary'] },
  { name: 'secondary-hover', light: 'color-mix(in srgb, var(--fw-secondary), var(--fw-text) 15%)', dark: 'color-mix(in srgb, var(--fw-secondary), var(--fw-text) 15%)', deps: ['secondary', 'text'] },
  { name: 'secondary-bg', light: 'color-mix(in srgb, var(--fw-secondary) 10%, var(--fw-surface))', dark: 'color-mix(in srgb, var(--fw-secondary) 16%, transparent)', deps: ['secondary', 'surface'] },
  { name: 'success-bg', light: 'color-mix(in srgb, var(--fw-success) 12%, var(--fw-surface))', dark: 'color-mix(in srgb, var(--fw-success) 14%, transparent)', deps: ['success', 'surface'] },
  { name: 'warning-bg', light: 'color-mix(in srgb, var(--fw-warning) 14%, var(--fw-surface))', dark: 'color-mix(in srgb, var(--fw-warning) 16%, transparent)', deps: ['warning', 'surface'] },
  { name: 'danger-bg', light: 'color-mix(in srgb, var(--fw-danger) 13%, var(--fw-surface))', dark: 'color-mix(in srgb, var(--fw-danger) 14%, transparent)', deps: ['danger', 'surface'] },
  { name: 'info-bg', light: 'color-mix(in srgb, var(--fw-info) 12%, var(--fw-surface))', dark: 'color-mix(in srgb, var(--fw-info) 14%, transparent)', deps: ['info', 'surface'] },
  { name: 'on-secondary-soft', light: 'color-mix(in srgb, var(--fw-on-secondary) 72%, transparent)', dark: 'color-mix(in srgb, var(--fw-on-secondary) 72%, transparent)', deps: ['on-secondary'] },
  { name: 'on-secondary-fill', light: 'color-mix(in srgb, var(--fw-on-secondary) 10%, transparent)', dark: 'color-mix(in srgb, var(--fw-on-secondary) 10%, transparent)', deps: ['on-secondary'] },
  { name: 'on-secondary-line', light: 'color-mix(in srgb, var(--fw-on-secondary) 16%, transparent)', dark: 'color-mix(in srgb, var(--fw-on-secondary) 16%, transparent)', deps: ['on-secondary'] },
  { name: 'focus-ring', light: '0 0 0 4px color-mix(in srgb, var(--fw-primary) 25%, transparent)', dark: '0 0 0 4px color-mix(in srgb, var(--fw-primary) 25%, transparent)', deps: ['primary'] },
  { name: 'scrollbar-thumb', light: 'var(--fw-text-soft)', dark: 'var(--fw-text-soft)', deps: ['text-soft'] },
  { name: 'scrollbar-thumb-hover', light: 'color-mix(in srgb, var(--fw-text-soft), var(--fw-text) 15%)', dark: 'color-mix(in srgb, var(--fw-text-soft), var(--fw-text) 15%)', deps: ['text-soft', 'text'] },
  { name: 'shadow-primary', light: '0 6px 16px color-mix(in srgb, var(--fw-primary) 35%, transparent)', dark: '0 6px 16px color-mix(in srgb, var(--fw-primary) 22%, transparent)', deps: ['primary'] },
  { name: 'shadow-success', light: '0 6px 16px color-mix(in srgb, var(--fw-success) 28%, transparent)', dark: '0 6px 16px color-mix(in srgb, var(--fw-success) 22%, transparent)', deps: ['success'] },
];
