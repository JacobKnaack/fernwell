// Guardrail from the Fernwell blog post: no component may hardcode a value
// that should be a token. Scans src/css/components/*.css and src/css/base.css.
//
//   raw hex (#fff)            → use a --fw-* color token
//   rgb()/rgba()/hsl()        → same
//   var(--x) not --fw-*       → all tokens are prefixed
//   Npx where N ∉ allowlist   → spacing/radius must come from --fw-sp-* / --fw-r-*
//
// Sub-8px sizes (borders, icon boxes, hairlines, control dimensions) are the
// legitimate exceptions; the allowlist covers those. Anything ≥ 8px that isn't
// on the allowlist must be justified with `/* lint: allow-px */` on the line.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  join(root, 'src/css/base.css'),
  ...readdirSync(join(root, 'src/css/components')).map((f) => join(root, 'src/css/components', f)),
];

const PX_ALLOW = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 34, 36, 38, 40, 42, 44, 72, 88,
  // line lengths / breakpoints
  96, 200, 220, 320, 360, 440, 460, 560, 600, 640, 1100,
]);

// Names retired by the semantic-roles rename — catches drift back to the old
// palette-named tokens/classes (marigold, plum, ink, cloud, …).
const RETIRED = /--fw-(ink(?:-fixed|-soft)?|cloud(?:-dim)?|marigold(?:-dk|-lt)?|plum(?:-dk|-bg)?|meadow(?:-bg)?|coral(?:-bg)?|sky(?:-bg)?|on-brand(?:-soft|-fill|-line)?|pending-bg|shadow-(?:marigold|meadow))\b/;

const rules = [
  { name: 'raw hex color', re: /#[0-9a-f]{3,8}\b/gi, skipInMask: true },
  { name: 'raw rgb/hsl color', re: /\b(rgba?|hsla?)\(/g },
  { name: 'unprefixed custom property', re: /var\(--(?!fw-)[\w-]+/g },
  { name: 'retired token name (pre-rename palette token)', re: RETIRED },
  { name: 'retired class name (fw-tag-plum → fw-tag-secondary)', re: /\bfw-tag-plum\b/ },
];

let errors = 0;
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const loc = `${file.replace(root + '/', '')}:${i + 1}`;
    if (line.includes('lint: allow')) return;
    const inDataUri = /url\("data:/.test(line);
    for (const rule of rules) {
      if (rule.skipInMask && inDataUri) continue;
      if (rule.re.test(line)) {
        console.error(`${loc}: ${rule.name}: ${line.trim()}`);
        errors++;
      }
      rule.re.lastIndex = 0;
    }
    // Type sizes are a deliberate per-component scale (no --fw-text-* tokens yet).
    if (/^\s*(font-size|line-height)\s*:/.test(line)) return;
    for (const m of line.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
      const n = Math.abs(parseFloat(m[1]));
      if (!PX_ALLOW.has(n)) {
        console.error(`${loc}: raw px value ${m[0]} (not on allowlist): ${line.trim()}`);
        errors++;
      }
    }
  });
}

if (errors) {
  console.error(`\n${errors} token lint error(s).`);
  process.exit(1);
}
console.log(`token lint: ${files.length} files clean`);
