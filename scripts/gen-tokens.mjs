// tokens.json → src/css/tokens.css
// The JSON is the single source of truth; never hand-edit tokens.css.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'src/tokens/tokens.json'), 'utf8'));
const p = tokens.prefix;

// Resolve `{name}` references within a group's values to var(--fw-name).
const resolveRefs = (value) => value.replace(/\{([\w-]+)\}/g, (_, name) => `var(--${p}-${name})`);

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
  group('TYPE', tokens.font, (k) => `font-${k}`),
  group('SPACING (8pt scale)', tokens.space, (k) => `sp-${k}`),
  group('SHAPE — bigger surface, softer corner', tokens.radius, (k) => `r-${k}`),
  themedGroup('ELEVATION', tokens.shadow, 'light', (k) => `shadow-${k}`),
  group('BORDER', tokens.border, (k) => `border-${k}`),
  group('MOTION', tokens.motion, (k) => `motion-${k}`),
].join('\n\n');

// Dark theme: every color/shadow token is re-declared. A seed with no `dark`
// value repeats its light value (harmless — keeps the block self-contained);
// a derived token (a `{ref}` value) is *recomputed* here because var()
// resolves relative to where it's declared, not where it's used.
const dark = [
  themedGroup('COLOR', tokens.color, 'dark'),
  themedGroup('ELEVATION', tokens.shadow, 'dark', (k) => `shadow-${k}`),
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
