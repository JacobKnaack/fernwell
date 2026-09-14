// tokens.json → src/css/tokens.css
// The JSON is the single source of truth; never hand-edit tokens.css.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'src/tokens/tokens.json'), 'utf8'));
const p = tokens.prefix;

const line = (name, { value, comment }) =>
  `  --${p}-${name}: ${value};${comment ? ` /* ${comment} */` : ''}`;

const group = (title, entries, nameFn = (k) => k) =>
  [`  /* ===== ${title} ===== */`, ...Object.entries(entries).map(([k, v]) => line(nameFn(k), v))].join('\n');

const light = [
  group('COLOR', tokens.color.light),
  group('TYPE', tokens.font, (k) => `font-${k}`),
  group('SPACING (8pt scale)', tokens.space, (k) => `sp-${k}`),
  group('SHAPE — bigger surface, softer corner', tokens.radius, (k) => `r-${k}`),
  group('ELEVATION', tokens.shadow.light, (k) => `shadow-${k}`),
  group('BORDER', tokens.border, (k) => `border-${k}`),
  group('MOTION', tokens.motion, (k) => `motion-${k}`),
].join('\n\n');

const dark = [
  group('COLOR', tokens.color.dark),
  group('ELEVATION', tokens.shadow.dark, (k) => `shadow-${k}`),
].join('\n\n');

const css = `/*
 * Fernwell design tokens — GENERATED from src/tokens/tokens.json by scripts/gen-tokens.mjs.
 * Do not edit by hand. Override any token in your own stylesheet after this file:
 *   :root { --${p}-marigold: #f0b030; }
 * Dark theme: set data-theme="dark" on <html> (or any ancestor).
 */
:root {
${light}
}

[data-theme="dark"] {
${dark}
}
`;

writeFileSync(join(root, 'src/css/tokens.css'), css);
console.log('wrote src/css/tokens.css');
