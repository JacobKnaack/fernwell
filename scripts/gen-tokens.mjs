// tokens.json → src/css/tokens.css  +  src/js/_tokenData.ts
// The JSON is the single source of truth; never hand-edit either output.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'src/tokens/tokens.json'), 'utf8'));
const p = tokens.prefix;

// Resolve `{name}` references within a group's values to var(--fw-name).
const REF = /\{([\w-]+)\}/g;
const resolveRefs = (value) => value.replace(REF, (_, name) => `var(--${p}-${name})`);

// JSON group → emitted token name. Colours are bare (`primary`); every other
// group carries a short prefix (`sp-4`, `r-md`, `shadow-lg`, …).
const NAMES = {
  color: (k) => k,
  font: (k) => `font-${k}`,
  space: (k) => `sp-${k}`,
  radius: (k) => `r-${k}`,
  shadow: (k) => `shadow-${k}`,
  border: (k) => `border-${k}`,
  motion: (k) => `motion-${k}`,
};

// Simple groups: { key: { value, comment } } → one line per entry, same in every theme.
const line = (name, { value, comment }) =>
  `  --${p}-${name}: ${resolveRefs(value)};${comment ? ` /* ${comment} */` : ''}`;

const group = (title, entries, nameFn = (k) => k) =>
  [`  /* ===== ${title} ===== */`, ...Object.entries(entries).map(([k, v]) => line(nameFn(k), v))].join('\n');

// Themed color/shadow groups: each entry is { value } (same both themes) or
// { light, dark? }. `dark` is optional — omit it and the token doesn't flip.
const themedLine = (name, entry, theme) => {
  const raw = entry.value ?? entry[theme] ?? entry.light;
  return `  --${p}-${name}: ${resolveRefs(raw)};${entry.comment ? ` /* ${entry.comment} */` : ''}`;
};

const themedGroup = (title, entries, theme, nameFn = (k) => k) =>
  [`  /* ===== ${title} ===== */`, ...Object.entries(entries).map(([k, v]) => themedLine(nameFn(k), v, theme))].join(
    '\n',
  );

const light = [
  themedGroup('COLOR', tokens.color, 'light'),
  group('TYPE', tokens.font, NAMES.font),
  group('SPACING (8pt scale)', tokens.space, NAMES.space),
  group('SHAPE — bigger surface, softer corner', tokens.radius, NAMES.radius),
  themedGroup('ELEVATION', tokens.shadow, 'light', NAMES.shadow),
  group('BORDER', tokens.border, NAMES.border),
  group('MOTION', tokens.motion, NAMES.motion),
].join('\n\n');

// Dark theme: every color/shadow token is re-declared. A seed with no `dark`
// value repeats its light value (harmless — keeps the block self-contained);
// a derived token (a `{ref}` value) is *recomputed* here because var()
// resolves relative to where it's declared, not where it's used.
const dark = [
  themedGroup('COLOR', tokens.color, 'dark'),
  themedGroup('ELEVATION', tokens.shadow, 'dark', NAMES.shadow),
].join('\n\n');

const css = `/*
 * Fernwell design tokens — GENERATED from src/tokens/tokens.json by scripts/gen-tokens.mjs.
 * Do not edit by hand.
 *
 * Override any SEED token (see README) in your own stylesheet after this
 * file — every DERIVED token (hovers, tints, focus ring, glows) follows
 * automatically in both themes:
 *   :root { --${p}-primary: #2266ff; }
 *
 * These rules live in @layer ${p}-tokens, so a plain (unlayered) override
 * always wins regardless of selector specificity or source order — including
 * against the [data-theme="dark"] block below. Declare your own @layer list
 * before this stylesheet if your app uses layers, so it isn't placed inside
 * one implicitly.
 *
 * Dark theme: set data-theme="dark" on <html> (or any ancestor). A
 * data-theme="light" ancestor re-asserts light inside a dark page.
 *
 * Runtime theming: Fernwell.theme.setTokens({ primary: '#2266ff' }) /
 * .resetTokens() / .getToken('primary') — see the JS section of the README.
 */
@layer ${p}-tokens {
  :root,
  [data-theme="light"] {
${light}
  }

  [data-theme="dark"] {
${dark}
  }
}
`;

writeFileSync(join(root, 'src/css/tokens.css'), css);
console.log('wrote src/css/tokens.css');

// --- src/js/_tokenData.ts ---------------------------------------------------
// What the runtime override API (src/js/tokens.ts) needs to know about the
// token set: every token name (for editor autocomplete) and every DERIVED
// token — one whose value has a `{ref}` — with its light/dark formula and the
// tokens it reads. tokens.css declares derived tokens on :root, and var()
// resolves where it is declared, so a seed overridden on a *scoped* selector
// would leave them stale; the runtime re-declares them at that scope from here.
const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const all = Object.entries(NAMES).flatMap(([groupKey, nameFn]) =>
  Object.entries(tokens[groupKey]).map(([k, entry]) => ({ name: nameFn(k), entry })),
);
// Same fallback as themedLine(): { value } → both themes, else the theme's own, else light.
const rawFor = (entry, theme) => entry.value ?? entry[theme] ?? entry.light;

const derived = all
  .filter(({ entry }) => ['light', 'dark'].some((theme) => new RegExp(REF.source).test(rawFor(entry, theme))))
  .map(({ name, entry }) => {
    const deps = new Set();
    for (const theme of ['light', 'dark']) {
      for (const m of rawFor(entry, theme).matchAll(REF)) deps.add(m[1]);
    }
    return { name, light: resolveRefs(rawFor(entry, 'light')), dark: resolveRefs(rawFor(entry, 'dark')), deps: [...deps] };
  });

const tokenData = `/*
 * GENERATED from src/tokens/tokens.json by scripts/gen-tokens.mjs. Do not edit by hand.
 */

/** Every token name, without the \`--${p}-\` prefix. */
export type TokenName =
${all.map(({ name }) => `  | ${q(name)}`).join('\n')};

/** A token whose value is computed from other tokens (hovers, tints, focus ring, glows). */
export interface DerivedToken {
  readonly name: TokenName;
  /** The CSS value in the light theme, with \`{ref}\`s already resolved to \`var(--${p}-…)\`. */
  readonly light: string;
  readonly dark: string;
  /** Names of the tokens this one is computed from (either theme). */
  readonly deps: readonly string[];
}

export const DERIVED: readonly DerivedToken[] = [
${derived
  .map(
    (d) =>
      `  { name: ${q(d.name)}, light: ${q(d.light)}, dark: ${q(d.dark)}, deps: [${d.deps.map(q).join(', ')}] },`,
  )
  .join('\n')}
];
`;

writeFileSync(join(root, 'src/js/_tokenData.ts'), tokenData);
console.log('wrote src/js/_tokenData.ts');
